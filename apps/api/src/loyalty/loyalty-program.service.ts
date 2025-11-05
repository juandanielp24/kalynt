import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@retail/database';

@Injectable()
export class LoyaltyProgramService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get all loyalty programs
   */
  async getPrograms(tenantId: string, isActive?: boolean) {
    const where: any = { tenantId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const programs = await this.prisma.loyaltyProgram.findMany({
      where,
      include: {
        tiers: {
          orderBy: { order: 'asc' },
        },
        rewards: {
          where: { isActive: true },
          orderBy: { pointsCost: 'asc' },
        },
        _count: {
          select: {
            members: true,
            rewards: true,
            tiers: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return programs;
  }

  /**
   * Get program by ID
   */
  async getProgram(id: string, tenantId: string) {
    const program = await this.prisma.loyaltyProgram.findFirst({
      where: { id, tenantId },
      include: {
        tiers: {
          orderBy: { order: 'asc' },
        },
        rewards: {
          include: {
            product: true,
            requiredTier: true,
          },
          orderBy: { pointsCost: 'asc' },
        },
        _count: {
          select: {
            members: true,
            transactions: true,
          },
        },
      },
    });

    if (!program) {
      throw new NotFoundException('Loyalty program not found');
    }

    return program;
  }

  /**
   * Create loyalty program
   */
  async createProgram(tenantId: string, data: {
    name: string;
    description?: string;
    pointsPerAmount?: number;
    minimumPurchase?: number;
    pointsExpireDays?: number;
    pointsValue?: number;
    minimumRedemption?: number;
    welcomePoints?: number;
    birthdayPoints?: number;
    referralPoints?: number;
    refereePoints?: number;
  }) {
    const program = await this.prisma.loyaltyProgram.create({
      data: {
        tenantId,
        ...data,
      },
    });

    // Create default tiers
    await this.createDefaultTiers(program.id);

    return program;
  }

  /**
   * Update loyalty program
   */
  async updateProgram(id: string, tenantId: string, data: any) {
    await this.getProgram(id, tenantId); // Verify exists

    const program = await this.prisma.loyaltyProgram.update({
      where: { id },
      data,
    });

    return program;
  }

  /**
   * Delete loyalty program
   */
  async deleteProgram(id: string, tenantId: string) {
    await this.getProgram(id, tenantId); // Verify exists

    // Check if program has members
    const memberCount = await this.prisma.loyaltyMember.count({
      where: { programId: id },
    });

    if (memberCount > 0) {
      throw new BadRequestException(
        'Cannot delete program with active members. Deactivate instead.'
      );
    }

    await this.prisma.loyaltyProgram.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Toggle program active status
   */
  async toggleProgramStatus(id: string, tenantId: string) {
    const program = await this.getProgram(id, tenantId);

    const updated = await this.prisma.loyaltyProgram.update({
      where: { id },
      data: { isActive: !program.isActive },
    });

    return updated;
  }

  /**
   * Get program statistics
   */
  async getProgramStatistics(id: string, tenantId: string) {
    const program = await this.getProgram(id, tenantId);

    const [
      totalMembers,
      activeMembers,
      totalPoints,
      totalRedemptions,
      transactions,
    ] = await Promise.all([
      this.prisma.loyaltyMember.count({
        where: { programId: id },
      }),
      this.prisma.loyaltyMember.count({
        where: {
          programId: id,
          isActive: true,
        },
      }),
      this.prisma.loyaltyMember.aggregate({
        where: { programId: id },
        _sum: {
          currentPoints: true,
          lifetimePoints: true,
        },
      }),
      this.prisma.rewardRedemption.count({
        where: {
          member: {
            programId: id,
          },
        },
      }),
      this.prisma.pointsTransaction.findMany({
        where: { programId: id },
        select: {
          type: true,
          points: true,
          createdAt: true,
        },
      }),
    ]);

    // Calculate points earned vs spent
    const pointsEarned = transactions
      .filter((t) => t.points > 0)
      .reduce((sum, t) => sum + t.points, 0);

    const pointsSpent = transactions
      .filter((t) => t.points < 0)
      .reduce((sum, t) => sum + Math.abs(t.points), 0);

    // Group by tier
    const membersByTier = await this.prisma.loyaltyMember.groupBy({
      by: ['tierId'],
      where: { programId: id },
      _count: true,
    });

    return {
      totalMembers,
      activeMembers,
      currentPoints: totalPoints._sum.currentPoints || 0,
      lifetimePoints: totalPoints._sum.lifetimePoints || 0,
      pointsEarned,
      pointsSpent,
      totalRedemptions,
      membersByTier,
      pointsLiability: (totalPoints._sum.currentPoints || 0) * program.pointsValue,
    };
  }

  /**
   * Create default tiers
   */
  private async createDefaultTiers(programId: string) {
    const tiers = [
      {
        name: 'Bronze',
        pointsRequired: 0,
        order: 0,
        color: '#CD7F32',
        icon: '🥉',
        pointsMultiplier: 1,
      },
      {
        name: 'Silver',
        pointsRequired: 1000,
        order: 1,
        color: '#C0C0C0',
        icon: '🥈',
        pointsMultiplier: 1.25,
        discountPercentage: 5,
      },
      {
        name: 'Gold',
        pointsRequired: 5000,
        order: 2,
        color: '#FFD700',
        icon: '🥇',
        pointsMultiplier: 1.5,
        discountPercentage: 10,
        freeShipping: true,
      },
      {
        name: 'Platinum',
        pointsRequired: 10000,
        order: 3,
        color: '#E5E4E2',
        icon: '💎',
        pointsMultiplier: 2,
        discountPercentage: 15,
        freeShipping: true,
        prioritySupport: true,
      },
    ];

    await this.prisma.loyaltyTier.createMany({
      data: tiers.map((tier) => ({
        programId,
        ...tier,
      })),
    });
  }

  /**
   * Get active program for tenant (assumes single program per tenant)
   */
  async getActiveProgram(tenantId: string) {
    const program = await this.prisma.loyaltyProgram.findFirst({
      where: {
        tenantId,
        isActive: true,
      },
      include: {
        tiers: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return program;
  }
}
