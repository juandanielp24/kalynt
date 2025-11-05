import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@retail/database';

@Injectable()
export class LoyaltyTiersService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get all tiers for a program
   */
  async getTiers(programId: string) {
    const tiers = await this.prisma.loyaltyTier.findMany({
      where: { programId },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    return tiers;
  }

  /**
   * Get tier by ID
   */
  async getTier(id: string) {
    const tier = await this.prisma.loyaltyTier.findUnique({
      where: { id },
      include: {
        program: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!tier) {
      throw new NotFoundException('Tier not found');
    }

    return tier;
  }

  /**
   * Create tier
   */
  async createTier(programId: string, data: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    pointsRequired: number;
    order?: number;
    pointsMultiplier?: number;
    discountPercentage?: number;
    freeShipping?: boolean;
    prioritySupport?: boolean;
    customBenefits?: string[];
  }) {
    const tier = await this.prisma.loyaltyTier.create({
      data: {
        programId,
        ...data,
      },
    });

    return tier;
  }

  /**
   * Update tier
   */
  async updateTier(id: string, data: any) {
    await this.getTier(id); // Verify exists

    const tier = await this.prisma.loyaltyTier.update({
      where: { id },
      data,
    });

    return tier;
  }

  /**
   * Delete tier
   */
  async deleteTier(id: string) {
    await this.getTier(id); // Verify exists

    // Check if tier has members
    const memberCount = await this.prisma.loyaltyMember.count({
      where: { tierId: id },
    });

    if (memberCount > 0) {
      throw new Error('Cannot delete tier with active members');
    }

    await this.prisma.loyaltyTier.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Determine tier based on lifetime points
   */
  async determineTier(programId: string, lifetimePoints: number) {
    const tiers = await this.getTiers(programId);

    // Find highest tier member qualifies for
    const qualifiedTiers = tiers.filter((t) => lifetimePoints >= t.pointsRequired);

    if (qualifiedTiers.length === 0) {
      return tiers[0]; // Return lowest tier
    }

    return qualifiedTiers[qualifiedTiers.length - 1]; // Return highest qualified
  }
}
