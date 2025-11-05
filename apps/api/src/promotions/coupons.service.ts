import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import { randomBytes } from 'crypto';

@Injectable()
export class CouponsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Generate unique coupon code
   */
  private generateCode(length: number = 8, prefix?: string): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters
    let code = '';

    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return prefix ? `${prefix}${code}` : code;
  }

  /**
   * Get all coupons for a promotion
   */
  async getCoupons(promotionId: string, tenantId: string, options?: {
    isActive?: boolean;
    isUsed?: boolean;
    assignedTo?: string;
  }) {
    const where: any = { promotionId, tenantId };

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.isUsed !== undefined) {
      where.isUsed = options.isUsed;
    }

    if (options?.assignedTo) {
      where.assignedTo = options.assignedTo;
    }

    const coupons = await this.prisma.coupon.findMany({
      where,
      include: {
        promotion: true,
        customer: true,
        usedByCustomer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return coupons;
  }

  /**
   * Get coupon by code
   */
  async getCouponByCode(code: string, tenantId: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { code, tenantId },
      include: {
        promotion: true,
        customer: true,
      },
    });

    return coupon;
  }

  /**
   * Create single coupon
   */
  async createCoupon(
    promotionId: string,
    tenantId: string,
    data?: {
      code?: string;
      maxUses?: number;
      assignedTo?: string;
    }
  ) {
    // Verify promotion exists
    const promotion = await this.prisma.promotion.findFirst({
      where: { id: promotionId, tenantId },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    // Generate or validate code
    let code = data?.code;

    if (!code) {
      // Generate unique code
      let attempts = 0;
      do {
        code = this.generateCode(8);
        const existing = await this.getCouponByCode(code, tenantId);
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        throw new Error('Could not generate unique coupon code');
      }
    } else {
      // Check if code already exists
      const existing = await this.getCouponByCode(code, tenantId);
      if (existing) {
        throw new BadRequestException('Coupon code already exists');
      }
    }

    const coupon = await this.prisma.coupon.create({
      data: {
        tenantId,
        promotionId,
        code: code!,
        maxUses: data?.maxUses,
        assignedTo: data?.assignedTo,
        assignedAt: data?.assignedTo ? new Date() : undefined,
      },
      include: {
        promotion: true,
      },
    });

    return coupon;
  }

  /**
   * Generate multiple coupons
   */
  async generateBulkCoupons(
    promotionId: string,
    tenantId: string,
    data: {
      quantity: number;
      prefix?: string;
      maxUsesPerCoupon?: number;
    }
  ) {
    if (data.quantity > 1000) {
      throw new BadRequestException('Cannot generate more than 1000 coupons at once');
    }

    // Verify promotion exists
    const promotion = await this.prisma.promotion.findFirst({
      where: { id: promotionId, tenantId },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    const coupons = [];
    const codes = new Set<string>();

    // Generate unique codes
    for (let i = 0; i < data.quantity; i++) {
      let code: string;
      let attempts = 0;

      do {
        code = this.generateCode(8, data.prefix);
        attempts++;

        if (attempts > 100) {
          throw new Error('Could not generate enough unique codes');
        }
      } while (codes.has(code));

      codes.add(code);
    }

    // Create coupons in batch
    const couponData = Array.from(codes).map((code) => ({
      tenantId,
      promotionId,
      code,
      maxUses: data.maxUsesPerCoupon,
    }));

    await this.prisma.coupon.createMany({
      data: couponData,
    });

    // Fetch created coupons
    const created = await this.prisma.coupon.findMany({
      where: {
        tenantId,
        promotionId,
        code: { in: Array.from(codes) },
      },
    });

    return created;
  }

  /**
   * Validate coupon
   */
  async validateCoupon(
    code: string,
    tenantId: string,
    data?: {
      customerId?: string;
      subtotal?: number;
      items?: Array<{ productId: string; quantity: number }>;
    }
  ) {
    const coupon = await this.getCouponByCode(code, tenantId);

    if (!coupon) {
      return {
        valid: false,
        reason: 'Cupón no encontrado',
      };
    }

    if (!coupon.isActive) {
      return {
        valid: false,
        reason: 'Cupón desactivado',
      };
    }

    // Check if coupon is used (for single-use coupons)
    if (coupon.maxUses === 1 && coupon.isUsed) {
      return {
        valid: false,
        reason: 'Cupón ya utilizado',
      };
    }

    // Check usage limits
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return {
        valid: false,
        reason: 'Cupón alcanzó límite de usos',
      };
    }

    // Check if assigned to specific customer
    if (coupon.assignedTo && data?.customerId !== coupon.assignedTo) {
      return {
        valid: false,
        reason: 'Cupón asignado a otro cliente',
      };
    }

    // Validate promotion
    const promotion = coupon.promotion;

    if (!promotion.isActive) {
      return {
        valid: false,
        reason: 'Promoción desactivada',
      };
    }

    const now = new Date();

    if (now < promotion.startDate) {
      return {
        valid: false,
        reason: 'Promoción aún no comenzó',
      };
    }

    if (now > promotion.endDate) {
      return {
        valid: false,
        reason: 'Promoción expirada',
      };
    }

    // Check promotion usage limits
    if (promotion.maxUses && promotion.currentUses >= promotion.maxUses) {
      return {
        valid: false,
        reason: 'Promoción alcanzó límite de usos',
      };
    }

    // Check minimum purchase
    if (data?.subtotal && promotion.minPurchaseAmount) {
      if (data.subtotal < promotion.minPurchaseAmount) {
        return {
          valid: false,
          reason: `Compra mínima requerida: $${promotion.minPurchaseAmount}`,
        };
      }
    }

    return {
      valid: true,
      coupon,
      promotion,
    };
  }

  /**
   * Deactivate coupon
   */
  async deactivateCoupon(id: string, tenantId: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { id, tenantId },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const updated = await this.prisma.coupon.update({
      where: { id },
      data: { isActive: false },
    });

    return updated;
  }

  /**
   * Assign coupon to customer
   */
  async assignCoupon(id: string, tenantId: string, customerId: string) {
    const coupon = await this.prisma.coupon.findFirst({
      where: { id, tenantId },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    if (coupon.assignedTo) {
      throw new BadRequestException('Coupon already assigned');
    }

    const updated = await this.prisma.coupon.update({
      where: { id },
      data: {
        assignedTo: customerId,
        assignedAt: new Date(),
      },
    });

    return updated;
  }
}
