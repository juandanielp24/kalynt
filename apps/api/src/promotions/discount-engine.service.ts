import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient, DiscountType } from '@retail/database';
import { PromotionsService } from './promotions.service';
import { CouponsService } from './coupons.service';

export interface CalculationItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  categoryId?: string;
}

export interface DiscountResult {
  appliedPromotions: AppliedPromotion[];
  originalAmount: number;
  totalDiscount: number;
  finalAmount: number;
  items: CalculationItem[];
}

export interface AppliedPromotion {
  promotionId: string;
  promotionName: string;
  couponId?: string;
  couponCode?: string;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  appliedToItems: string[];
}

@Injectable()
export class DiscountEngineService {
  private readonly logger = new Logger(DiscountEngineService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private promotionsService: PromotionsService,
    private couponsService: CouponsService,
  ) {}

  /**
   * Calculate discounts for a sale
   */
  async calculateDiscounts(
    tenantId: string,
    data: {
      customerId?: string;
      locationId?: string;
      items: Array<{ productId: string; quantity: number; price: number }>;
      couponCode?: string;
    }
  ): Promise<DiscountResult> {
    const items: CalculationItem[] = [];
    let originalAmount = 0;

    // Get product details
    const productIds = data.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        categoryId: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Build items with full details
    for (const item of data.items) {
      const product = productMap.get(item.productId);
      const subtotal = item.price * item.quantity;

      items.push({
        productId: item.productId,
        name: product?.name || 'Unknown',
        quantity: item.quantity,
        unitPrice: item.price,
        subtotal,
        categoryId: product?.categoryId || undefined,
      });

      originalAmount += subtotal;
    }

    const appliedPromotions: AppliedPromotion[] = [];

    // Step 1: Apply coupon if provided
    if (data.couponCode) {
      const couponResult = await this.applyCoupon(
        tenantId,
        data.couponCode,
        {
          customerId: data.customerId,
          locationId: data.locationId,
          items,
          subtotal: originalAmount,
        }
      );

      if (couponResult) {
        appliedPromotions.push(couponResult);
      }
    }

    // Step 2: Get applicable automatic promotions
    const autoPromotions = await this.promotionsService.getApplicablePromotions(
      tenantId,
      {
        customerId: data.customerId,
        locationId: data.locationId,
        items: data.items,
        subtotal: originalAmount,
      }
    );

    // Filter out coupon-type promotions and already applied promotions
    const eligibleAutoPromotions = autoPromotions.filter((promo) => {
      if (promo.type === 'COUPON') return false;
      if (appliedPromotions.some((ap) => ap.promotionId === promo.id)) return false;
      return true;
    });

    // Step 3: Apply automatic promotions based on priority and stackability
    for (const promotion of eligibleAutoPromotions) {
      // Check if we can stack
      if (appliedPromotions.length > 0 && !promotion.canStackWithOthers) {
        continue;
      }

      // Check if already applied promotions allow stacking
      const cannotStack = appliedPromotions.some((ap) => {
        const appliedPromo = autoPromotions.find((p) => p.id === ap.promotionId);
        return appliedPromo && !appliedPromo.canStackWithOthers;
      });

      if (cannotStack) {
        continue;
      }

      const applied = await this.applyPromotion(promotion, items, originalAmount);

      if (applied) {
        appliedPromotions.push(applied);
      }
    }

    // Calculate total discount
    const totalDiscount = appliedPromotions.reduce(
      (sum, promo) => sum + promo.discountAmount,
      0
    );

    const finalAmount = Math.max(0, originalAmount - totalDiscount);

    return {
      appliedPromotions,
      originalAmount,
      totalDiscount,
      finalAmount,
      items,
    };
  }

  /**
   * Apply coupon discount
   */
  private async applyCoupon(
    tenantId: string,
    couponCode: string,
    data: {
      customerId?: string;
      locationId?: string;
      items: CalculationItem[];
      subtotal: number;
    }
  ): Promise<AppliedPromotion | null> {
    // Validate coupon
    const validation = await this.couponsService.validateCoupon(
      couponCode,
      tenantId,
      {
        customerId: data.customerId,
        subtotal: data.subtotal,
        items: data.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }
    );

    if (!validation.valid || !validation.coupon || !validation.promotion) {
      this.logger.warn(`Invalid coupon: ${couponCode} - ${validation.reason}`);
      throw new Error(validation.reason);
    }

    const promotion = validation.promotion;
    const coupon = validation.coupon;

    // Calculate discount
    const discount = this.calculatePromotionDiscount(
      promotion,
      data.items,
      data.subtotal
    );

    if (discount.discountAmount === 0) {
      return null;
    }

    return {
      promotionId: promotion.id,
      promotionName: promotion.name,
      couponId: coupon.id,
      couponCode: coupon.code,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      discountAmount: discount.discountAmount,
      appliedToItems: discount.appliedToItems,
    };
  }

  /**
   * Apply promotion discount
   */
  private async applyPromotion(
    promotion: any,
    items: CalculationItem[],
    subtotal: number
  ): Promise<AppliedPromotion | null> {
    const discount = this.calculatePromotionDiscount(promotion, items, subtotal);

    if (discount.discountAmount === 0) {
      return null;
    }

    return {
      promotionId: promotion.id,
      promotionName: promotion.name,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue,
      discountAmount: discount.discountAmount,
      appliedToItems: discount.appliedToItems,
    };
  }

