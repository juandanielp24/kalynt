import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient, SubscriptionStatus, BillingInterval } from '@retail/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as dayjs from 'dayjs';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get all subscriptions
   */
  async getSubscriptions(tenantId: string, options?: {
    status?: SubscriptionStatus;
    customerId?: string;
    planId?: string;
  }) {
    const where: any = { tenantId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.customerId) {
      where.customerId = options.customerId;
    }

    if (options?.planId) {
      where.planId = options.planId;
    }

    const subscriptions = await this.prisma.subscription.findMany({
      where,
      include: {
        plan: true,
        customer: true,
        addons: {
          where: { isActive: true },
          include: {
            addon: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return subscriptions;
  }

  /**
   * Get subscription by ID
   */
  async getSubscription(id: string, tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, tenantId },
      include: {
        plan: true,
        customer: true,
        addons: {
          where: { isActive: true },
          include: {
            addon: true,
          },
        },
        periods: {
          orderBy: { startDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  /**
   * Create subscription
   */
  async createSubscription(tenantId: string, data: {
    planId: string;
    customerId: string;
    startDate?: Date;
    trialDays?: number;
  }) {
    // Get plan
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { id: data.planId, tenantId, isActive: true },
    });

    if (!plan) {
      throw new BadRequestException('Plan not found or inactive');
    }

    // Calculate dates
    const startDate = data.startDate || new Date();
    const trialDays = data.trialDays !== undefined ? data.trialDays : plan.trialDays;

    let trialStartDate: Date | undefined;
    let trialEndDate: Date | undefined;
    let currentPeriodStart: Date;
    let currentPeriodEnd: Date;
    let status: SubscriptionStatus;

    if (trialDays && trialDays > 0) {
      // Trial period
      trialStartDate = startDate;
      trialEndDate = dayjs(startDate).add(trialDays, 'day').toDate();
      currentPeriodStart = trialStartDate;
      currentPeriodEnd = trialEndDate;
      status = SubscriptionStatus.TRIAL;
    } else {
      // Active immediately
      currentPeriodStart = startDate;
      currentPeriodEnd = this.calculatePeriodEnd(startDate, plan.interval, plan.intervalCount);
      status = SubscriptionStatus.ACTIVE;
    }

    // Create subscription
    const subscription = await this.prisma.subscription.create({
      data: {
        tenantId,
        planId: plan.id,
        customerId: data.customerId,
        status,
        price: plan.price,
        interval: plan.interval,
        intervalCount: plan.intervalCount,
        currency: plan.currency,
        trialStartDate,
        trialEndDate,
        currentPeriodStart,
        currentPeriodEnd,
        nextBillingDate: trialEndDate || currentPeriodEnd,
        startedAt: startDate,
      },
      include: {
        plan: true,
        customer: true,
      },
    });

    // Create first period
    await this.prisma.subscriptionPeriod.create({
      data: {
        subscriptionId: subscription.id,
        startDate: currentPeriodStart,
        endDate: currentPeriodEnd,
        amount: status === SubscriptionStatus.TRIAL ? 0 : plan.price,
        status: status === SubscriptionStatus.TRIAL ? 'PENDING' : 'PENDING',
      },
    });

    // Emit event
    this.eventEmitter.emit('subscription.created', {
      subscriptionId: subscription.id,
      tenantId,
      customerId: data.customerId,
      planId: plan.id,
      status,
    });

    this.logger.log(`Subscription created: ${subscription.id}`);

    return subscription;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(id: string, tenantId: string, options?: {
    immediate?: boolean;
    reason?: string;
  }) {
    const subscription = await this.getSubscription(id, tenantId);

    if (subscription.status === SubscriptionStatus.EXPIRED) {
      throw new BadRequestException('Subscription already expired');
    }

    if (subscription.status === SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Subscription already cancelled');
    }

    const updateData: any = {
      cancelledAt: new Date(),
      cancellationReason: options?.reason,
    };

    if (options?.immediate) {
      // Cancel immediately
      updateData.status = SubscriptionStatus.EXPIRED;
      updateData.endedAt = new Date();
      updateData.cancelAtPeriodEnd = false;
    } else {
      // Cancel at period end
      updateData.cancelAtPeriodEnd = true;
      updateData.status = SubscriptionStatus.CANCELLED;
    }

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        plan: true,
        customer: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('subscription.cancelled', {
      subscriptionId: updated.id,
      tenantId,
      customerId: updated.customerId,
      immediate: options?.immediate,
    });

    this.logger.log(`Subscription cancelled: ${id}`);

    return updated;
  }

  /**
   * Reactivate cancelled subscription
   */
  async reactivateSubscription(id: string, tenantId: string) {
    const subscription = await this.getSubscription(id, tenantId);

    if (subscription.status !== SubscriptionStatus.CANCELLED) {
      throw new BadRequestException('Only cancelled subscriptions can be reactivated');
    }

    if (dayjs().isAfter(subscription.currentPeriodEnd)) {
      throw new BadRequestException('Subscription period has already ended');
    }

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        cancelAtPeriodEnd: false,
        cancelledAt: null,
        cancellationReason: null,
      },
      include: {
        plan: true,
        customer: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('subscription.reactivated', {
      subscriptionId: updated.id,
      tenantId,
      customerId: updated.customerId,
    });

    return updated;
  }

  /**
   * Pause subscription
   */
  async pauseSubscription(id: string, tenantId: string, options?: {
    reason?: string;
    resumeAt?: Date;
  }) {
    const subscription = await this.getSubscription(id, tenantId);

    if (subscription.status === SubscriptionStatus.PAUSED) {
      throw new BadRequestException('Subscription already paused');
    }

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Only active subscriptions can be paused');
    }

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.PAUSED,
        pausedAt: new Date(),
        pauseReason: options?.reason,
        resumeAt: options?.resumeAt,
      },
      include: {
        plan: true,
        customer: true,
      },
    });

    return updated;
  }

  /**
   * Resume paused subscription
   */
  async resumeSubscription(id: string, tenantId: string) {
    const subscription = await this.getSubscription(id, tenantId);

    if (subscription.status !== SubscriptionStatus.PAUSED) {
      throw new BadRequestException('Only paused subscriptions can be resumed');
    }

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        pausedAt: null,
        pauseReason: null,
        resumeAt: null,
      },
      include: {
        plan: true,
        customer: true,
      },
    });

    return updated;
  }

  /**
   * Change subscription plan (upgrade/downgrade)
   */
  async changePlan(id: string, tenantId: string, newPlanId: string, options?: {
    immediate?: boolean;
    prorate?: boolean;
  }) {
    const subscription = await this.getSubscription(id, tenantId);

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Only active subscriptions can change plans');
    }

    const newPlan = await this.prisma.subscriptionPlan.findFirst({
      where: { id: newPlanId, tenantId, isActive: true },
    });

    if (!newPlan) {
      throw new BadRequestException('New plan not found or inactive');
    }

    const updateData: any = {
      planId: newPlan.id,
      price: newPlan.price,
      interval: newPlan.interval,
      intervalCount: newPlan.intervalCount,
    };

    if (options?.immediate) {
      // Change immediately and recalculate period
      const newPeriodEnd = this.calculatePeriodEnd(
        new Date(),
        newPlan.interval,
        newPlan.intervalCount
      );

      updateData.currentPeriodStart = new Date();
      updateData.currentPeriodEnd = newPeriodEnd;
      updateData.nextBillingDate = newPeriodEnd;

      // Create new period
      await this.prisma.subscriptionPeriod.create({
        data: {
          subscriptionId: subscription.id,
          startDate: new Date(),
          endDate: newPeriodEnd,
          amount: newPlan.price,
          status: 'PENDING',
        },
      });
    }
    // else: change at period end

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: updateData,
      include: {
        plan: true,
        customer: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('subscription.plan_changed', {
      subscriptionId: updated.id,
      tenantId,
      oldPlanId: subscription.planId,
      newPlanId: newPlan.id,
      immediate: options?.immediate,
    });

    return updated;
  }

  /**
   * Add addon to subscription
   */
  async addAddon(subscriptionId: string, tenantId: string, addonId: string, quantity: number = 1) {
    const subscription = await this.getSubscription(subscriptionId, tenantId);

    if (subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException('Can only add addons to active subscriptions');
    }

    const addon = await this.prisma.planAddon.findUnique({
      where: { id: addonId },
    });

    if (!addon || !addon.isActive) {
      throw new BadRequestException('Addon not found or inactive');
    }

    if (addon.planId !== subscription.planId) {
      throw new BadRequestException('Addon does not belong to subscription plan');
    }

    // Check if addon already exists
    const existing = await this.prisma.subscriptionAddon.findFirst({
      where: {
        subscriptionId,
        addonId,
        isActive: true,
      },
    });

    if (existing) {
      throw new BadRequestException('Addon already added to subscription');
    }

    const subscriptionAddon = await this.prisma.subscriptionAddon.create({
      data: {
        subscriptionId,
        addonId,
        quantity,
        price: addon.price,
        startDate: new Date(),
      },
      include: {
        addon: true,
      },
    });

    return subscriptionAddon;
  }

  /**
   * Remove addon from subscription
   */
  async removeAddon(subscriptionAddonId: string, tenantId: string) {
    const subscriptionAddon = await this.prisma.subscriptionAddon.findUnique({
      where: { id: subscriptionAddonId },
      include: {
        subscription: true,
      },
    });

    if (!subscriptionAddon) {
      throw new NotFoundException('Subscription addon not found');
    }

    if (subscriptionAddon.subscription.tenantId !== tenantId) {
      throw new NotFoundException('Subscription addon not found');
    }

    await this.prisma.subscriptionAddon.update({
      where: { id: subscriptionAddonId },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Calculate period end date
   */
  private calculatePeriodEnd(
    startDate: Date,
    interval: BillingInterval,
    intervalCount: number
  ): Date {
    let endDate = dayjs(startDate);

    switch (interval) {
      case BillingInterval.DAILY:
        endDate = endDate.add(intervalCount, 'day');
        break;
      case BillingInterval.WEEKLY:
        endDate = endDate.add(intervalCount, 'week');
        break;
      case BillingInterval.MONTHLY:
        endDate = endDate.add(intervalCount, 'month');
        break;
      case BillingInterval.QUARTERLY:
        endDate = endDate.add(intervalCount * 3, 'month');
        break;
      case BillingInterval.YEARLY:
        endDate = endDate.add(intervalCount, 'year');
        break;
    }

    return endDate.toDate();
  }

  /**
   * Get subscription statistics
   */
  async getStatistics(tenantId: string) {
    const [
      total,
      byStatus,
      mrr,
      churnRate,
    ] = await Promise.all([
      this.prisma.subscription.count({ where: { tenantId } }),
      this.prisma.subscription.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      this.calculateMRR(tenantId),
      this.calculateChurnRate(tenantId),
    ]);

    return {
      total,
      byStatus,
      monthlyRecurringRevenue: mrr,
      churnRate,
    };
  }

  /**
   * Calculate MRR (Monthly Recurring Revenue)
   */
  private async calculateMRR(tenantId: string): Promise<number> {
    const activeSubscriptions = await this.prisma.subscription.findMany({
      where: {
        tenantId,
        status: SubscriptionStatus.ACTIVE,
      },
      include: {
        addons: {
          where: { isActive: true },
          include: {
            addon: true,
          },
        },
      },
    });

    let mrr = 0;

    for (const sub of activeSubscriptions) {
      // Convert subscription price to monthly
      let monthlyPrice = sub.price;
      if (sub.interval === BillingInterval.YEARLY) {
        monthlyPrice = sub.price / 12;
      } else if (sub.interval === BillingInterval.QUARTERLY) {
        monthlyPrice = sub.price / 3;
      }

      mrr += monthlyPrice;

      // Add addons
      for (const subscriptionAddon of sub.addons) {
        let addonMonthly = subscriptionAddon.price * subscriptionAddon.quantity;
        if (subscriptionAddon.addon.interval === BillingInterval.YEARLY) {
          addonMonthly = addonMonthly / 12;
        } else if (subscriptionAddon.addon.interval === BillingInterval.QUARTERLY) {
          addonMonthly = addonMonthly / 3;
        }
        mrr += addonMonthly;
      }
    }

    return mrr;
  }

  /**
   * Calculate churn rate (last 30 days)
   */
  private async calculateChurnRate(tenantId: string): Promise<number> {
    const thirtyDaysAgo = dayjs().subtract(30, 'day').toDate();

    const [startCount, cancelled] = await Promise.all([
      this.prisma.subscription.count({
        where: {
          tenantId,
          createdAt: { lte: thirtyDaysAgo },
          status: { in: ['ACTIVE', 'CANCELLED', 'EXPIRED'] },
        },
      }),
      this.prisma.subscription.count({
        where: {
          tenantId,
          cancelledAt: { gte: thirtyDaysAgo },
          status: { in: ['CANCELLED', 'EXPIRED'] },
        },
      }),
    ]);

    if (startCount === 0) return 0;

    return (cancelled / startCount) * 100;
  }
}
