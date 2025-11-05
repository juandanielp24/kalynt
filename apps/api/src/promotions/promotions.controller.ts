import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { RequirePermission } from '../auth/decorators/require-permission.decorator';
import { GetTenant } from '../auth/decorators/get-tenant.decorator';
import { AuditLog } from '../audit/decorators/audit-log.decorator';
import { PromotionsService } from './promotions.service';
import { CouponsService } from './coupons.service';
import { DiscountEngineService } from './discount-engine.service';
import { PromotionType, DiscountType } from '@retail/database';

@Controller('promotions')
@UseGuards(JwtAuthGuard, RbacGuard)
export class PromotionsController {
  constructor(
    private promotionsService: PromotionsService,
    private couponsService: CouponsService,
    private discountEngineService: DiscountEngineService,
  ) {}

  /**
   * Get all promotions
   */
  @Get()
  @RequirePermission('PROMOTIONS', 'READ')
  async getPromotions(
    @GetTenant() tenantId: string,
    @Query('isActive') isActive?: string,
    @Query('type') type?: PromotionType,
    @Query('includeExpired') includeExpired?: string,
  ) {
    const options: any = {};

    if (isActive !== undefined) {
      options.isActive = isActive === 'true';
    }

    if (type) {
      options.type = type;
    }

    if (includeExpired !== undefined) {
      options.includeExpired = includeExpired === 'true';
    }

    const promotions = await this.promotionsService.getPromotions(tenantId, options);
    return { promotions };
  }

  /**
   * Get promotion by ID
   */
  @Get(':id')
  @RequirePermission('PROMOTIONS', 'READ')
  async getPromotion(
    @GetTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const promotion = await this.promotionsService.getPromotion(id, tenantId);
    return { promotion };
  }

  /**
   * Create promotion
   */
  @Post()
  @RequirePermission('PROMOTIONS', 'CREATE')
  @AuditLog('CREATE_PROMOTION')
  async createPromotion(
    @GetTenant() tenantId: string,
    @Body() data: {
      name: string;
      description?: string;
      code?: string;
      type: PromotionType;
      discountType: DiscountType;
      discountValue: number;
      startDate: string;
      endDate: string;
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
    },
  ) {
    const promotion = await this.promotionsService.createPromotion(tenantId, {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    });

    return { promotion };
  }

  /**
   * Update promotion
   */
  @Put(':id')
  @RequirePermission('PROMOTIONS', 'UPDATE')
  @AuditLog('UPDATE_PROMOTION')
  async updatePromotion(
    @GetTenant() tenantId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    // Convert dates if provided
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }

