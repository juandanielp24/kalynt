import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, BillingInterval } from '@retail/database';

@Injectable()
export class PlansService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get all subscription plans
   */
  async getPlans(tenantId: string, options?: { isActive?: boolean }) {
    const where: any = { tenantId };

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    const plans = await this.prisma.subscriptionPlan.findMany({
      where,
      include: {
        addons: {
          where: { isActive: true },
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return plans;
  }

  /**
   * Get plan by ID
   */
  async getPlan(id: string, tenantId: string) {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { id, tenantId },
      include: {
        addons: {
          where: { isActive: true },
        },
        _count: {
          select: {
            subscriptions: {
              where: {
                status: { in: ['TRIAL', 'ACTIVE'] },
              },
            },
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  /**
   * Create subscription plan
   */
  async createPlan(tenantId: string, data: {
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
  }) {
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        price: data.price,
        interval: data.interval,
        intervalCount: data.intervalCount || 1,
        currency: data.currency || 'USD',
        trialDays: data.trialDays,
        setupFee: data.setupFee,
        features: data.features,
        maxUsers: data.maxUsers,
        maxProducts: data.maxProducts,
        maxStorage: data.maxStorage,
        customLimits: data.customLimits,
        displayOrder: data.displayOrder || 0,
        isPopular: data.isPopular || false,
        badge: data.badge,
      },
    });

    return plan;
  }

  /**
   * Update plan
   */
  async updatePlan(id: string, tenantId: string, data: any) {
    await this.getPlan(id, tenantId); // Verify exists

    const plan = await this.prisma.subscriptionPlan.update({
      where: { id },
      data,
    });

    return plan;
  }

  /**
   * Delete plan
   */
  async deletePlan(id: string, tenantId: string) {
    await this.getPlan(id, tenantId); // Verify exists

    // Check if plan has active subscriptions
    const activeSubscriptions = await this.prisma.subscription.count({
      where: {
        planId: id,
        status: { in: ['TRIAL', 'ACTIVE'] },
      },
    });

    if (activeSubscriptions > 0) {
      throw new BadRequestException(
        `Cannot delete plan with ${activeSubscriptions} active subscriptions. Deactivate instead.`
      );
    }

    await this.prisma.subscriptionPlan.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Toggle plan status
   */
  async togglePlanStatus(id: string, tenantId: string) {
    const plan = await this.getPlan(id, tenantId);

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: { isActive: !plan.isActive },
    });

    return updated;
  }

  /**
   * Create addon for plan
   */
  async createAddon(planId: string, tenantId: string, data: {
    name: string;
    description?: string;
    price: number;
    interval: BillingInterval;
    intervalCount?: number;
    quantity?: number;
  }) {
    // Verify plan exists
    await this.getPlan(planId, tenantId);

    const addon = await this.prisma.planAddon.create({
      data: {
        planId,
        name: data.name,
        description: data.description,
        price: data.price,
        interval: data.interval,
        intervalCount: data.intervalCount || 1,
        quantity: data.quantity,
      },
    });

    return addon;
  }

  /**
   * Update addon
   */
  async updateAddon(id: string, data: any) {
    const addon = await this.prisma.planAddon.findUnique({
      where: { id },
    });

    if (!addon) {
      throw new NotFoundException('Addon not found');
    }

    const updated = await this.prisma.planAddon.update({
      where: { id },
      data,
    });

    return updated;
  }

  /**
   * Delete addon
   */
  async deleteAddon(id: string) {
    const addon = await this.prisma.planAddon.findUnique({
      where: { id },
    });

    if (!addon) {
      throw new NotFoundException('Addon not found');
    }

    // Check if addon has active subscriptions
    const activeSubscriptionAddons = await this.prisma.subscriptionAddon.count({
      where: {
        addonId: id,
        isActive: true,
      },
    });

    if (activeSubscriptionAddons > 0) {
      throw new BadRequestException(
        'Cannot delete addon with active subscriptions'
      );
    }

    await this.prisma.planAddon.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Get plan statistics
   */
  async getPlanStatistics(id: string, tenantId: string) {
    await this.getPlan(id, tenantId); // Verify exists

    const [
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      cancelledSubscriptions,
      revenue,
    ] = await Promise.all([
      this.prisma.subscription.count({
        where: { planId: id },
      }),
      this.prisma.subscription.count({
        where: {
          planId: id,
          status: 'ACTIVE',
        },
      }),
      this.prisma.subscription.count({
        where: {
          planId: id,
          status: 'TRIAL',
        },
      }),
      this.prisma.subscription.count({
        where: {
          planId: id,
          status: { in: ['CANCELLED', 'EXPIRED'] },
        },
      }),
      this.prisma.subscription.aggregate({
        where: {
          planId: id,
          status: 'ACTIVE',
        },
        _sum: {
          price: true,
        },
      }),
    ]);

    return {
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      cancelledSubscriptions,
      monthlyRecurringRevenue: revenue._sum.price || 0,
      conversionRate:
        totalSubscriptions > 0
          ? (activeSubscriptions / totalSubscriptions) * 100
          : 0,
    };
  }

  /**
   * Compare plans (for upgrades/downgrades)
   */
  async comparePlans(currentPlanId: string, newPlanId: string, tenantId: string) {
    const [currentPlan, newPlan] = await Promise.all([
      this.getPlan(currentPlanId, tenantId),
      this.getPlan(newPlanId, tenantId),
    ]);

    const priceDifference = newPlan.price - currentPlan.price;
    const isUpgrade = priceDifference > 0;

    return {
      currentPlan,
      newPlan,
      priceDifference,
      isUpgrade,
      percentageChange: currentPlan.price > 0
        ? (priceDifference / currentPlan.price) * 100
        : 0,
    };
  }
}
