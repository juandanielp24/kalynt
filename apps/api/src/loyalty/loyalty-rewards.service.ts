import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient, RewardType, RedemptionStatus } from '@retail/database';
import { LoyaltyMembersService } from './loyalty-members.service';

@Injectable()
export class LoyaltyRewardsService {
  private readonly logger = new Logger(LoyaltyRewardsService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private membersService: LoyaltyMembersService,
  ) {}

  /**
   * Get all rewards for a program
   */
  async getRewards(programId: string, isActive?: boolean) {
    const where: any = { programId };

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const rewards = await this.prisma.loyaltyReward.findMany({
      where,
      include: {
        product: true,
        requiredTier: true,
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
      orderBy: { pointsCost: 'asc' },
    });

    return rewards;
  }

  /**
   * Get reward by ID
   */
  async getReward(id: string) {
    const reward = await this.prisma.loyaltyReward.findUnique({
      where: { id },
      include: {
        program: true,
        product: true,
        requiredTier: true,
        redemptions: {
          include: {
            member: {
              include: {
                customer: true,
              },
            },
          },
          orderBy: { redeemedAt: 'desc' },
          take: 20,
        },
        _count: {
          select: {
            redemptions: true,
          },
        },
      },
    });

    if (!reward) {
      throw new NotFoundException('Reward not found');
    }

    return reward;
  }

  /**
   * Create reward
   */
  async createReward(programId: string, data: {
    name: string;
    description?: string;
    type: RewardType;
    pointsCost: number;
    value?: number;
    productId?: string;
    requiredTierId?: string;
    stockQuantity?: number;
    validityDays?: number;
    termsConditions?: string;
  }) {
    // Validate product exists if type is FREE_PRODUCT
    if (data.type === RewardType.FREE_PRODUCT && !data.productId) {
      throw new BadRequestException('Product ID is required for FREE_PRODUCT rewards');
    }

    // Validate value for discount rewards
    if (
      (data.type === RewardType.PERCENTAGE_DISCOUNT || data.type === RewardType.FIXED_DISCOUNT) &&
      !data.value
    ) {
      throw new BadRequestException('Value is required for discount rewards');
    }

    const reward = await this.prisma.loyaltyReward.create({
      data: {
        programId,
        ...data,
      },
    });

    this.logger.log(`Created reward ${reward.name} for program ${programId}`);

    return reward;
  }

  /**
   * Update reward
   */
  async updateReward(id: string, data: any) {
    await this.getReward(id); // Verify exists

    const reward = await this.prisma.loyaltyReward.update({
      where: { id },
      data,
    });

    return reward;
  }

  /**
   * Delete reward
   */
  async deleteReward(id: string) {
    await this.getReward(id); // Verify exists

    // Check if reward has redemptions
    const redemptionCount = await this.prisma.rewardRedemption.count({
      where: { rewardId: id },
    });

    if (redemptionCount > 0) {
      throw new BadRequestException(
        'Cannot delete reward with existing redemptions. Deactivate instead.'
      );
    }

    await this.prisma.loyaltyReward.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Toggle reward active status
   */
  async toggleRewardStatus(id: string) {
    const reward = await this.getReward(id);

    const updated = await this.prisma.loyaltyReward.update({
      where: { id },
      data: { isActive: !reward.isActive },
    });

    return updated;
  }

  /**
   * Redeem reward
   */
  async redeemReward(memberId: string, rewardId: string) {
    const member = await this.membersService.getMember(memberId);
    const reward = await this.getReward(rewardId);

    // Validate reward is active
    if (!reward.isActive) {
      throw new BadRequestException('Reward is not active');
    }

    // Validate reward belongs to member's program
    if (reward.programId !== member.programId) {
      throw new BadRequestException('Reward does not belong to member program');
    }

    // Validate member has enough points
    if (member.currentPoints < reward.pointsCost) {
      throw new BadRequestException(
        `Insufficient points. Required: ${reward.pointsCost}, Available: ${member.currentPoints}`
      );
    }

    // Validate tier requirement
    if (reward.requiredTierId && member.tierId !== reward.requiredTierId) {
      const requiredTier = reward.requiredTier;
      throw new BadRequestException(
        `Tier ${requiredTier?.name} required to redeem this reward`
      );
    }

    // Check stock availability
    if (reward.stockQuantity !== null) {
      const availableStock = await this.getAvailableStock(rewardId);
      if (availableStock <= 0) {
        throw new BadRequestException('Reward is out of stock');
      }
    }

    // Generate redemption code
    const code = await this.generateRedemptionCode();

    // Calculate expiration
    const expiresAt = reward.validityDays
      ? new Date(Date.now() + reward.validityDays * 24 * 60 * 60 * 1000)
      : undefined;

    // Create redemption
    const redemption = await this.prisma.rewardRedemption.create({
      data: {
        programId: member.programId,
        memberId,
        rewardId,
        pointsCost: reward.pointsCost,
        code,
        status: RedemptionStatus.PENDING,
        expiresAt,
      },
    });

    // Deduct points
    await this.membersService.deductPoints(
      memberId,
      reward.pointsCost,
      'SPENT_REWARD' as any,
      `Redeemed reward: ${reward.name}`,
      redemption.id
    );

    this.logger.log(`Member ${memberId} redeemed reward ${reward.name} with code ${code}`);

    return redemption;
  }

  /**
   * Get member redemptions
   */
  async getMemberRedemptions(memberId: string, status?: RedemptionStatus) {
    const where: any = { memberId };

    if (status) {
      where.status = status;
    }

    const redemptions = await this.prisma.rewardRedemption.findMany({
      where,
      include: {
        reward: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { redeemedAt: 'desc' },
    });

    return redemptions;
  }

  /**
   * Get redemption by code
   */
  async getRedemptionByCode(code: string) {
    const redemption = await this.prisma.rewardRedemption.findUnique({
      where: { code },
      include: {
        member: {
          include: {
            customer: true,
          },
        },
        reward: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!redemption) {
      throw new NotFoundException('Redemption not found');
    }

    return redemption;
  }

  /**
   * Validate redemption code
   */
  async validateRedemptionCode(code: string) {
    const redemption = await this.getRedemptionByCode(code);

    const now = new Date();

    // Check if already used
    if (redemption.status === RedemptionStatus.USED) {
      return {
        valid: false,
        reason: 'Code has already been used',
        usedAt: redemption.usedAt,
      };
    }

    // Check if cancelled
    if (redemption.status === RedemptionStatus.CANCELLED) {
      return {
        valid: false,
        reason: 'Redemption has been cancelled',
      };
    }

    // Check if expired
    if (redemption.expiresAt && redemption.expiresAt < now) {
      return {
        valid: false,
        reason: 'Code has expired',
        expiresAt: redemption.expiresAt,
      };
    }

    return {
      valid: true,
      redemption,
    };
  }

  /**
   * Mark redemption as used
   */
  async markRedemptionAsUsed(code: string) {
    const validation = await this.validateRedemptionCode(code);

    if (!validation.valid) {
      throw new BadRequestException(validation.reason);
    }

    const redemption = await this.prisma.rewardRedemption.update({
      where: { code },
      data: {
        status: RedemptionStatus.USED,
        usedAt: new Date(),
      },
    });

    this.logger.log(`Redemption ${code} marked as used`);

    return redemption;
  }

  /**
   * Cancel redemption and refund points
   */
  async cancelRedemption(id: string, reason?: string) {
    const redemption = await this.prisma.rewardRedemption.findUnique({
      where: { id },
      include: {
        reward: true,
      },
    });

    if (!redemption) {
      throw new NotFoundException('Redemption not found');
    }

    if (redemption.status === RedemptionStatus.USED) {
      throw new BadRequestException('Cannot cancel a used redemption');
    }

    if (redemption.status === RedemptionStatus.CANCELLED) {
      throw new BadRequestException('Redemption is already cancelled');
    }

    // Update redemption status
    const updated = await this.prisma.rewardRedemption.update({
      where: { id },
      data: {
        status: RedemptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });

    // Refund points
    await this.membersService.addPoints(
      redemption.memberId,
      redemption.pointsCost,
      'EARNED_MANUAL' as any,
      `Refund from cancelled redemption: ${redemption.reward.name}${reason ? ` - ${reason}` : ''}`
    );

    this.logger.log(`Redemption ${id} cancelled and points refunded`);

    return updated;
  }

  /**
   * Expire old redemptions
   */
  async expireRedemptions() {
    const now = new Date();

    const expiredRedemptions = await this.prisma.rewardRedemption.findMany({
      where: {
        status: RedemptionStatus.PENDING,
        expiresAt: { lte: now },
      },
    });

    for (const redemption of expiredRedemptions) {
      await this.cancelRedemption(redemption.id, 'Expired');
    }

    this.logger.log(`Expired ${expiredRedemptions.length} redemptions`);

    return expiredRedemptions.length;
  }

  /**
   * Generate unique redemption code
   */
  private async generateRedemptionCode(): Promise<string> {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      // Generate 12 character code (XXXX-XXXX-XXXX format)
      const parts = [];
      for (let i = 0; i < 3; i++) {
        let part = '';
        for (let j = 0; j < 4; j++) {
          part += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        parts.push(part);
      }
      code = parts.join('-');

      // Check if code already exists
      const existing = await this.prisma.rewardRedemption.findUnique({
        where: { code },
      });

      isUnique = !existing;
    }

    return code!;
  }

  /**
   * Get available stock for reward
   */
  private async getAvailableStock(rewardId: string): Promise<number> {
    const reward = await this.prisma.loyaltyReward.findUnique({
      where: { id: rewardId },
      select: { stockQuantity: true },
    });

    if (reward?.stockQuantity === null) {
      return Infinity; // Unlimited stock
    }

    const usedStock = await this.prisma.rewardRedemption.count({
      where: {
        rewardId,
        status: {
          in: [RedemptionStatus.PENDING, RedemptionStatus.USED],
        },
      },
    });

    return (reward?.stockQuantity || 0) - usedStock;
  }

  /**
   * Get reward statistics
   */
  async getRewardStatistics(rewardId: string) {
    const reward = await this.getReward(rewardId);

    const [totalRedemptions, pendingRedemptions, usedRedemptions, cancelledRedemptions] =
      await Promise.all([
        this.prisma.rewardRedemption.count({
          where: { rewardId },
        }),
        this.prisma.rewardRedemption.count({
          where: { rewardId, status: RedemptionStatus.PENDING },
        }),
        this.prisma.rewardRedemption.count({
          where: { rewardId, status: RedemptionStatus.USED },
        }),
        this.prisma.rewardRedemption.count({
          where: { rewardId, status: RedemptionStatus.CANCELLED },
        }),
      ]);

    // Get top redeemers
    const topRedeemers = await this.prisma.rewardRedemption.groupBy({
      by: ['memberId'],
      where: { rewardId },
      _count: true,
      orderBy: {
        _count: {
          memberId: 'desc',
        },
      },
      take: 10,
    });

    // Enrich with member details
    const enrichedTopRedeemers = await Promise.all(
      topRedeemers.map(async (item) => {
        const member = await this.prisma.loyaltyMember.findUnique({
          where: { id: item.memberId },
          include: {
            customer: true,
          },
        });
        return {
          member,
          redemptions: item._count,
        };
      })
    );

    const availableStock = await this.getAvailableStock(rewardId);

    return {
      totalRedemptions,
      pendingRedemptions,
      usedRedemptions,
      cancelledRedemptions,
      totalPointsCost: totalRedemptions * reward.pointsCost,
      availableStock: reward.stockQuantity === null ? 'Unlimited' : availableStock,
      topRedeemers: enrichedTopRedeemers,
    };
  }
}
