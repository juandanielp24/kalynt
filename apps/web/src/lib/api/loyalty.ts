import { apiClient } from './client';

export interface LoyaltyProgram {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  pointsPerAmount: number;
  minimumPurchase: number;
  pointsExpireDays?: number;
  pointsValue: number;
  minimumRedemption: number;
  welcomePoints: number;
  birthdayPoints: number;
  referralPoints: number;
  refereePoints: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    rewards: number;
    tiers: number;
  };
}

export interface LoyaltyTier {
  id: string;
  programId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  pointsRequired: number;
  order: number;
  pointsMultiplier: number;
  discountPercentage: number;
  freeShipping: boolean;
  prioritySupport: boolean;
  customBenefits?: string[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
  };
}

export interface LoyaltyReward {
  id: string;
  programId: string;
  name: string;
  description: string;
  imageUrl?: string;
  pointsCost: number;
  type: RewardType;
  value?: number;
  productId?: string;
  isActive: boolean;
  stock?: number;
  requiredTierId?: string;
  validDays?: number;
  createdAt: string;
  updatedAt: string;
  product?: any;
  requiredTier?: LoyaltyTier;
  _count?: {
    redemptions: number;
  };
}

export interface LoyaltyMember {
  id: string;
  programId: string;
  customerId: string;
  currentPoints: number;
  lifetimePoints: number;
  tierId?: string;
  tierAchievedAt?: string;
  isActive: boolean;
  enrolledAt: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  program?: LoyaltyProgram;
  tier?: LoyaltyTier;
  customer?: any;
  transactions?: PointsTransaction[];
}

export interface PointsTransaction {
  id: string;
  type: PointsTransactionType;
  points: number;
  balance: number;
  description: string;
  expiresAt?: string;
  isExpired: boolean;
  createdAt: string;
}

export interface RewardRedemption {
  id: string;
  memberId: string;
  rewardId: string;
  pointsSpent: number;
  status: RedemptionStatus;
  redeemedAt: string;
  expiresAt?: string;
  usedAt?: string;
  usedInSale?: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
  reward?: LoyaltyReward;
  member?: LoyaltyMember;
}

export enum RewardType {
  DISCOUNT_PERCENTAGE = 'DISCOUNT_PERCENTAGE',
  DISCOUNT_FIXED = 'DISCOUNT_FIXED',
  FREE_PRODUCT = 'FREE_PRODUCT',
  FREE_SHIPPING = 'FREE_SHIPPING',
  STORE_CREDIT = 'STORE_CREDIT',
  CUSTOM = 'CUSTOM',
}

export enum PointsTransactionType {
  EARNED_PURCHASE = 'EARNED_PURCHASE',
  EARNED_WELCOME = 'EARNED_WELCOME',
  EARNED_BIRTHDAY = 'EARNED_BIRTHDAY',
  EARNED_REFERRAL = 'EARNED_REFERRAL',
  EARNED_MANUAL = 'EARNED_MANUAL',
  SPENT_REWARD = 'SPENT_REWARD',
  SPENT_DISCOUNT = 'SPENT_DISCOUNT',
  EXPIRED = 'EXPIRED',
  REVERSED = 'REVERSED',
}

export enum RedemptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export const REWARD_TYPE_LABELS: Record<RewardType, string> = {
  DISCOUNT_PERCENTAGE: 'Descuento %',
  DISCOUNT_FIXED: 'Descuento Fijo',
  FREE_PRODUCT: 'Producto Gratis',
  FREE_SHIPPING: 'Envío Gratis',
  STORE_CREDIT: 'Crédito',
  CUSTOM: 'Personalizado',
};

export const TRANSACTION_TYPE_LABELS: Record<PointsTransactionType, string> = {
  EARNED_PURCHASE: 'Compra',
  EARNED_WELCOME: 'Bienvenida',
  EARNED_BIRTHDAY: 'Cumpleaños',
  EARNED_REFERRAL: 'Referido',
  EARNED_MANUAL: 'Ajuste Manual',
  SPENT_REWARD: 'Canje Recompensa',
  SPENT_DISCOUNT: 'Descuento',
  EXPIRED: 'Expirado',
  REVERSED: 'Revertido',
};

export const REDEMPTION_STATUS_LABELS: Record<RedemptionStatus, string> = {
  PENDING: 'Pendiente',
  ACTIVE: 'Activo',
  USED: 'Usado',
  EXPIRED: 'Expirado',
  CANCELLED: 'Cancelado',
};

