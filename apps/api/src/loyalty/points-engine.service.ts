import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaClient, PointsTransactionType } from '@retail/database';
import { LoyaltyMembersService } from './loyalty-members.service';
import { LoyaltyProgramService } from './loyalty-program.service';

@Injectable()
export class PointsEngineService {
  private readonly logger = new Logger(PointsEngineService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private membersService: LoyaltyMembersService,
    private programService: LoyaltyProgramService,
  ) {}

  /**
   * Process purchase and award points
   */
  async processPurchase(
    tenantId: string,
    customerId: string,
    saleId: string,
    amount: number
  ) {
    // Get active program for tenant
    const program = await this.programService.getActiveProgram(tenantId);

    if (!program) {
      this.logger.debug(`No active loyalty program for tenant ${tenantId}`);
      return null;
    }

    // Award points for purchase
    const result = await this.membersService.awardPointsForPurchase(
      program.id,
      customerId,
      saleId,
      amount
    );

    if (result) {
      this.logger.log(
        `Awarded ${result.points} points to customer ${customerId} for sale ${saleId}`
      );
    }

    return result;
  }

  /**
   * Award birthday points (runs daily at 9 AM)
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async awardBirthdayPoints() {
    this.logger.log('Running birthday points cron job');

    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();

    // Get all active programs with birthday points
    const programs = await this.prisma.loyaltyProgram.findMany({
      where: {
        isActive: true,
        birthdayPoints: { gt: 0 },
      },
    });

    let totalAwarded = 0;

    for (const program of programs) {
      // Find members with birthday today
      const members = await this.prisma.loyaltyMember.findMany({
        where: {
          programId: program.id,
          isActive: true,
          customer: {
            dateOfBirth: {
              not: null,
            },
          },
        },
        include: {
          customer: true,
        },
      });

      for (const member of members) {
        if (!member.customer.dateOfBirth) continue;

        const birthDate = new Date(member.customer.dateOfBirth);
        const birthMonth = birthDate.getMonth() + 1;
        const birthDay = birthDate.getDate();

        if (birthMonth === todayMonth && birthDay === todayDay) {
          // Check if birthday points already awarded this year
          const currentYear = today.getFullYear();
          const yearStart = new Date(currentYear, 0, 1);
          const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59);

          const existingBirthdayPoints = await this.prisma.pointsTransaction.findFirst({
            where: {
              memberId: member.id,
              type: PointsTransactionType.EARNED_BIRTHDAY,
              createdAt: {
                gte: yearStart,
                lte: yearEnd,
              },
            },
          });

          if (!existingBirthdayPoints) {
            await this.membersService.addPoints(
              member.id,
              program.birthdayPoints,
              PointsTransactionType.EARNED_BIRTHDAY,
              `Birthday bonus for ${currentYear}`
            );

            totalAwarded++;
            this.logger.log(
              `Awarded ${program.birthdayPoints} birthday points to member ${member.id}`
            );
          }
        }
      }
    }

    this.logger.log(`Birthday points cron completed. Awarded to ${totalAwarded} members`);
    return totalAwarded;
  }

  /**
   * Award referral points
   */
  async awardReferralPoints(
    programId: string,
    referrerId: string,
    refereeCustomerId: string
  ) {
    const program = await this.prisma.loyaltyProgram.findUnique({
      where: { id: programId },
    });

    if (!program || !program.isActive) {
      throw new Error('Program not active');
    }

    // Get referrer member
    const referrerMember = await this.prisma.loyaltyMember.findFirst({
      where: {
        programId,
        customerId: referrerId,
      },
    });

    if (!referrerMember) {
      throw new Error('Referrer is not a member');
    }

    // Check if referee is already a member
    const existingMember = await this.prisma.loyaltyMember.findFirst({
      where: {
        programId,
        customerId: refereeCustomerId,
      },
    });

    if (existingMember) {
      throw new Error('Referee is already a member');
    }

    // Enroll referee
    const refereeMember = await this.membersService.enrollCustomer(
      programId,
      refereeCustomerId
    );

    // Award points to referrer
    if (program.referralPoints > 0) {
      await this.membersService.addPoints(
        referrerMember.id,
        program.referralPoints,
        PointsTransactionType.EARNED_REFERRAL,
        `Referral bonus for referring customer ${refereeCustomerId}`
      );

      this.logger.log(
        `Awarded ${program.referralPoints} referral points to member ${referrerMember.id}`
      );
    }

    // Award points to referee
    if (program.refereePoints > 0) {
      await this.membersService.addPoints(
        refereeMember.id,
        program.refereePoints,
        PointsTransactionType.EARNED_REFERRAL,
        `Referral bonus for being referred by ${referrerId}`
      );

      this.logger.log(
        `Awarded ${program.refereePoints} referee points to member ${refereeMember.id}`
      );
    }

    return {
      referrer: referrerMember,
      referee: refereeMember,
      referrerPoints: program.referralPoints,
      refereePoints: program.refereePoints,
    };
  }

  /**
   * Manual points adjustment (add or deduct)
   */
  async adjustPoints(
    memberId: string,
    points: number,
    reason: string,
    addedBy?: string
  ) {
    if (points === 0) {
      throw new Error('Points adjustment cannot be zero');
    }

    const description = `Manual adjustment: ${reason}${addedBy ? ` (by ${addedBy})` : ''}`;

    if (points > 0) {
      await this.membersService.addPoints(
        memberId,
        points,
        PointsTransactionType.EARNED_MANUAL,
        description
      );
    } else {
      await this.membersService.deductPoints(
        memberId,
        Math.abs(points),
        PointsTransactionType.REVERSED,
        description
      );
    }

    this.logger.log(`Manually adjusted ${points} points for member ${memberId}`);

    return await this.membersService.getMember(memberId);
  }

