import { apiClient } from '../api-client';

export interface Promotion {
  id: string;
  name: string;
  description?: string;
  code?: string;
  type: PromotionType;
  discountType: DiscountType;
  discountValue: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  maxUses?: number;
  maxUsesPerCustomer?: number;
  currentUses: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  applicableToAll: boolean;
  applicableProducts?: string[];
  applicableCategories?: string[];
  excludedProducts?: string[];
  applicableLocations?: string[];
  applicableToNewCustomers: boolean;
  applicableToReturningCustomers: boolean;
  canStackWithOthers: boolean;
  priority: number;
  autoApply: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    coupons: number;
    usageHistory: number;
  };
}

export interface Coupon {
  id: string;
  code: string;
  promotionId: string;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: string;
  usedInSale?: string;
  maxUses?: number;
  currentUses: number;
  isActive: boolean;
  assignedTo?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
  promotion?: Promotion;
  customer?: any;
}

export enum PromotionType {
  COUPON = 'COUPON',
  AUTOMATIC = 'AUTOMATIC',
  BUNDLE = 'BUNDLE',
  VOLUME = 'VOLUME',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SHIPPING = 'FREE_SHIPPING',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
  FIXED_PRICE = 'FIXED_PRICE',
}

export const PROMOTION_TYPE_LABELS: Record<PromotionType, string> = {
  COUPON: 'Cupón',
  AUTOMATIC: 'Automática',
  BUNDLE: 'Paquete',
  VOLUME: 'Por Volumen',
};

export const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  PERCENTAGE: 'Porcentaje',
  FIXED_AMOUNT: 'Monto Fijo',
  FREE_SHIPPING: 'Envío Gratis',
  BUY_X_GET_Y: 'Compra X Lleva Y',
  FIXED_PRICE: 'Precio Fijo',
};

export const promotionsApi = {
  // Promotions
  getPromotions: async (params?: {
    isActive?: boolean;
    type?: PromotionType;
    includeExpired?: boolean;
  }) => {
    const response = await apiClient.get('/promotions', { params });
    return response.data;
  },

  getPromotion: async (id: string) => {
    const response = await apiClient.get(`/promotions/${id}`);
    return response.data;
  },

  createPromotion: async (data: Partial<Promotion>) => {
    const response = await apiClient.post('/promotions', data);
    return response.data;
  },

  updatePromotion: async (id: string, data: Partial<Promotion>) => {
    const response = await apiClient.put(`/promotions/${id}`, data);
    return response.data;
  },

  deletePromotion: async (id: string) => {
    const response = await apiClient.delete(`/promotions/${id}`);
    return response.data;
  },

  togglePromotionStatus: async (id: string) => {
    const response = await apiClient.put(`/promotions/${id}/toggle`);
    return response.data;
  },

  getPromotionStatistics: async (id: string) => {
    const response = await apiClient.get(`/promotions/${id}/statistics`);
    return response.data;
  },

  // Coupons
  getCoupons: async (
    promotionId: string,
    params?: {
      isActive?: boolean;
      isUsed?: boolean;
      assignedTo?: string;
    }
  ) => {
    const response = await apiClient.get(`/promotions/${promotionId}/coupons`, {
      params,
    });
    return response.data;
  },

  createCoupon: async (promotionId: string, data?: Partial<Coupon>) => {
    const response = await apiClient.post(`/promotions/${promotionId}/coupons`, data);
    return response.data;
  },

  generateBulkCoupons: async (
    promotionId: string,
    data: { quantity: number; prefix?: string; maxUsesPerCoupon?: number }
  ) => {
    const response = await apiClient.post(
      `/promotions/${promotionId}/coupons/bulk`,
      data
    );
    return response.data;
  },

  validateCoupon: async (data: {
    code: string;
    customerId?: string;
    subtotal?: number;
    items?: Array<{ productId: string; quantity: number }>;
  }) => {
    const response = await apiClient.post('/promotions/coupons/validate', data);
    return response.data;
  },

  deactivateCoupon: async (id: string) => {
    const response = await apiClient.put(`/promotions/coupons/${id}/deactivate`);
    return response.data;
  },

  assignCoupon: async (id: string, customerId: string) => {
    const response = await apiClient.put(`/promotions/coupons/${id}/assign`, {
      customerId,
    });
    return response.data;
  },

  // Discount Calculation
  calculateDiscounts: async (data: {
    customerId?: string;
    locationId?: string;
    items: Array<{ productId: string; quantity: number; price: number }>;
    couponCode?: string;
  }) => {
    const response = await apiClient.post('/promotions/calculate', data);
    return response.data;
  },

  getApplicablePromotions: async (params?: {
    customerId?: string;
    locationId?: string;
    subtotal?: number;
  }) => {
    const response = await apiClient.get('/promotions/applicable', { params });
    return response.data;
  },
};
