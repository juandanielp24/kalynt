import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor';
import { CurrentTenant } from '../auth/decorators/current-tenant.decorator';
import { PlansService } from './plans.service';
import { SubscriptionsService } from './subscriptions.service';
import { BillingService } from './billing.service';
import { UsageService } from './usage.service';
import { BillingInterval, SubscriptionStatus } from '@retail/database';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(AuditInterceptor)
export class SubscriptionsController {
  constructor(
    private readonly plansService: PlansService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly billingService: BillingService,
    private readonly usageService: UsageService,
  ) {}

  // ==================== PLANS ====================

  /**
   * Get all subscription plans
   */
  @Get('plans')
  @RequirePermissions('subscriptions.plans.read')
  async getPlans(
    @CurrentTenant() tenantId: string,
    @Query('isActive') isActive?: string,
  ) {
    const options = isActive !== undefined ? { isActive: isActive === 'true' } : undefined;
    return this.plansService.getPlans(tenantId, options);
  }

  /**
   * Get plan by ID
   */
  @Get('plans/:id')
  @RequirePermissions('subscriptions.plans.read')
  async getPlan(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.plansService.getPlan(id, tenantId);
  }

  /**
   * Create subscription plan
   */
  @Post('plans')
  @RequirePermissions('subscriptions.plans.create')
  async createPlan(
    @CurrentTenant() tenantId: string,
    @Body() data: {
      name: string;
      description?: string;
      price: number;
      interval: BillingInterval;
      intervalCount?: number;
      currency?: string;
      trialDays?: number;
      setupFee?: number;
      features?: any[];
      maxUsers?: number;
      maxProducts?: number;
      maxStorage?: number;
      customLimits?: any;
      displayOrder?: number;
      isPopular?: boolean;
      badge?: string;
    },
  ) {
    return this.plansService.createPlan(tenantId, data);
  }

  /**
   * Update plan
   */
  @Put('plans/:id')
  @RequirePermissions('subscriptions.plans.update')
  async updatePlan(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() data: any,
  ) {
    return this.plansService.updatePlan(id, tenantId, data);
  }

  /**
   * Delete plan
   */
  @Delete('plans/:id')
  @RequirePermissions('subscriptions.plans.delete')
  async deletePlan(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.plansService.deletePlan(id, tenantId);
  }

  /**
   * Toggle plan status
   */
  @Patch('plans/:id/toggle-status')
  @RequirePermissions('subscriptions.plans.update')
  async togglePlanStatus(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.plansService.togglePlanStatus(id, tenantId);
  }

  /**
   * Get plan statistics
   */
  @Get('plans/:id/statistics')
  @RequirePermissions('subscriptions.plans.read')
  async getPlanStatistics(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.plansService.getPlanStatistics(id, tenantId);
  }

  /**
   * Compare plans
   */
  @Get('plans/compare/:currentPlanId/:newPlanId')
  @RequirePermissions('subscriptions.plans.read')
  async comparePlans(
    @Param('currentPlanId') currentPlanId: string,
    @Param('newPlanId') newPlanId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.plansService.comparePlans(currentPlanId, newPlanId, tenantId);
  }

  // ==================== PLAN ADDONS ====================

  /**
   * Create addon for plan
   */
  @Post('plans/:planId/addons')
  @RequirePermissions('subscriptions.plans.create')
  async createAddon(
    @Param('planId') planId: string,
    @CurrentTenant() tenantId: string,
    @Body() data: {
      name: string;
      description?: string;
      price: number;
      interval: BillingInterval;
      intervalCount?: number;
      quantity?: number;
    },
  ) {
    return this.plansService.createAddon(planId, tenantId, data);
  }

  /**
   * Update addon
   */
  @Put('addons/:id')
  @RequirePermissions('subscriptions.plans.update')
  async updateAddon(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.plansService.updateAddon(id, data);
  }

  /**
   * Delete addon
   */
  @Delete('addons/:id')
  @RequirePermissions('subscriptions.plans.delete')
  async deleteAddon(@Param('id') id: string) {
    return this.plansService.deleteAddon(id);
  }

  // ==================== SUBSCRIPTIONS ====================

