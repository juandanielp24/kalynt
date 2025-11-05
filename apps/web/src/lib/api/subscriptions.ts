import { apiClient } from './client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  price: number;
  interval: BillingInterval;
  intervalCount: number;
  currency: string;
  trialDays?: number;
  setupFee?: number;
  features?: string[];
  maxUsers?: number;
  maxProducts?: number;
  maxStorage?: number;
  customLimits?: any;
  displayOrder: number;
  isPopular: boolean;
  badge?: string;
  createdAt: string;
  updatedAt: string;
  addons?: PlanAddon[];
  _count?: {
    subscriptions: number;
  };
}

export interface PlanAddon {
  id: string;
  planId: string;
  name: string;
  description?: string;
  price: number;
  interval: BillingInterval;
  intervalCount: number;
  quantity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  planId: string;
  customerId: string;
  status: SubscriptionStatus;
  price: number;
  interval: BillingInterval;
  intervalCount: number;
  currency: string;
  trialStartDate?: string;
  trialEndDate?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  cancellationReason?: string;
  pausedAt?: string;
  pauseReason?: string;
  resumeAt?: string;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  plan?: SubscriptionPlan;
  customer?: any;
  addons?: SubscriptionAddon[];
  periods?: SubscriptionPeriod[];
}

export interface SubscriptionAddon {
  id: string;
  subscriptionId: string;
  addonId: string;
  quantity: number;
  price: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  addon?: PlanAddon;
}

export interface SubscriptionPeriod {
  id: string;
  subscriptionId: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: PeriodStatus;
  invoiceId?: string;
  paidAt?: string;
}

export interface SubscriptionInvoice {
  id: string;
  subscriptionId: string;
  customerId: string;
  invoiceNumber: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  transactionId?: string;
  items: any[];
  pdfUrl?: string;
  notes?: string;
  subscription?: Subscription;
  customer?: any;
}

export interface UsageRecord {
  metric: string;
  quantity: number;
  recordDate: string;
}

export interface UsageSummary {
  metric: string;
  totalQuantity: number;
  recordCount: number;
}

export interface UsageLimit {
  limit: number;
  current: number;
  remaining: number;
  percentage: number;
  exceeded: boolean;
}

export enum BillingInterval {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PAUSED = 'PAUSED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PeriodStatus {
  PENDING = 'PENDING',
  BILLED = 'BILLED',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export const BILLING_INTERVAL_LABELS: Record<BillingInterval, string> = {
  DAILY: 'Diario',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensual',
  QUARTERLY: 'Trimestral',
  YEARLY: 'Anual',
};

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  TRIAL: 'Prueba',
  ACTIVE: 'Activa',
  PAST_DUE: 'Vencida',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
  PAUSED: 'Pausada',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  DRAFT: 'Borrador',
  PENDING: 'Pendiente',
  PAID: 'Pagada',
  FAILED: 'Fallida',
  CANCELLED: 'Cancelada',
  REFUNDED: 'Reembolsada',
};

