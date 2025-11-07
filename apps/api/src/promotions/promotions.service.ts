import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, PromotionType, DiscountType } from '@retail/database';
import * as dayjs from 'dayjs';

@Injectable()
export class PromotionsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get all promotions
   */
  async getPromotions(tenantId: string, options?: {
    isActive?: boolean;
    type?: PromotionType;
    includeExpired?: boolean;
  }) {
    const where: any = { tenantId };

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.type) {
      where.type = options.type;
    }

    if (!options?.includeExpired) {
      where.endDate = { gte: new Date() };
    }

    const promotions = await this.prisma.promotion.findMany({
      where,
      include: {
        _count: {
          select: {
            coupons: true,
            usageHistory: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { startDate: 'desc' },
      ],
    });

    return promotions;
  }

  /**
   * Get promotion by ID
   */
  async getPromotion(id: string, tenantId: string) {
    const promotion = await this.prisma.promotion.findFirst({
      where: { id, tenantId },
      include: {
        coupons: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        usageHistory: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: true,
            sale: true,
          },
        },
        _count: {
          select: {
            coupons: true,
            usageHistory: true,
          },
        },
      },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    return promotion;
  }

  /**
   * Create promotion
   */
  async createPromotion(tenantId: string, data: {
    name: string;
    description?: string;
    code?: string;
    type: PromotionType;
    discountType: DiscountType;
    discountValue: number;
    startDate: Date;
    endDate: Date;
    maxUses?: number;
    maxUsesPerCustomer?: number;
    minPurchaseAmount?: number;
    maxDiscountAmount?: number;
    applicableToAll?: boolean;
    applicableProducts?: string[];
    applicableCategories?: string[];
    excludedProducts?: string[];
    applicableLocations?: string[];
    applicableToNewCustomers?: boolean;
    applicableToReturningCustomers?: boolean;
    canStackWithOthers?: boolean;
    priority?: number;
    autoApply?: boolean;
  }) {
    // Validate dates
    if (dayjs(data.endDate).isBefore(data.startDate)) {
      throw new BadRequestException('End date must be after start date');
    }

    // Validate discount value
    if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    if (data.discountValue < 0) {
      throw new BadRequestException('Discount value must be positive');
    }

    // Check if code is unique (if provided)
    if (data.code) {
      const existing = await this.prisma.promotion.findFirst({
        where: {
          tenantId,
          code: data.code,
        },
      });

      if (existing) {
        throw new BadRequestException('Promotion code already exists');
      }
    }

    const promotion = await this.prisma.promotion.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        code: data.code,
        type: data.type,
        discountType: data.discountType,
        discountValue: data.discountValue,
        startDate: data.startDate,
        endDate: data.endDate,
        maxUses: data.maxUses,
        maxUsesPerCustomer: data.maxUsesPerCustomer,
        minPurchaseAmount: data.minPurchaseAmount,
        maxDiscountAmount: data.maxDiscountAmount,
        applicableToAll: data.applicableToAll ?? true,
        applicableProducts: data.applicableProducts,
        applicableCategories: data.applicableCategories,
        excludedProducts: data.excludedProducts,
        applicableLocations: data.applicableLocations,
        applicableToNewCustomers: data.applicableToNewCustomers ?? false,
        applicableToReturningCustomers: data.applicableToReturningCustomers ?? false,
        canStackWithOthers: data.canStackWithOthers ?? false,
        priority: data.priority ?? 0,
        autoApply: data.autoApply ?? false,
      },
    });

    return promotion;
  }

  /**
   * Update promotion
   */
  async updatePromotion(id: string, tenantId: string, data: any) {
    await this.getPromotion(id, tenantId); // Verify exists

    // Validate dates if provided
    if (data.startDate && data.endDate) {
      if (dayjs(data.endDate).isBefore(data.startDate)) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    // Check code uniqueness if changing
    if (data.code) {
      const existing = await this.prisma.promotion.findFirst({
        where: {
          tenantId,
          code: data.code,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException('Promotion code already exists');
      }
    }

    const promotion = await this.prisma.promotion.update({
      where: { id },
      data,
    });

    return promotion;
  }

  /**
   * Delete promotion
   */
  async deletePromotion(id: string, tenantId: string) {
    await this.getPromotion(id, tenantId); // Verify exists

    // Check if promotion has been used
    const usageCount = await this.prisma.promotionUsage.count({
      where: { promotionId: id },
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        'Cannot delete promotion that has been used. Consider deactivating instead.'
      );
    }

    await this.prisma.promotion.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Toggle promotion active status
   */
  async togglePromotionStatus(id: string, tenantId: string) {
    const promotion = await this.getPromotion(id, tenantId);

    const updated = await this.prisma.promotion.update({
      where: { id },
      data: { isActive: !promotion.isActive },
    });

    return updated;
  }

  /**
   * Get promotion statistics
   */
  async getPromotionStatistics(id: string, tenantId: string) {
    const promotion = await this.getPromotion(id, tenantId);

    const usage = await this.prisma.promotionUsage.findMany({
      where: { promotionId: id },
      include: {
        customer: true,
      },
    });

    const totalDiscountGiven = usage.reduce((sum, u) => sum + u.discountAmount, 0);
    const totalRevenue = usage.reduce((sum, u) => sum + u.finalAmount, 0);
    const totalOriginalAmount = usage.reduce((sum, u) => sum + u.originalAmount, 0);

    const uniqueCustomers = new Set(usage.map((u) => u.customerId).filter(Boolean)).size;

    // Calculate ROI (simplified - would need cost data for accurate calculation)
    const averageDiscountPerUse = usage.length > 0 ? totalDiscountGiven / usage.length : 0;

    return {
      totalUses: promotion.currentUses,
      totalDiscountGiven,
      totalRevenue,
      totalOriginalAmount,
      averageDiscountPerUse,
      uniqueCustomers,
      averageRevenuePerUse: usage.length > 0 ? totalRevenue / usage.length : 0,
      usageByDate: this.groupUsageByDate(usage),
      topCustomers: this.getTopCustomers(usage),
    };
  }

  /**
   * Get applicable promotions for a sale
   */
  async getApplicablePromotions(
    tenantId: string,
    data: {
      customerId?: string;
      locationId?: string;
      items: Array<{ productId: string; quantity: number; price: number }>;
      subtotal: number;
    }
  ) {
    const now = new Date();

    // Get all active promotions
    const promotions = await this.prisma.promotion.findMany({
      where: {
        tenantId,
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
        OR: [
          { maxUses: null },
          { currentUses: { lt: this.prisma.promotion.fields.maxUses } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { discountValue: 'desc' },
      ],
    });

    // Filter applicable promotions
    const applicable: typeof promotions = [];

    for (const promo of promotions) {
      if (await this.isPromotionApplicable(promo, data)) {
        applicable.push(promo);
      }
    }

    return applicable;
  }

  /**
   * Check if promotion is applicable
   */
  private async isPromotionApplicable(promotion: any, data: any): Promise<boolean> {
    // Check minimum purchase amount
    if (promotion.minPurchaseAmount && data.subtotal < promotion.minPurchaseAmount) {
      return false;
    }

    // Check location
    if (
      promotion.applicableLocations &&
      Array.isArray(promotion.applicableLocations) &&
      promotion.applicableLocations.length > 0
    ) {
      if (!data.locationId || !promotion.applicableLocations.includes(data.locationId)) {
        return false;
      }
    }

    // Check products/categories
    if (!promotion.applicableToAll) {
      const productIds = data.items.map((item: any) => item.productId);

      // Get product details
      const products = await this.prisma.product.findMany({
        where: {
          id: { in: productIds },
        },
        select: {
          id: true,
          categoryId: true,
        },
      });

      const categoryIds = products.map((p) => p.categoryId).filter(Boolean);

      // Check if any product matches
      let hasMatch = false;

      if (
        promotion.applicableProducts &&
        Array.isArray(promotion.applicableProducts) &&
        promotion.applicableProducts.length > 0
      ) {
        hasMatch = productIds.some((id) => promotion.applicableProducts.includes(id));
      }

      if (
        !hasMatch &&
        promotion.applicableCategories &&
        Array.isArray(promotion.applicableCategories) &&
        promotion.applicableCategories.length > 0
      ) {
        hasMatch = categoryIds.some((id) => promotion.applicableCategories.includes(id));
      }

      if (!hasMatch) {
        return false;
      }

      // Check excluded products
      if (
        promotion.excludedProducts &&
        Array.isArray(promotion.excludedProducts) &&
        promotion.excludedProducts.length > 0
      ) {
        const hasExcluded = productIds.some((id) => promotion.excludedProducts.includes(id));
        if (hasExcluded) {
          return false;
        }
      }
    }

    // Check customer-specific rules
    if (data.customerId) {
      // Check usage per customer
      if (promotion.maxUsesPerCustomer) {
        const customerUsage = await this.prisma.promotionUsage.count({
          where: {
            promotionId: promotion.id,
            customerId: data.customerId,
          },
        });

        if (customerUsage >= promotion.maxUsesPerCustomer) {
          return false;
        }
      }

      // Check new/returning customer rules
      if (promotion.applicableToNewCustomers || promotion.applicableToReturningCustomers) {
        const customer = await this.prisma.customer.findUnique({
          where: { id: data.customerId },
          include: {
            sales: true,
          },
        });

        if (!customer) return false;

        const isNewCustomer = customer.sales.length === 0;

        if (promotion.applicableToNewCustomers && !isNewCustomer) {
          return false;
        }

        if (promotion.applicableToReturningCustomers && isNewCustomer) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Helper: Group usage by date
   */
  private groupUsageByDate(usage: any[]) {
    const grouped: Record<string, { count: number; discount: number; revenue: number }> = {};

    usage.forEach((u) => {
      const date = dayjs(u.createdAt).format('YYYY-MM-DD');

      if (!grouped[date]) {
        grouped[date] = { count: 0, discount: 0, revenue: 0 };
      }

      grouped[date].count += 1;
      grouped[date].discount += u.discountAmount;
      grouped[date].revenue += u.finalAmount;
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Helper: Get top customers
   */
  private getTopCustomers(usage: any[]) {
    const customerMap: Record<
      string,
      { customerId: string; name: string; uses: number; totalDiscount: number }
    > = {};

    usage.forEach((u) => {
      if (!u.customerId) return;

      if (!customerMap[u.customerId]) {
        customerMap[u.customerId] = {
          customerId: u.customerId,
          name: u.customer?.name || 'Unknown',
          uses: 0,
          totalDiscount: 0,
        };
      }

      customerMap[u.customerId].uses += 1;
      customerMap[u.customerId].totalDiscount += u.discountAmount;
    });

    return Object.values(customerMap)
      .sort((a, b) => b.uses - a.uses)
      .slice(0, 10);
  }
}
