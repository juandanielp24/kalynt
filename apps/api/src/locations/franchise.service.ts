import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import { FranchiseeStatus, RoyaltyStatus } from '@prisma/client';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class FranchiseService {
  constructor(@Inject('PRISMA') private readonly prisma: PrismaClient) {}

  // ========================================
  // FRANCHISE OPERATIONS
  // ========================================

  /**
   * Get all franchises
   */
  async getFranchises(
    tenantId: string,
    options?: {
      isActive?: boolean;
    },
  ) {
    const franchises = await this.prisma.franchise.findMany({
      where: {
        tenantId,
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
      },
      include: {
        _count: {
          select: {
            locations: true,
            franchisees: true,
            royalties: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return franchises;
  }

  /**
   * Get franchise by ID
   */
  async getFranchiseById(id: string, tenantId: string) {
    const franchise = await this.prisma.franchise.findFirst({
      where: { id, tenantId },
      include: {
        locations: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
            status: true,
            city: true,
            province: true,
          },
        },
        franchisees: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            contractStartDate: true,
            contractEndDate: true,
          },
        },
        _count: {
          select: {
            royalties: true,
          },
        },
      },
    });

    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }

    return franchise;
  }

  /**
   * Create franchise
   */
  async createFranchise(
    tenantId: string,
    data: {
      name: string;
      code: string;
      description?: string;
      initialFee: number;
      royaltyPercentage: number;
      marketingFee: number;
      contractYears: number;
      renewalTerms?: string;
      trainingIncluded?: boolean;
      ongoingSupport?: boolean;
      territory?: string;
      exclusiveTerritory?: boolean;
    },
  ) {
    // Validate code uniqueness
    const existing = await this.prisma.franchise.findFirst({
      where: { tenantId, code: data.code },
    });

    if (existing) {
      throw new BadRequestException(
        `Franchise with code ${data.code} already exists`,
      );
    }

    // Validate royalty percentage
    if (data.royaltyPercentage < 0 || data.royaltyPercentage > 100) {
      throw new BadRequestException('Royalty percentage must be between 0 and 100');
    }

    const franchise = await this.prisma.franchise.create({
      data: {
        tenantId,
        ...data,
      },
    });

    return franchise;
  }

  /**
   * Update franchise
   */
  async updateFranchise(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      code?: string;
      description?: string;
      initialFee?: number;
      royaltyPercentage?: number;
      marketingFee?: number;
      contractYears?: number;
      renewalTerms?: string;
      trainingIncluded?: boolean;
      ongoingSupport?: boolean;
      territory?: string;
      exclusiveTerritory?: boolean;
      isActive?: boolean;
    },
  ) {
    const franchise = await this.prisma.franchise.findFirst({
      where: { id, tenantId },
    });

    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }

    // Validate code uniqueness if changing
    if (data.code && data.code !== franchise.code) {
      const existing = await this.prisma.franchise.findFirst({
        where: { tenantId, code: data.code, id: { not: id } },
      });

      if (existing) {
        throw new BadRequestException(
          `Franchise with code ${data.code} already exists`,
        );
      }
    }

    // Validate royalty percentage
    if (data.royaltyPercentage !== undefined) {
      if (data.royaltyPercentage < 0 || data.royaltyPercentage > 100) {
        throw new BadRequestException(
          'Royalty percentage must be between 0 and 100',
        );
      }
    }

    const updated = await this.prisma.franchise.update({
      where: { id },
      data,
    });

    return updated;
  }

  /**
   * Delete franchise
   */
  async deleteFranchise(id: string, tenantId: string) {
    const franchise = await this.prisma.franchise.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            locations: true,
            franchisees: true,
            royalties: true,
          },
        },
      },
    });

    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }

    // Prevent deletion if there are active locations or franchisees
    if (franchise._count.locations > 0) {
      throw new BadRequestException(
        'Cannot delete franchise with associated locations',
      );
    }

    if (franchise._count.franchisees > 0) {
      throw new BadRequestException(
        'Cannot delete franchise with associated franchisees',
      );
    }

    await this.prisma.franchise.delete({
      where: { id },
    });

    return { message: 'Franchise deleted successfully' };
  }

  // ========================================
  // FRANCHISEE OPERATIONS
  // ========================================

  /**
   * Get all franchisees
   */
  async getFranchisees(
    tenantId: string,
    options?: {
      franchiseId?: string;
      status?: FranchiseeStatus;
    },
  ) {
    const franchisees = await this.prisma.franchisee.findMany({
      where: {
        tenantId,
        ...(options?.franchiseId && { franchiseId: options.franchiseId }),
        ...(options?.status && { status: options.status }),
      },
      include: {
        franchise: {
          select: {
            id: true,
            name: true,
            code: true,
            royaltyPercentage: true,
          },
        },
        _count: {
          select: {
            royalties: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return franchisees;
  }

  /**
   * Get franchisee by ID
   */
  async getFranchiseeById(id: string, tenantId: string) {
    const franchisee = await this.prisma.franchisee.findFirst({
      where: { id, tenantId },
      include: {
        franchise: true,
        royalties: {
          orderBy: { periodStart: 'desc' },
          take: 12, // Last 12 months
        },
      },
    });

    if (!franchisee) {
      throw new NotFoundException('Franchisee not found');
    }

    return franchisee;
  }

  /**
   * Create franchisee
   */
  async createFranchisee(
    tenantId: string,
    data: {
      franchiseId: string;
      name: string;
      email: string;
      phone?: string;
      company?: string;
      taxId?: string;
      status?: FranchiseeStatus;
      contractStartDate?: Date;
      contractEndDate?: Date;
      signedDate?: Date;
      initialFeeAmount?: number;
      initialFeePaid?: boolean;
      paymentDay?: number;
      contractDocumentUrl?: string;
      notes?: string;
    },
  ) {
    // Validate franchise exists
    const franchise = await this.prisma.franchise.findFirst({
      where: { id: data.franchiseId, tenantId },
    });

    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }

    // Validate email uniqueness
    const existing = await this.prisma.franchisee.findFirst({
      where: { tenantId, email: data.email },
    });

    if (existing) {
      throw new BadRequestException(
        `Franchisee with email ${data.email} already exists`,
      );
    }

    // Validate payment day
    if (data.paymentDay && (data.paymentDay < 1 || data.paymentDay > 31)) {
      throw new BadRequestException('Payment day must be between 1 and 31');
    }

    const franchisee = await this.prisma.franchisee.create({
      data: {
        tenantId,
        ...data,
      },
      include: {
        franchise: true,
      },
    });

    return franchisee;
  }

  /**
   * Update franchisee
   */
  async updateFranchisee(
    id: string,
    tenantId: string,
    data: {
      franchiseId?: string;
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
      taxId?: string;
      status?: FranchiseeStatus;
      contractStartDate?: Date;
      contractEndDate?: Date;
      signedDate?: Date;
      initialFeeAmount?: number;
      initialFeePaid?: boolean;
      paymentDay?: number;
      contractDocumentUrl?: string;
      notes?: string;
    },
  ) {
    const franchisee = await this.prisma.franchisee.findFirst({
      where: { id, tenantId },
    });

    if (!franchisee) {
      throw new NotFoundException('Franchisee not found');
    }

    // Validate franchise if changing
    if (data.franchiseId) {
      const franchise = await this.prisma.franchise.findFirst({
        where: { id: data.franchiseId, tenantId },
      });

      if (!franchise) {
        throw new NotFoundException('Franchise not found');
      }
    }

    // Validate email uniqueness if changing
    if (data.email && data.email !== franchisee.email) {
      const existing = await this.prisma.franchisee.findFirst({
        where: { tenantId, email: data.email, id: { not: id } },
      });

      if (existing) {
        throw new BadRequestException(
          `Franchisee with email ${data.email} already exists`,
        );
      }
    }

    // Validate payment day
    if (data.paymentDay && (data.paymentDay < 1 || data.paymentDay > 31)) {
      throw new BadRequestException('Payment day must be between 1 and 31');
    }

    const updated = await this.prisma.franchisee.update({
      where: { id },
      data,
      include: {
        franchise: true,
      },
    });

    return updated;
  }

  /**
   * Delete franchisee
   */
  async deleteFranchisee(id: string, tenantId: string) {
    const franchisee = await this.prisma.franchisee.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            royalties: true,
          },
        },
      },
    });

    if (!franchisee) {
      throw new NotFoundException('Franchisee not found');
    }

    // Prevent deletion if there are royalty records
    if (franchisee._count.royalties > 0) {
      throw new BadRequestException(
        'Cannot delete franchisee with royalty history. Consider deactivating instead.',
      );
    }

    await this.prisma.franchisee.delete({
      where: { id },
    });

    return { message: 'Franchisee deleted successfully' };
  }

  // ========================================
  // ROYALTY OPERATIONS
  // ========================================

  /**
   * Calculate royalties for a franchisee for a specific period
   */
  async calculateRoyalty(
    tenantId: string,
    franchiseeId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const franchisee = await this.prisma.franchisee.findFirst({
      where: { id: franchiseeId, tenantId },
      include: {
        franchise: true,
      },
    });

    if (!franchisee) {
      throw new NotFoundException('Franchisee not found');
    }

    // Get all franchise locations
    const locations = await this.prisma.location.findMany({
      where: {
        tenantId,
        franchiseId: franchisee.franchiseId,
      },
    });

    if (locations.length === 0) {
      throw new BadRequestException('No locations found for this franchise');
    }

    const locationIds = locations.map((l) => l.id);

    // Calculate gross sales for the period
    const salesData = await this.prisma.sale.aggregate({
      where: {
        tenantId,
        locationId: { in: locationIds },
        saleDate: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      _sum: {
        totalCents: true,
      },
    });

    const grossSales = (salesData._sum.totalCents || 0) / 100; // Convert to dollars

    // Calculate royalty
    const royaltyRate = franchisee.franchise.royaltyPercentage;
    const royaltyAmount = (grossSales * royaltyRate) / 100;
    const marketingFee = (grossSales * franchisee.franchise.marketingFee) / 100;
    const totalDue = royaltyAmount + marketingFee;

    // Calculate due date (payment day of next month, or 15th if not set)
    const dueDate = new Date(periodEnd);
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(franchisee.paymentDay || 15);

    return {
      franchiseeId,
      franchiseId: franchisee.franchiseId,
      periodStart,
      periodEnd,
      grossSales,
      royaltyRate,
      royaltyAmount,
      marketingFee,
      totalDue,
      dueDate,
    };
  }

  /**
   * Create royalty record
   */
  async createRoyalty(
    tenantId: string,
    data: {
      franchiseeId: string;
      franchiseId: string;
      periodStart: Date;
      periodEnd: Date;
      grossSales: number;
      royaltyRate: number;
      royaltyAmount: number;
      marketingFee: number;
      totalDue: number;
      dueDate: Date;
      notes?: string;
    },
  ) {
    // Check if royalty already exists for this period
    const existing = await this.prisma.franchiseRoyalty.findFirst({
      where: {
        tenantId,
        franchiseeId: data.franchiseeId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Royalty record already exists for this period',
      );
    }

    const royalty = await this.prisma.franchiseRoyalty.create({
      data: {
        tenantId,
        ...data,
      },
      include: {
        franchise: {
          select: { id: true, name: true, code: true },
        },
        franchisee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return royalty;
  }

  /**
   * Get royalties
   */
  async getRoyalties(
    tenantId: string,
    options?: {
      franchiseId?: string;
      franchiseeId?: string;
      status?: RoyaltyStatus;
      fromDate?: Date;
      toDate?: Date;
    },
  ) {
    const where: any = { tenantId };

    if (options?.franchiseId) {
      where.franchiseId = options.franchiseId;
    }

    if (options?.franchiseeId) {
      where.franchiseeId = options.franchiseeId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.fromDate || options?.toDate) {
      where.periodStart = {};
      if (options.fromDate) {
        where.periodStart.gte = options.fromDate;
      }
      if (options.toDate) {
        where.periodStart.lte = options.toDate;
      }
    }

    const royalties = await this.prisma.franchiseRoyalty.findMany({
      where,
      include: {
        franchise: {
          select: { id: true, name: true, code: true },
        },
        franchisee: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { periodStart: 'desc' },
    });

    return royalties;
  }

  /**
   * Get royalty by ID
   */
  async getRoyaltyById(id: string, tenantId: string) {
    const royalty = await this.prisma.franchiseRoyalty.findFirst({
      where: { id, tenantId },
      include: {
        franchise: true,
        franchisee: true,
      },
    });

    if (!royalty) {
      throw new NotFoundException('Royalty record not found');
    }

    return royalty;
  }

  /**
   * Mark royalty as paid
   */
  async markRoyaltyPaid(
    id: string,
    tenantId: string,
    paymentData: { paymentMethod: string; transactionId?: string },
  ) {
    const royalty = await this.prisma.franchiseRoyalty.findFirst({
      where: { id, tenantId },
    });

    if (!royalty) {
      throw new NotFoundException('Royalty record not found');
    }

    if (royalty.status === RoyaltyStatus.PAID) {
      throw new BadRequestException('Royalty already marked as paid');
    }

    const updated = await this.prisma.franchiseRoyalty.update({
      where: { id },
      data: {
        status: RoyaltyStatus.PAID,
        paidAmount: royalty.totalDue,
        paidDate: new Date(),
        notes: `Payment Method: ${paymentData.paymentMethod}${paymentData.transactionId ? `, Transaction ID: ${paymentData.transactionId}` : ''}`,
      },
    });

    return updated;
  }

  /**
   * Update royalty status
   */
  async updateRoyaltyStatus(
    id: string,
    tenantId: string,
    status: RoyaltyStatus,
    notes?: string,
  ) {
    const royalty = await this.prisma.franchiseRoyalty.findFirst({
      where: { id, tenantId },
    });

    if (!royalty) {
      throw new NotFoundException('Royalty record not found');
    }

    const updated = await this.prisma.franchiseRoyalty.update({
      where: { id },
      data: {
        status,
        ...(notes && { notes }),
      },
    });

    return updated;
  }

  /**
   * Auto-calculate monthly royalties (cron job)
   * Runs on the 1st of each month to calculate previous month's royalties
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async autoCalculateMonthlyRoyalties() {
    console.log('Running auto-calculation of monthly royalties...');

    // Get all active franchisees
    const tenants = await this.prisma.tenant.findMany({
      select: { id: true },
    });

    for (const tenant of tenants) {
      const franchisees = await this.prisma.franchisee.findMany({
        where: {
          tenantId: tenant.id,
          status: FranchiseeStatus.ACTIVE,
        },
      });

      // Calculate previous month's period
      const now = new Date();
      const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of previous month
      const periodStart = new Date(
        periodEnd.getFullYear(),
        periodEnd.getMonth(),
        1,
      ); // First day of previous month

      for (const franchisee of franchisees) {
        try {
          // Check if royalty already exists
          const existing = await this.prisma.franchiseRoyalty.findFirst({
            where: {
              tenantId: tenant.id,
              franchiseeId: franchisee.id,
              periodStart,
              periodEnd,
            },
          });

          if (!existing) {
            // Calculate and create royalty
            const calculation = await this.calculateRoyalty(
              tenant.id,
              franchisee.id,
              periodStart,
              periodEnd,
            );

            await this.createRoyalty(tenant.id, calculation);

            console.log(
              `Created royalty for franchisee ${franchisee.name} (${franchisee.id})`,
            );
          }
        } catch (error) {
          console.error(
            `Error calculating royalty for franchisee ${franchisee.id}:`,
            error,
          );
        }
      }
    }

    console.log('Finished auto-calculation of monthly royalties');
  }

  /**
   * Get franchise statistics
   */
  async getFranchiseStatistics(franchiseId: string, tenantId: string) {
    const franchise = await this.prisma.franchise.findFirst({
      where: { id: franchiseId, tenantId },
    });

    if (!franchise) {
      throw new NotFoundException('Franchise not found');
    }

    // Count franchisees by status
    const franchiseesByStatus = await this.prisma.franchisee.groupBy({
      by: ['status'],
      where: { tenantId, franchiseId },
      _count: true,
    });

    // Total locations
    const totalLocations = await this.prisma.location.count({
      where: { tenantId, franchiseId },
    });

    // Total royalties collected
    const royaltiesData = await this.prisma.franchiseRoyalty.aggregate({
      where: {
        tenantId,
        franchiseId,
        status: RoyaltyStatus.PAID,
      },
      _sum: {
        royaltyAmount: true,
        marketingFee: true,
        totalDue: true,
      },
    });

    // Pending royalties
    const pendingRoyalties = await this.prisma.franchiseRoyalty.aggregate({
      where: {
        tenantId,
        franchiseId,
        status: { in: [RoyaltyStatus.PENDING, RoyaltyStatus.OVERDUE] },
      },
      _sum: {
        totalDue: true,
      },
      _count: true,
    });

    // Recent royalties (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const recentRoyalties = await this.prisma.franchiseRoyalty.findMany({
      where: {
        tenantId,
        franchiseId,
        periodStart: { gte: twelveMonthsAgo },
      },
      orderBy: { periodStart: 'asc' },
    });

    return {
      franchise: {
        id: franchise.id,
        name: franchise.name,
        code: franchise.code,
        royaltyPercentage: franchise.royaltyPercentage,
        marketingFee: franchise.marketingFee,
      },
      franchisees: {
        total: franchiseesByStatus.reduce(
          (sum, item) => sum + item._count,
          0,
        ),
        byStatus: franchiseesByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
      },
      locations: {
        total: totalLocations,
      },
      royalties: {
        totalCollected: royaltiesData._sum.totalDue || 0,
        totalRoyaltyAmount: royaltiesData._sum.royaltyAmount || 0,
        totalMarketingFee: royaltiesData._sum.marketingFee || 0,
        pendingAmount: pendingRoyalties._sum.totalDue || 0,
        pendingCount: pendingRoyalties._count,
        monthlyHistory: recentRoyalties.map((r) => ({
          month: r.periodStart,
          grossSales: r.grossSales,
          royaltyAmount: r.royaltyAmount,
          marketingFee: r.marketingFee,
          totalDue: r.totalDue,
          status: r.status,
        })),
      },
    };
  }

  /**
   * Get franchisee performance
   */
  async getFranchiseePerformance(franchiseeId: string, tenantId: string) {
    const franchisee = await this.prisma.franchisee.findFirst({
      where: { id: franchiseeId, tenantId },
      include: {
        franchise: true,
      },
    });

    if (!franchisee) {
      throw new NotFoundException('Franchisee not found');
    }

    // Get all royalties
    const royalties = await this.prisma.franchiseRoyalty.findMany({
      where: { tenantId, franchiseeId },
      orderBy: { periodStart: 'desc' },
    });

    // Calculate totals
    const totalGrossSales = royalties.reduce(
      (sum, r) => sum + r.grossSales,
      0,
    );
    const totalRoyaltiesPaid = royalties
      .filter((r) => r.status === RoyaltyStatus.PAID)
      .reduce((sum, r) => sum + (r.paidAmount || 0), 0);
    const totalRoyaltiesPending = royalties
      .filter((r) =>
        r.status === RoyaltyStatus.PENDING || r.status === RoyaltyStatus.OVERDUE,
      )
      .reduce((sum, r) => sum + r.totalDue, 0);

    // Calculate payment compliance (% of royalties paid on time)
    const paidOnTime = royalties.filter(
      (r) =>
        r.status === RoyaltyStatus.PAID &&
        r.paidDate &&
        r.paidDate <= r.dueDate,
    ).length;
    const paymentCompliance =
      royalties.length > 0 ? (paidOnTime / royalties.length) * 100 : 0;

    return {
      franchisee: {
        id: franchisee.id,
        name: franchisee.name,
        email: franchisee.email,
        status: franchisee.status,
        contractStartDate: franchisee.contractStartDate,
        contractEndDate: franchisee.contractEndDate,
      },
      franchise: {
        id: franchisee.franchise.id,
        name: franchisee.franchise.name,
        royaltyPercentage: franchisee.franchise.royaltyPercentage,
      },
      performance: {
        totalGrossSales,
        totalRoyaltiesPaid,
        totalRoyaltiesPending,
        totalRoyaltyPeriods: royalties.length,
        paymentCompliance: Math.round(paymentCompliance * 10) / 10,
        averageMonthlyGrossSales:
          royalties.length > 0 ? totalGrossSales / royalties.length : 0,
      },
      recentRoyalties: royalties.slice(0, 12), // Last 12 months
    };
  }

  /**
   * Alias for getFranchiseById (for controller compatibility)
   */
  async getFranchise(id: string, tenantId: string) {
    return this.getFranchiseById(id, tenantId);
  }

  /**
   * Alias for getFranchiseeById (for controller compatibility)
   */
  async getFranchisee(id: string, tenantId: string) {
    return this.getFranchiseeById(id, tenantId);
  }

  /**
   * Calculate and create royalties for a franchisee
   * (Wrapper that calls calculateRoyalty and createRoyalty)
   */
  async calculateRoyalties(
    franchiseeId: string,
    tenantId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    // Calculate royalty
    const calculation = await this.calculateRoyalty(
      tenantId,
      franchiseeId,
      periodStart,
      periodEnd,
    );

    // Create royalty record
    const royalty = await this.createRoyalty(tenantId, calculation);

    return royalty;
  }

}