export const loyaltyApi = {
  // Programs
  getPrograms: async (isActive?: boolean) => {
    const response = await apiClient.get('/loyalty/programs', {
      params: { isActive },
    });
    return response.data;
  },

  getProgram: async (id: string) => {
    const response = await apiClient.get(`/loyalty/programs/${id}`);
    return response.data;
  },

  createProgram: async (data: Partial<LoyaltyProgram>) => {
    const response = await apiClient.post('/loyalty/programs', data);
    return response.data;
  },

  updateProgram: async (id: string, data: Partial<LoyaltyProgram>) => {
    const response = await apiClient.put(`/loyalty/programs/${id}`, data);
    return response.data;
  },

  deleteProgram: async (id: string) => {
    const response = await apiClient.delete(`/loyalty/programs/${id}`);
    return response.data;
  },

  toggleProgramStatus: async (id: string) => {
    const response = await apiClient.patch(`/loyalty/programs/${id}/toggle`);
    return response.data;
  },

  getProgramStatistics: async (id: string) => {
    const response = await apiClient.get(`/loyalty/programs/${id}/statistics`);
    return response.data;
  },

  // Tiers
  getTiers: async (programId: string) => {
    const response = await apiClient.get(`/loyalty/programs/${programId}/tiers`);
    return response.data;
  },

  createTier: async (programId: string, data: Partial<LoyaltyTier>) => {
    const response = await apiClient.post(
      `/loyalty/programs/${programId}/tiers`,
      data
    );
    return response.data;
  },

  updateTier: async (id: string, data: Partial<LoyaltyTier>) => {
    const response = await apiClient.put(`/loyalty/tiers/${id}`, data);
    return response.data;
  },

  deleteTier: async (id: string) => {
    const response = await apiClient.delete(`/loyalty/tiers/${id}`);
    return response.data;
  },

  // Members
  enrollCustomer: async (programId: string, customerId: string) => {
    const response = await apiClient.post('/loyalty/members/enroll', {
      programId,
      customerId,
    });
    return response.data;
  },

  getMember: async (id: string) => {
    const response = await apiClient.get(`/loyalty/members/${id}`);
    return response.data;
  },

  getMemberStatistics: async (id: string) => {
    const response = await apiClient.get(`/loyalty/members/${id}/statistics`);
    return response.data;
  },

  adjustPoints: async (memberId: string, points: number, reason: string) => {
    const response = await apiClient.post('/loyalty/points/adjust', {
      memberId,
      points,
      reason,
    });
    return response.data;
  },

  // Rewards
  getRewards: async (
    programId: string,
    params?: { isActive?: boolean; type?: RewardType }
  ) => {
    const response = await apiClient.get(`/loyalty/programs/${programId}/rewards`, {
      params,
    });
    return response.data;
  },

  getReward: async (id: string) => {
    const response = await apiClient.get(`/loyalty/rewards/${id}`);
    return response.data;
  },

  createReward: async (programId: string, data: Partial<LoyaltyReward>) => {
    const response = await apiClient.post(
      `/loyalty/programs/${programId}/rewards`,
      data
    );
    return response.data;
  },

  updateReward: async (id: string, data: Partial<LoyaltyReward>) => {
    const response = await apiClient.put(`/loyalty/rewards/${id}`, data);
    return response.data;
  },

  deleteReward: async (id: string) => {
    const response = await apiClient.delete(`/loyalty/rewards/${id}`);
    return response.data;
  },

  toggleRewardStatus: async (id: string) => {
    const response = await apiClient.patch(`/loyalty/rewards/${id}/toggle`);
    return response.data;
  },

  getRewardStatistics: async (id: string) => {
    const response = await apiClient.get(`/loyalty/rewards/${id}/statistics`);
    return response.data;
  },

  // Redemptions
  redeemReward: async (rewardId: string, memberId: string) => {
    const response = await apiClient.post('/loyalty/redemptions/redeem', {
      rewardId,
      memberId,
    });
    return response.data;
  },

  getMemberRedemptions: async (memberId: string, status?: RedemptionStatus) => {
    const response = await apiClient.get(`/loyalty/members/${memberId}/redemptions`, {
      params: { status },
    });
    return response.data;
  },

  validateRedemptionCode: async (code: string) => {
    const response = await apiClient.post('/loyalty/redemptions/validate', { code });
    return response.data;
  },

  markRedemptionAsUsed: async (code: string, saleId: string) => {
    const response = await apiClient.post('/loyalty/redemptions/use', {
      code,
      saleId,
    });
    return response.data;
  },

  cancelRedemption: async (id: string, reason?: string) => {
    const response = await apiClient.post(`/loyalty/redemptions/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  // Leaderboard
  getLeaderboard: async (
    programId: string,
    period?: 'all_time' | 'year' | 'month' | 'week',
    limit?: number
  ) => {
    const response = await apiClient.get(`/loyalty/programs/${programId}/leaderboard`, {
      params: { period, limit },
    });
    return response.data;
  },
};
