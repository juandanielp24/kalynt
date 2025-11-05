import { Injectable, Inject, NotFoundException, Logger } from '@nestjs/common';
import { PrismaClient, PointsTransactionType } from '@retail/database';
import { LoyaltyTiersService } from './loyalty-tiers.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class LoyaltyMembersService {
  private readonly logger = new Logger(LoyaltyMembersService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private tiersService: LoyaltyTiersService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Enroll customer in loyalty program
   */
  async enrollCustomer(programId: string, customerId: string) {
    // Check if already enrolled
    const existing = await this.prisma.loyaltyMember.findUnique({
      where: {
        programId_customerId: {
          programId,
          customerId,
        },
      },
    });

    if (existing) {
      return existing;
    }

    // Get program
    const program = await this.prisma.loyaltyProgram.findUnique({
      where: { id: programId },
      include: {
        tiers: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!program || !program.isActive) {
      throw new Error('Program not active');
    }

    // Get lowest tier
    const lowestTier = program.tiers[0];

    // Create member
    const member = await this.prisma.loyaltyMember.create({
      data: {
        programId,
        customerId,
        tierId: lowestTier?.id,
        currentPoints: program.welcomePoints,
        lifetimePoints: program.welcomePoints,
      },
    });

    // Create welcome points transaction
    if (program.welcomePoints > 0) {
      await this.addPointsTransaction({
        programId,
        memberId: member.id,
        type: PointsTransactionType.EARNED_WELCOME,
        points: program.welcomePoints,
        description: 'Welcome bonus',
      });
    }

    // Emit event
    this.eventEmitter.emit('loyalty.member.enrolled', {
      memberId: member.id,
      customerId,
      programId,
    });

    this.logger.log(`Customer ${customerId} enrolled in program ${programId}`);

    return member;
  }

  /**
   * Get member
   */
  async getMember(memberId: string) {
    const member = await this.prisma.loyaltyMember.findUnique({
      where: { id: memberId },
      include: {
        program: true,
        tier: true,
        customer: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  /**
   * Get member by customer and program
   */
  async getMemberByCustomer(programId: string, customerId: string) {
    const member = await this.prisma.loyaltyMember.findUnique({
      where: {
        programId_customerId: {
          programId,
          customerId,
        },
      },
      include: {
        program: true,
        tier: true,
        customer: true,
      },
    });

    return member;
  }

  /**
   * Award points for purchase
   */
  async awardPointsForPurchase(
    programId: string,
    customerId: string,
    saleId: string,
    amount: number,
  ) {
    const program = await this.prisma.loyaltyProgram.findUnique({
      where: { id: programId },
    });

    if (!program || !program.isActive) {
      return null;
    }

    // Check minimum purchase
    if (amount < program.minimumPurchase) {
      return null;
    }

    // Get or create member
    let member = await this.getMemberByCustomer(programId, customerId);

    if (!member) {
      member = await this.enrollCustomer(programId, customerId);
    }

    // Calculate points
    let points = Math.floor(amount * program.pointsPerAmount);

    // Apply tier multiplier
    if (member.tier) {
      points = Math.floor(points * member.tier.pointsMultiplier);
    }

    if (points === 0) {
      return null;
    }

    // Add points
    await this.addPoints(
      member.id,
      points,
      PointsTransactionType.EARNED_PURCHASE,
      `Earned from purchase`,
      saleId
    );

    this.logger.log(`Awarded ${points} points to member ${member.id} for sale ${saleId}`);

    return { member, points };
  }

  /**
   * Add points to member
   */
  async addPoints(
    memberId: string,
    points: number,
    type: PointsTransactionType,
    description: string,
    saleId?: string,
  ) {
    const member = await this.getMember(memberId);

    // Calculate new balance
    const newBalance = member.currentPoints + points;
    const newLifetime = member.lifetimePoints + points;

    // Update member
    const updated = await this.prisma.loyaltyMember.update({
      where: { id: memberId },
      data: {
        currentPoints: newBalance,
        lifetimePoints: newLifetime,
        lastActivityAt: new Date(),
      },
    });

    // Create transaction
    const expiresAt = member.program.pointsExpireDays
      ? new Date(Date.now() + member.program.pointsExpireDays * 24 * 60 * 60 * 1000)
      : undefined;

    await this.addPointsTransaction({
      programId: member.programId,
      memberId,
      type,
      points,
      description,
      saleId,
      balance: newBalance,
      expiresAt,
    });

    // Check tier upgrade
    await this.checkTierUpgrade(memberId, newLifetime);

    return updated;
  }

  /**
   * Deduct points from member
   */
  async deductPoints(
    memberId: string,
    points: number,
    type: PointsTransactionType,
    description: string,
    redemptionId?: string,
  ) {
    const member = await this.getMember(memberId);

    if (member.currentPoints < points) {
      throw new Error('Insufficient points');
    }

    const newBalance = member.currentPoints - points;

    // Update member
    const updated = await this.prisma.loyaltyMember.update({
      where: { id: memberId },
      data: {
        currentPoints: newBalance,
        lastActivityAt: new Date(),
      },
    });

    // Create transaction
    await this.addPointsTransaction({
      programId: member.programId,
      memberId,
      type,
      points: -points,
      description,
      redemptionId,
      balance: newBalance,
    });

    return updated;
  }

  /**
   * Add points transaction
   */
  private async addPointsTransaction(data: {
    programId: string;
    memberId: string;
    type: PointsTransactionType;
    points: number;
    description: string;
    saleId?: string;
    redemptionId?: string;
    balance?: number;
    expiresAt?: Date;
  }) {
    const transaction = await this.prisma.pointsTransaction.create({
      data,
    });

    return transaction;
  }

  /**
   * Check and upgrade tier if eligible
   */
  private async checkTierUpgrade(memberId: string, lifetimePoints: number) {
    const member = await this.getMember(memberId);

    const newTier = await this.tiersService.determineTier(
      member.programId,
      lifetimePoints
    );

    if (!newTier || newTier.id === member.tierId) {
      return;
    }

    // Upgrade tier
    await this.prisma.loyaltyMember.update({
      where: { id: memberId },
      data: {
        tierId: newTier.id,
        tierAchievedAt: new Date(),
      },
    });

    // Emit event
    this.eventEmitter.emit('loyalty.tier.upgraded', {
      memberId,
      newTierId: newTier.id,
      newTierName: newTier.name,
    });

    this.logger.log(`Member ${memberId} upgraded to tier ${newTier.name}`);
  }

  /**
   * Expire old points
   */
  async expirePoints() {
    const now = new Date();

    // Find expired transactions
    const expiredTransactions = await this.prisma.pointsTransaction.findMany({
      where: {
        expiresAt: { lte: now },
        isExpired: false,
        points: { gt: 0 }, // Only earned points
      },
      include: {
        member: true,
      },
    });

    for (const transaction of expiredTransactions) {
      // Deduct expired points
      await this.prisma.loyaltyMember.update({
        where: { id: transaction.memberId },
        data: {
          currentPoints: {
            decrement: transaction.points,
          },
        },
      });

      // Create expiration transaction
      await this.addPointsTransaction({
        programId: transaction.programId,
        memberId: transaction.memberId,
        type: PointsTransactionType.EXPIRED,
        points: -transaction.points,
        description: `Expired points from ${transaction.description}`,
        balance: transaction.member.currentPoints - transaction.points,
      });

      // Mark as expired
      await this.prisma.pointsTransaction.update({
        where: { id: transaction.id },
        data: { isExpired: true },
      });

      this.logger.log(`Expired ${transaction.points} points for member ${transaction.memberId}`);
    }

    return expiredTransactions.length;
  }

  /**
   * Get member statistics
   */
  async getMemberStatistics(memberId: string) {
    const member = await this.getMember(memberId);

    const transactions = await this.prisma.pointsTransaction.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
    });

    const pointsEarned = transactions
      .filter((t) => t.points > 0)
      .reduce((sum, t) => sum + t.points, 0);

    const pointsSpent = transactions
      .filter((t) => t.points < 0)
      .reduce((sum, t) => sum + Math.abs(t.points), 0);

    const redemptions = await this.prisma.rewardRedemption.count({
      where: { memberId },
    });

    return {
      currentPoints: member.currentPoints,
      lifetimePoints: member.lifetimePoints,
      pointsEarned,
      pointsSpent,
      totalRedemptions: redemptions,
      memberSince: member.enrolledAt,
      currentTier: member.tier?.name,
    };
  }
}