  /**
   * Get all subscriptions
   */
  @Get()
  @RequirePermissions('subscriptions.read')
  async getSubscriptions(
    @CurrentTenant() tenantId: string,
    @Query('status') status?: SubscriptionStatus,
    @Query('customerId') customerId?: string,
    @Query('planId') planId?: string,
  ) {
    return this.subscriptionsService.getSubscriptions(tenantId, {
      status,
      customerId,
      planId,
    });
  }

  /**
   * Get subscription by ID
   */
  @Get(':id')
  @RequirePermissions('subscriptions.read')
  async getSubscription(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.subscriptionsService.getSubscription(id, tenantId);
  }

  /**
   * Create subscription
   */
  @Post()
  @RequirePermissions('subscriptions.create')
  async createSubscription(
    @CurrentTenant() tenantId: string,
    @Body() data: {
      planId: string;
      customerId: string;
      startDate?: Date;
      trialDays?: number;
    },
  ) {
    return this.subscriptionsService.createSubscription(tenantId, data);
  }

  /**
   * Cancel subscription
   */
  @Post(':id/cancel')
  @RequirePermissions('subscriptions.update')
  async cancelSubscription(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() options?: {
      immediate?: boolean;
      reason?: string;
    },
  ) {
    return this.subscriptionsService.cancelSubscription(id, tenantId, options);
  }

  /**
   * Reactivate cancelled subscription
   */
  @Post(':id/reactivate')
  @RequirePermissions('subscriptions.update')
  async reactivateSubscription(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.subscriptionsService.reactivateSubscription(id, tenantId);
  }

  /**
   * Pause subscription
   */
  @Post(':id/pause')
  @RequirePermissions('subscriptions.update')
  async pauseSubscription(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() options?: {
      reason?: string;
      resumeAt?: Date;
    },
  ) {
    return this.subscriptionsService.pauseSubscription(id, tenantId, options);
  }

  /**
   * Resume paused subscription
   */
  @Post(':id/resume')
  @RequirePermissions('subscriptions.update')
  async resumeSubscription(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.subscriptionsService.resumeSubscription(id, tenantId);
  }

  /**
   * Change subscription plan
   */
  @Post(':id/change-plan')
  @RequirePermissions('subscriptions.update')
  async changePlan(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
    @Body() data: {
      newPlanId: string;
      immediate?: boolean;
      prorate?: boolean;
    },
  ) {
    return this.subscriptionsService.changePlan(
      id,
      tenantId,
      data.newPlanId,
      {
        immediate: data.immediate,
        prorate: data.prorate,
      },
    );
  }

  /**
   * Add addon to subscription
   */
  @Post(':id/addons')
  @RequirePermissions('subscriptions.update')
  async addAddonToSubscription(
    @Param('id') subscriptionId: string,
    @CurrentTenant() tenantId: string,
    @Body() data: {
      addonId: string;
      quantity?: number;
    },
  ) {
    return this.subscriptionsService.addAddon(
      subscriptionId,
      tenantId,
      data.addonId,
      data.quantity || 1,
    );
  }

  /**
   * Remove addon from subscription
   */
  @Delete('addons/:subscriptionAddonId')
  @RequirePermissions('subscriptions.update')
  async removeAddonFromSubscription(
    @Param('subscriptionAddonId') subscriptionAddonId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.subscriptionsService.removeAddon(subscriptionAddonId, tenantId);
  }

  /**
   * Get subscription statistics
   */
  @Get('statistics/overview')
  @RequirePermissions('subscriptions.read')
  async getSubscriptionStatistics(@CurrentTenant() tenantId: string) {
    return this.subscriptionsService.getStatistics(tenantId);
  }

  // ==================== BILLING ====================

  /**
   * Get invoices for customer
   */
  @Get('billing/invoices/customer/:customerId')
  @RequirePermissions('subscriptions.billing.read')
  async getCustomerInvoices(
    @Param('customerId') customerId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.billingService.getCustomerInvoices(customerId, tenantId);
  }

  /**
   * Get invoice by ID
   */
  @Get('billing/invoices/:id')
  @RequirePermissions('subscriptions.billing.read')
  async getInvoice(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.billingService.getInvoice(id, tenantId);
  }

  /**
   * Generate invoice for subscription
   */
  @Post('billing/invoices/generate/:subscriptionId')
  @RequirePermissions('subscriptions.billing.create')
  async generateInvoice(@Param('subscriptionId') subscriptionId: string) {
    return this.billingService.generateInvoice(subscriptionId);
  }