  /**
   * Expire old points (runs daily at midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expirePoints() {
    this.logger.log('Running points expiration cron job');

    const expired = await this.membersService.expirePoints();

    this.logger.log(`Points expiration cron completed. Expired ${expired} transactions`);

    return expired;
  }

  /**
   * Get leaderboard for a program
   */
  async getLeaderboard(
    programId: string,
    period: 'all_time' | 'year' | 'month' | 'week' = 'all_time',
    limit: number = 50
  ) {
    let dateFilter: Date | undefined;
    const now = new Date();

    switch (period) {
      case 'year':
        dateFilter = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
        dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = weekAgo;
        break;
    }

    if (period === 'all_time') {
      // Lifetime leaderboard
      const members = await this.prisma.loyaltyMember.findMany({
        where: {
          programId,
          isActive: true,
        },
        include: {
          customer: true,
          tier: true,
        },
        orderBy: {
          lifetimePoints: 'desc',
        },
        take: limit,
      });

      return members.map((member, index) => ({
        rank: index + 1,
        memberId: member.id,
        customerName: member.customer.name,
        customerEmail: member.customer.email,
        points: member.lifetimePoints,
        currentPoints: member.currentPoints,
        tier: member.tier?.name,
        memberSince: member.enrolledAt,
      }));
    } else {
      // Period-based leaderboard (sum points earned in period)
      const transactions = await this.prisma.pointsTransaction.findMany({
        where: {
          programId,
          points: { gt: 0 }, // Only earned points
          createdAt: dateFilter ? { gte: dateFilter } : undefined,
        },
        include: {
          member: {
            include: {
              customer: true,
              tier: true,
            },
          },
        },
      });

      // Group by member and sum points
      const memberPointsMap = new Map<string, any>();

      for (const transaction of transactions) {
        const memberId = transaction.memberId;
        if (!memberPointsMap.has(memberId)) {
          memberPointsMap.set(memberId, {
            memberId,
            member: transaction.member,
            points: 0,
          });
        }
        memberPointsMap.get(memberId)!.points += transaction.points;
      }

      // Sort by points and create leaderboard
      const leaderboard = Array.from(memberPointsMap.values())
        .sort((a, b) => b.points - a.points)
        .slice(0, limit)
        .map((item, index) => ({
          rank: index + 1,
          memberId: item.memberId,
          customerName: item.member.customer.name,
          customerEmail: item.member.customer.email,
          points: item.points,
          currentPoints: item.member.currentPoints,
          tier: item.member.tier?.name,
          memberSince: item.member.enrolledAt,
        }));

      return leaderboard;
    }
  }

  /**
   * Calculate points value in currency
   */
  async calculatePointsValue(programId: string, points: number) {
    const program = await this.prisma.loyaltyProgram.findUnique({
      where: { id: programId },
    });

    if (!program) {
      throw new Error('Program not found');
    }

    const value = points * program.pointsValue;

    return {
      points,
      value,
      currency: 'USD', // You can make this configurable
      pointsValue: program.pointsValue,
    };
  }

  /**
   * Get points summary for a program
   */
  async getPointsSummary(programId: string) {
    const [totalMembers, totalPoints, transactions] = await Promise.all([
      this.prisma.loyaltyMember.count({
        where: { programId },
      }),
      this.prisma.loyaltyMember.aggregate({
        where: { programId },
        _sum: {
          currentPoints: true,
          lifetimePoints: true,
        },
      }),
      this.prisma.pointsTransaction.groupBy({
        by: ['type'],
        where: { programId },
        _sum: {
          points: true,
        },
      }),
    ]);

    const transactionsByType = transactions.reduce((acc, t) => {
      acc[t.type] = t._sum.points || 0;
      return acc;
    }, {} as Record<string, number>);

    const program = await this.prisma.loyaltyProgram.findUnique({
      where: { id: programId },
    });

    const pointsLiability = (totalPoints._sum.currentPoints || 0) * (program?.pointsValue || 0);

    return {
      totalMembers,
      currentPoints: totalPoints._sum.currentPoints || 0,
      lifetimePoints: totalPoints._sum.lifetimePoints || 0,
      pointsLiability,
      transactionsByType,
    };
  }

  /**
   * Get member activity summary
   */
  async getMemberActivity(memberId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await this.prisma.pointsTransaction.findMany({
      where: {
        memberId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
    });

    const earned = transactions
      .filter((t) => t.points > 0)
      .reduce((sum, t) => sum + t.points, 0);

    const spent = transactions
      .filter((t) => t.points < 0)
      .reduce((sum, t) => sum + Math.abs(t.points), 0);

    const redemptions = await this.prisma.rewardRedemption.count({
      where: {
        memberId,
        redeemedAt: { gte: startDate },
      },
    });

    return {
      period: `Last ${days} days`,
      totalTransactions: transactions.length,
      pointsEarned: earned,
      pointsSpent: spent,
      netPoints: earned - spent,
      redemptions,
      transactions,
    };
  }
}
