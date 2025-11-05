import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { startOfDay, endOfDay, subDays } from 'date-fns';

@Injectable()
export class AuditLogsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async getAuditLogs(tenantId: string, options: {
    page?: number;
    limit?: number;
    userId?: string;
    resource?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { page = 1, limit = 50, userId, resource, action, startDate, endDate } = options;

    const where: any = { tenantId };

    if (userId) {
      where.userId = userId;
    }

    if (resource) {
      where.entity = resource;
    }

    if (action) {
      where.action = action;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startOfDay(new Date(startDate));
      }
      if (endDate) {
        where.createdAt.lte = endOfDay(new Date(endDate));
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats(tenantId: string) {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const [
      totalLogs,
      recentLogs,
      actionCounts,
      resourceCounts,
      topUsers,
    ] = await Promise.all([
      // Total logs
      this.prisma.auditLog.count({
        where: { tenantId },
      }),

      // Recent logs (last 30 days)
      this.prisma.auditLog.count({
        where: {
          tenantId,
          createdAt: { gte: thirtyDaysAgo },
        },
      }),

      // Actions breakdown
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where: { tenantId },
        _count: true,
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
      }),

      // Resources breakdown
      this.prisma.auditLog.groupBy({
        by: ['entity'],
        where: { tenantId },
        _count: true,
        orderBy: {
          _count: {
            entity: 'desc',
          },
        },
        take: 10,
      }),

      // Top users by activity
      this.prisma.auditLog.groupBy({
        by: ['userId'],
        where: {
          tenantId,
          createdAt: { gte: thirtyDaysAgo },
        },
        _count: true,
        orderBy: {
          _count: {
            userId: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Get user details for top users
    const userIds = topUsers.map((u) => u.userId).filter((id): id is string => id !== null);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const topUsersWithDetails = topUsers.map((u) => ({
      user: users.find((user) => user.id === u.userId),
      count: u._count,
    }));

    return {
      totalLogs,
      recentLogs,
      actionCounts,
      resourceCounts: resourceCounts.map(r => ({ resource: r.entity, _count: r._count })),
      topUsers: topUsersWithDetails,
    };
  }
}