  /**
   * Process payment for invoice
   */
  @Post('billing/invoices/:id/payment')
  @RequirePermissions('subscriptions.billing.update')
  async processPayment(
    @Param('id') invoiceId: string,
    @Body() paymentData: {
      paymentMethod: string;
      transactionId: string;
    },
  ) {
    return this.billingService.processPayment(invoiceId, paymentData);
  }

  /**
   * Mark invoice as failed
   */
  @Post('billing/invoices/:id/failed')
  @RequirePermissions('subscriptions.billing.update')
  async markInvoiceFailed(@Param('id') invoiceId: string) {
    return this.billingService.markInvoiceFailed(invoiceId);
  }

  /**
   * Get billing statistics
   */
  @Get('billing/statistics')
  @RequirePermissions('subscriptions.billing.read')
  async getBillingStatistics(
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.billingService.getBillingStatistics(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Process due invoices (manual trigger)
   */
  @Post('billing/process-due-invoices')
  @RequirePermissions('subscriptions.billing.admin')
  async processDueInvoices() {
    return this.billingService.processDueInvoices();
  }

  // ==================== USAGE ====================

  /**
   * Record usage
   */
  @Post('usage/record')
  @RequirePermissions('subscriptions.usage.create')
  async recordUsage(
    @CurrentTenant() tenantId: string,
    @Body() data: {
      subscriptionId: string;
      metric: string;
      quantity: number;
      recordDate?: Date;
      metadata?: any;
    },
  ) {
    return this.usageService.recordUsage(tenantId, data.subscriptionId, {
      metric: data.metric,
      quantity: data.quantity,
      recordDate: data.recordDate,
      metadata: data.metadata,
    });
  }

  /**
   * Get usage for subscription
   */
  @Get('usage/:subscriptionId')
  @RequirePermissions('subscriptions.usage.read')
  async getUsage(
    @Param('subscriptionId') subscriptionId: string,
    @CurrentTenant() tenantId: string,
    @Query('metric') metric?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.usageService.getUsage(subscriptionId, tenantId, {
      metric,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * Get usage summary
   */
  @Get('usage/:subscriptionId/summary')
  @RequirePermissions('subscriptions.usage.read')
  async getUsageSummary(
    @Param('subscriptionId') subscriptionId: string,
    @CurrentTenant() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.usageService.getUsageSummary(subscriptionId, tenantId, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * Check usage limits
   */
  @Get('usage/:subscriptionId/limits')
  @RequirePermissions('subscriptions.usage.read')
  async checkUsageLimits(
    @Param('subscriptionId') subscriptionId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.usageService.checkUsageLimits(subscriptionId, tenantId);
  }

  /**
   * Get usage over time
   */
  @Get('usage/:subscriptionId/over-time')
  @RequirePermissions('subscriptions.usage.read')
  async getUsageOverTime(
    @Param('subscriptionId') subscriptionId: string,
    @CurrentTenant() tenantId: string,
    @Query('metric') metric: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('interval') interval?: 'day' | 'week' | 'month',
  ) {
    return this.usageService.getUsageOverTime(
      subscriptionId,
      tenantId,
      metric,
      {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        interval,
      },
    );
  }

  /**
   * Increment usage (helper endpoint)
   */
  @Post('usage/increment')
  @RequirePermissions('subscriptions.usage.create')
  async incrementUsage(
    @CurrentTenant() tenantId: string,
    @Body() data: {
      subscriptionId: string;
      metric: string;
      quantity?: number;
    },
  ) {
    return this.usageService.incrementUsage(
      tenantId,
      data.subscriptionId,
      data.metric,
      data.quantity,
    );
  }

  /**
   * Decrement usage (helper endpoint)
   */
  @Post('usage/decrement')
  @RequirePermissions('subscriptions.usage.create')
  async decrementUsage(
    @CurrentTenant() tenantId: string,
    @Body() data: {
      subscriptionId: string;
      metric: string;
      quantity?: number;
    },
  ) {
    return this.usageService.decrementUsage(
      tenantId,
      data.subscriptionId,
      data.metric,
      data.quantity,
    );
  }
}