  /**
   * Calculate promotion discount amount
   */
  private calculatePromotionDiscount(
    promotion: any,
    items: CalculationItem[],
    subtotal: number
  ): { discountAmount: number; appliedToItems: string[] } {
    let discountAmount = 0;
    const appliedToItems: string[] = [];

    // Filter applicable items
    let applicableItems = items;

    if (!promotion.applicableToAll) {
      applicableItems = items.filter((item) => {
        // Check if product is in applicable products
        if (
          promotion.applicableProducts &&
          Array.isArray(promotion.applicableProducts) &&
          promotion.applicableProducts.length > 0
        ) {
          if (promotion.applicableProducts.includes(item.productId)) {
            return true;
          }
        }

        // Check if product category is in applicable categories
        if (
          item.categoryId &&
          promotion.applicableCategories &&
          Array.isArray(promotion.applicableCategories) &&
          promotion.applicableCategories.length > 0
        ) {
          if (promotion.applicableCategories.includes(item.categoryId)) {
            return true;
          }
        }

        return false;
      });

      // Filter out excluded products
      if (
        promotion.excludedProducts &&
        Array.isArray(promotion.excludedProducts) &&
        promotion.excludedProducts.length > 0
      ) {
        applicableItems = applicableItems.filter(
          (item) => !promotion.excludedProducts.includes(item.productId)
        );
      }
    }

    if (applicableItems.length === 0) {
      return { discountAmount: 0, appliedToItems: [] };
    }

    const applicableSubtotal = applicableItems.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    // Calculate discount based on type
    switch (promotion.discountType) {
      case 'PERCENTAGE':
        discountAmount = (applicableSubtotal * promotion.discountValue) / 100;
        appliedToItems.push(...applicableItems.map((i) => i.productId));
        break;

      case 'FIXED_AMOUNT':
        discountAmount = Math.min(promotion.discountValue, applicableSubtotal);
        appliedToItems.push(...applicableItems.map((i) => i.productId));
        break;

      case 'FREE_SHIPPING':
        // This would be handled separately in the sale process
        discountAmount = 0; // Actual shipping cost would be calculated
        break;

      case 'BUY_X_GET_Y':
        // Simplified buy X get Y logic
        // Would need more configuration for full implementation
        const totalQuantity = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
        const requiredQty = 2; // Could be configurable
        const freeQty = 1; // Could be configurable

        if (totalQuantity >= requiredQty) {
          // Sort items by price (descending) to give discount on cheapest
          const sortedItems = [...applicableItems].sort(
            (a, b) => b.unitPrice - a.unitPrice
          );

          const freeItem = sortedItems[sortedItems.length - 1];
          const freeSets = Math.floor(totalQuantity / (requiredQty + freeQty));

          discountAmount = freeItem.unitPrice * Math.min(freeSets * freeQty, freeItem.quantity);
          appliedToItems.push(freeItem.productId);
        }
        break;

      case 'FIXED_PRICE':
        // Set all applicable items to a fixed price
        const currentTotal = applicableSubtotal;
        const newTotal = promotion.discountValue * applicableItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        discountAmount = Math.max(0, currentTotal - newTotal);
        appliedToItems.push(...applicableItems.map((i) => i.productId));
        break;

      default:
        discountAmount = 0;
    }

    // Apply maximum discount cap if set
    if (promotion.maxDiscountAmount && discountAmount > promotion.maxDiscountAmount) {
      discountAmount = promotion.maxDiscountAmount;
    }

    return { discountAmount, appliedToItems };
  }

  /**
   * Record promotion usage
   */
  async recordPromotionUsage(
    tenantId: string,
    saleId: string,
    customerId: string | undefined,
    appliedPromotions: AppliedPromotion[],
    originalAmount: number,
    finalAmount: number
  ) {
    for (const applied of appliedPromotions) {
      // Create usage record
      await this.prisma.promotionUsage.create({
        data: {
          tenantId,
          promotionId: applied.promotionId,
          couponId: applied.couponId,
          saleId,
          customerId,
          discountAmount: applied.discountAmount,
          originalAmount,
          finalAmount,
          appliedToItems: applied.appliedToItems,
        },
      });

      // Update promotion usage count
      await this.prisma.promotion.update({
        where: { id: applied.promotionId },
        data: {
          currentUses: { increment: 1 },
        },
      });

      // Update coupon if applicable
      if (applied.couponId) {
        const coupon = await this.prisma.coupon.findUnique({
          where: { id: applied.couponId },
        });

        if (coupon) {
          const updateData: any = {
            currentUses: { increment: 1 },
          };

          // Mark as used if single-use coupon
          if (coupon.maxUses === 1) {
            updateData.isUsed = true;
            updateData.usedBy = customerId;
            updateData.usedAt = new Date();
            updateData.usedInSale = saleId;
          }

          await this.prisma.coupon.update({
            where: { id: applied.couponId },
            data: updateData,
          });
        }
      }
    }
  }
}