    const promotion = await this.promotionsService.updatePromotion(id, tenantId, data);
    return { promotion };
  }

  /**
   * Delete promotion
   */
  @Delete(':id')
  @RequirePermission('PROMOTIONS', 'DELETE')
  @AuditLog('DELETE_PROMOTION')
  async deletePromotion(
    @GetTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.promotionsService.deletePromotion(id, tenantId);
    return result;
  }

  /**
   * Toggle promotion active status
   */
  @Put(':id/toggle')
  @RequirePermission('PROMOTIONS', 'UPDATE')
  @AuditLog('TOGGLE_PROMOTION_STATUS')
  async togglePromotionStatus(
    @GetTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const promotion = await this.promotionsService.togglePromotionStatus(id, tenantId);
    return { promotion };
  }

  /**
   * Get promotion statistics
   */
  @Get(':id/statistics')
  @RequirePermission('PROMOTIONS', 'READ')
  async getPromotionStatistics(
    @GetTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const statistics = await this.promotionsService.getPromotionStatistics(id, tenantId);
    return { statistics };
  }

  /**
   * Get coupons for a promotion
   */
  @Get(':promotionId/coupons')
  @RequirePermission('PROMOTIONS', 'READ')
  async getCoupons(
    @GetTenant() tenantId: string,
    @Param('promotionId') promotionId: string,
    @Query('isActive') isActive?: string,
    @Query('isUsed') isUsed?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    const options: any = {};

    if (isActive !== undefined) {
      options.isActive = isActive === 'true';
    }

    if (isUsed !== undefined) {
      options.isUsed = isUsed === 'true';
    }

    if (assignedTo) {
      options.assignedTo = assignedTo;
    }

    const coupons = await this.couponsService.getCoupons(promotionId, tenantId, options);
    return { coupons };
  }

  /**
   * Create single coupon
   */
  @Post(':promotionId/coupons')
  @RequirePermission('PROMOTIONS', 'CREATE')
  @AuditLog('CREATE_COUPON')
  async createCoupon(
    @GetTenant() tenantId: string,
    @Param('promotionId') promotionId: string,
    @Body() data: {
      code?: string;
      maxUses?: number;
      assignedTo?: string;
    },
  ) {
    const coupon = await this.couponsService.createCoupon(promotionId, tenantId, data);
    return { coupon };
  }

  /**
   * Generate bulk coupons
   */
  @Post(':promotionId/coupons/bulk')
  @RequirePermission('PROMOTIONS', 'CREATE')
  @AuditLog('GENERATE_BULK_COUPONS')
  async generateBulkCoupons(
    @GetTenant() tenantId: string,
    @Param('promotionId') promotionId: string,
    @Body() data: {
      quantity: number;
      prefix?: string;
      maxUsesPerCoupon?: number;
    },
  ) {
    const coupons = await this.couponsService.generateBulkCoupons(promotionId, tenantId, data);
    return { coupons, count: coupons.length };
  }

  /**
   * Validate coupon
   */
  @Post('coupons/validate')
  @RequirePermission('PROMOTIONS', 'READ')
  async validateCoupon(
    @GetTenant() tenantId: string,
    @Body() data: {
      code: string;
      customerId?: string;
      subtotal?: number;
      items?: Array<{ productId: string; quantity: number }>;
    },
  ) {
    const validation = await this.couponsService.validateCoupon(
      data.code,
      tenantId,
      {
        customerId: data.customerId,
        subtotal: data.subtotal,
        items: data.items,
      },
    );

    return validation;
  }

  /**
   * Deactivate coupon
   */
  @Put('coupons/:id/deactivate')
  @RequirePermission('PROMOTIONS', 'UPDATE')
  @AuditLog('DEACTIVATE_COUPON')
  async deactivateCoupon(
    @GetTenant() tenantId: string,
    @Param('id') id: string,
  ) {
    const coupon = await this.couponsService.deactivateCoupon(id, tenantId);
    return { coupon };
  }

  /**
   * Assign coupon to customer
   */
  @Put('coupons/:id/assign')
  @RequirePermission('PROMOTIONS', 'UPDATE')
  @AuditLog('ASSIGN_COUPON')
  async assignCoupon(
    @GetTenant() tenantId: string,
    @Param('id') id: string,
    @Body() data: { customerId: string },
  ) {
    const coupon = await this.couponsService.assignCoupon(id, tenantId, data.customerId);
    return { coupon };
  }

  /**
   * Calculate discounts for a sale
   */
  @Post('calculate')
  @RequirePermission('PROMOTIONS', 'READ')
  async calculateDiscounts(
    @GetTenant() tenantId: string,
    @Body() data: {
      customerId?: string;
      locationId?: string;
      items: Array<{ productId: string; quantity: number; price: number }>;
      couponCode?: string;
    },
  ) {
    const result = await this.discountEngineService.calculateDiscounts(tenantId, data);
    return result;
  }

  /**
   * Get applicable promotions for a sale
   */
  @Get('applicable')
  @RequirePermission('PROMOTIONS', 'READ')
  async getApplicablePromotions(
    @GetTenant() tenantId: string,
    @Query('customerId') customerId?: string,
    @Query('locationId') locationId?: string,
    @Query('subtotal') subtotal?: string,
  ) {
    // Note: In a real scenario, items would be sent in the body via POST
    // This is a simplified version for GET request
    const promotions = await this.promotionsService.getApplicablePromotions(
      tenantId,
      {
        customerId,
        locationId,
        items: [], // Would need items from request
        subtotal: subtotal ? parseFloat(subtotal) : 0,
      },
    );

    return { promotions };
  }
}
