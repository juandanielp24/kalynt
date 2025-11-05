import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import * as dayjs from 'dayjs';

@Injectable()
export class UsageService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Record usage
   */
  async recordUsage(tenantId: string, subscriptionId: string, data: {
    metric: string;
    quantity: number;
    recordDate?: Date;
    metadata?: any;
  }) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    const usageRecord = await this.prisma.usageRecord.create({
      data: {
        tenantId,
        subscriptionId,
        metric: data.metric,
        quantity: data.quantity,
        recordDate: data.recordDate || new Date(),
        metadata: data.metadata,
      },
    });

    return usageRecord;
  }

  /**
   * Get usage for subscription
   */
  async getUsage(subscriptionId: string, tenantId: string, options?: {
    metric?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      subscriptionId,
      tenantId,
    };

    if (options?.metric) {
      where.metric = options.metric;
    }

    if (options?.startDate || options?.endDate) {
      where.recordDate = {};
      if (options.startDate) where.recordDate.gte = options.startDate;
      if (options.endDate) where.recordDate.lte = options.endDate;
    }

    const usageRecords = await this.prisma.usageRecord.findMany({
      where,
      orderBy: { recordDate: 'desc' },
    });

    return usageRecords;
  }

  /**
   * Get usage summary by metric
   */
  async getUsageSummary(subscriptionId: string, tenantId: string, options?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      subscriptionId,
      tenantId,
    };

    if (options?.startDate || options?.endDate) {
      where.recordDate = {};
      if (options.startDate) where.recordDate.gte = options.startDate;
      if (options.endDate) where.recordDate.lte = options.endDate;
    }

    const summary = await this.prisma.usageRecord.groupBy({
      by: ['metric'],
      where,
      _sum: {
        quantity: true,
      },
      _count: true,
    });

    return summary.map((item) => ({
      metric: item.metric,
      totalQuantity: item._sum.quantity || 0,
      recordCount: item._count,
    }));
  }

  /**
   * Check if usage is within limits
   */
  async checkUsageLimits(subscriptionId: string, tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
      include: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new BadRequestException('Subscription not found');
    }

    const plan = subscription.plan;
    const limits: any = {};

    // Check standard limits
    if (plan.maxUsers) {
      const usersUsage = await this.getCurrentUsage(subscriptionId, tenantId, 'users');
      limits.users = {
        limit: plan.maxUsers,
        current: usersUsage,
        remaining: plan.maxUsers - usersUsage,
        percentage: (usersUsage / plan.maxUsers) * 100,
        exceeded: usersUsage > plan.maxUsers,
      };
    }

    if (plan.maxProducts) {
      const productsUsage = await this.getCurrentUsage(subscriptionId, tenantId, 'products');
      limits.products = {
        limit: plan.maxProducts,
        current: productsUsage,
        remaining: plan.maxProducts - productsUsage,
        percentage: (productsUsage / plan.maxProducts) * 100,
        exceeded: productsUsage > plan.maxProducts,
      };
    }

    if (plan.maxStorage) {
      const storageUsage = await this.getCurrentUsage(subscriptionId, tenantId, 'storage');
      limits.storage = {
        limit: plan.maxStorage,
        current: storageUsage,
        remaining: plan.maxStorage - storageUsage,
        percentage: (storageUsage / plan.maxStorage) * 100,
        exceeded: storageUsage > plan.maxStorage,
      };
    }

    // Check custom limits
    if (plan.customLimits) {
      const customLimits = plan.customLimits as any;
      for (const [metric, limit] of Object.entries(customLimits)) {
        if (typeof limit === 'number') {
          const usage = await this.getCurrentUsage(subscriptionId, tenantId, metric);
          limits[metric] = {
            limit,
            current: usage,
            remaining: limit - usage,
            percentage: (usage / limit) * 100,
            exceeded: usage > limit,
          };
        }
      }
    }

    return limits;
  }

  /**
   * Get current usage for a metric (within current period)
   */
  async getCurrentUsage(subscriptionId: string, tenantId: string, metric: string): Promise<number> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, tenantId },
    });

    if (!subscription) {
      return 0;
    }

    const result = await this.prisma.usageRecord.aggregate({
      where: {
        subscriptionId,
        tenantId,
        metric,
        recordDate: {
          gte: subscription.currentPeriodStart,
          lte: subscription.currentPeriodEnd,
        },
      },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity || 0;
  }

  /**
   * Get usage over time (for charts)
   */
  async getUsageOverTime(
    subscriptionId: string,
    tenantId: string,
    metric: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      interval?: 'day' | 'week' | 'month';
    }
  ) {
    const startDate = options?.startDate || dayjs().subtract(30, 'day').toDate();
    const endDate = options?.endDate || new Date();
    const interval = options?.interval || 'day';

    const usageRecords = await this.prisma.usageRecord.findMany({
      where: {
        subscriptionId,
        tenantId,
        metric,
        recordDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { recordDate: 'asc' },
    });

    // Group by interval
    const grouped: Record<string, number> = {};

    for (const record of usageRecords) {
      let key: string;
      if (interval === 'day') {
        key = dayjs(record.recordDate).format('YYYY-MM-DD');
      } else if (interval === 'week') {
        key = dayjs(record.recordDate).startOf('week').format('YYYY-MM-DD');
      } else {
        key = dayjs(record.recordDate).format('YYYY-MM');
      }

      grouped[key] = (grouped[key] || 0) + record.quantity;
    }

    return Object.entries(grouped).map(([date, quantity]) => ({
      date,
      quantity,
    }));
  }

  /**
   * Increment usage (helper method)
   */
  async incrementUsage(
    tenantId: string,
    subscriptionId: string,
    metric: string,
    quantity: number = 1
  ) {
    return this.recordUsage(tenantId, subscriptionId, {
      metric,
      quantity,
    });
  }

  /**
   * Decrement usage (helper method)
   */
  async decrementUsage(
    tenantId: string,
    subscriptionId: string,
    metric: string,
    quantity: number = 1
  ) {
    return this.recordUsage(tenantId, subscriptionId, {
      metric,
      quantity: -quantity,
    });
  }
}