export const subscriptionsApi = {
  // Plans
  getPlans: async (params?: { isActive?: boolean }) => {
    const response = await apiClient.get('/subscriptions/plans', { params });
    return response.data;
  },

  getPlan: async (id: string) => {
    const response = await apiClient.get(`/subscriptions/plans/${id}`);
    return response.data;
  },

  createPlan: async (data: Partial<SubscriptionPlan>) => {
    const response = await apiClient.post('/subscriptions/plans', data);
    return response.data;
  },

  updatePlan: async (id: string, data: Partial<SubscriptionPlan>) => {
    const response = await apiClient.put(`/subscriptions/plans/${id}`, data);
    return response.data;
  },

  deletePlan: async (id: string) => {
    const response = await apiClient.delete(`/subscriptions/plans/${id}`);
    return response.data;
  },

  togglePlanStatus: async (id: string) => {
    const response = await apiClient.patch(`/subscriptions/plans/${id}/toggle-status`);
    return response.data;
  },

  getPlanStatistics: async (id: string) => {
    const response = await apiClient.get(`/subscriptions/plans/${id}/statistics`);
    return response.data;
  },

  // Addons
  createAddon: async (planId: string, data: Partial<PlanAddon>) => {
    const response = await apiClient.post(
      `/subscriptions/plans/${planId}/addons`,
      data
    );
    return response.data;
  },

  updateAddon: async (id: string, data: Partial<PlanAddon>) => {
    const response = await apiClient.put(`/subscriptions/addons/${id}`, data);
    return response.data;
  },

  deleteAddon: async (id: string) => {
    const response = await apiClient.delete(`/subscriptions/addons/${id}`);
    return response.data;
  },

  // Subscriptions
  getSubscriptions: async (params?: {
    status?: SubscriptionStatus;
    customerId?: string;
    planId?: string;
  }) => {
    const response = await apiClient.get('/subscriptions', { params });
    return response.data;
  },

  getSubscription: async (id: string) => {
    const response = await apiClient.get(`/subscriptions/${id}`);
    return response.data;
  },

  createSubscription: async (data: {
    planId: string;
    customerId: string;
    startDate?: Date;
    trialDays?: number;
  }) => {
    const response = await apiClient.post('/subscriptions', data);
    return response.data;
  },

  cancelSubscription: async (id: string, data?: { immediate?: boolean; reason?: string }) => {
    const response = await apiClient.post(`/subscriptions/${id}/cancel`, data);
    return response.data;
  },

  reactivateSubscription: async (id: string) => {
    const response = await apiClient.post(`/subscriptions/${id}/reactivate`);
    return response.data;
  },

  pauseSubscription: async (id: string, data?: { reason?: string; resumeAt?: Date }) => {
    const response = await apiClient.post(`/subscriptions/${id}/pause`, data);
    return response.data;
  },

  resumeSubscription: async (id: string) => {
    const response = await apiClient.post(`/subscriptions/${id}/resume`);
    return response.data;
  },

  changePlan: async (id: string, data: {
    newPlanId: string;
    immediate?: boolean;
    prorate?: boolean;
  }) => {
    const response = await apiClient.post(`/subscriptions/${id}/change-plan`, data);
    return response.data;
  },

  addAddon: async (subscriptionId: string, data: { addonId: string; quantity?: number }) => {
    const response = await apiClient.post(
      `/subscriptions/${subscriptionId}/addons`,
      data
    );
    return response.data;
  },

  removeAddon: async (subscriptionAddonId: string) => {
    const response = await apiClient.delete(
      `/subscriptions/addons/${subscriptionAddonId}`
    );
    return response.data;
  },

  // Invoices
  getCustomerInvoices: async (customerId: string) => {
    const response = await apiClient.get(`/subscriptions/billing/invoices/customer/${customerId}`);
    return response.data;
  },

  getInvoice: async (id: string) => {
    const response = await apiClient.get(`/subscriptions/billing/invoices/${id}`);
    return response.data;
  },

  generateInvoice: async (subscriptionId: string) => {
    const response = await apiClient.post(`/subscriptions/billing/invoices/generate/${subscriptionId}`);
    return response.data;
  },

  processPayment: async (
    invoiceId: string,
    data: { paymentMethod: string; transactionId: string }
  ) => {
    const response = await apiClient.post(
      `/subscriptions/billing/invoices/${invoiceId}/payment`,
      data
    );
    return response.data;
  },

  // Usage
  getUsage: async (
    subscriptionId: string,
    params?: { metric?: string; startDate?: string; endDate?: string }
  ) => {
    const response = await apiClient.get(`/subscriptions/usage/${subscriptionId}`, {
      params,
    });
    return response.data;
  },

  getUsageSummary: async (
    subscriptionId: string,
    params?: { startDate?: string; endDate?: string }
  ) => {
    const response = await apiClient.get(
      `/subscriptions/usage/${subscriptionId}/summary`,
      { params }
    );
    return response.data;
  },

  checkUsageLimits: async (subscriptionId: string) => {
    const response = await apiClient.get(
      `/subscriptions/usage/${subscriptionId}/limits`
    );
    return response.data;
  },

  recordUsage: async (data: {
    subscriptionId: string;
    metric: string;
    quantity: number;
    metadata?: any;
  }) => {
    const response = await apiClient.post(
      '/subscriptions/usage/record',
      data
    );
    return response.data;
  },

  getUsageOverTime: async (
    subscriptionId: string,
    metric: string,
    params?: { startDate?: string; endDate?: string; interval?: 'day' | 'week' | 'month' }
  ) => {
    const response = await apiClient.get(
      `/subscriptions/usage/${subscriptionId}/over-time`,
      { params: { metric, ...params } }
    );
    return response.data;
  },

  incrementUsage: async (data: {
    subscriptionId: string;
    metric: string;
    quantity?: number;
  }) => {
    const response = await apiClient.post('/subscriptions/usage/increment', data);
    return response.data;
  },

  decrementUsage: async (data: {
    subscriptionId: string;
    metric: string;
    quantity?: number;
  }) => {
    const response = await apiClient.post('/subscriptions/usage/decrement', data);
    return response.data;
  },

  // Statistics
  getStatistics: async () => {
    const response = await apiClient.get('/subscriptions/statistics/overview');
    return response.data;
  },

  getBillingStatistics: async (params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get('/subscriptions/billing/statistics', {
      params,
    });
    return response.data;
  },
};
