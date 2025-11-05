import { apiClient } from './client';

export interface DashboardData {
  period: {
    current: { start: string; end: string };
    previous: { start: string; end: string };
  };
  sales: {
    current: SalesMetrics;
    previous: SalesMetrics;
    growth: number;
  };
  revenueByDay: RevenueByDay[];
  topProducts: TopProduct[];
  topCategories: TopCategory[];
  salesByLocation: LocationSales[];
  salesByPaymentMethod: PaymentMethodSales[];
  customers: CustomerMetrics;
  inventory: InventoryMetrics;
  insights: Insight[];
}

export interface SalesMetrics {
  totalSales: number;
  totalRevenue: number;
  totalDiscount: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  averageTicket: number;
  totalItemsSold: number;
  averageItemsPerSale: number;
}

export interface RevenueByDay {
  date: string;
  revenue: number;
  sales: number;
  profit: number;
}

export interface TopProduct {
  rank: number;
  productId: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
}

export interface TopCategory {
  rank: number;
  categoryId: string;
  categoryName: string;
  quantity: number;
  revenue: number;
  salesCount: number;
}

export interface LocationSales {
  locationId: string;
  locationName: string;
  salesCount: number;
  revenue: number;
  averageTicket: number;
}

export interface PaymentMethodSales {
  method: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  customersWithPurchases: number;
  averageCustomerValue: number;
  repeatCustomers: number;
  repeatRate: number;
}

export interface InventoryMetrics {
  totalProducts: number;
  totalStock: number;
  totalStockValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  averageStockValue: number;
}

export interface Insight {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description: string;
  metric: number;
  icon: string;
}

export interface TrendData {
  period: string;
  salesCount: number;
  revenue: number;
  cost: number;
  profit: number;
  averageTicket: number;
}

export interface CustomerSegmentation {
  segments: {
    champions: SegmentData;
    loyal: SegmentData;
    potentialLoyalist: SegmentData;
    newCustomers: SegmentData;
    atRisk: SegmentData;
    cantLose: SegmentData;
    hibernating: SegmentData;
  };
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    atRiskCustomers: number;
    inactiveCustomers: number;
  };
}

export interface SegmentData {
  count: number;
  customers: CustomerSegmentDetail[];
  description: string;
}

export interface CustomerSegmentDetail {
  id: string;
  name: string;
  recency: number;
  frequency: number;
  monetary: number;
  lastPurchase: string;
}

export interface ProductPerformance {
  products: ProductPerformanceDetail[];
  summary: {
    totalProducts: number;
    totalRevenue: number;
    totalProfit: number;
    averageMargin: number;
  };
}

export interface ProductPerformanceDetail {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  currentStock: number;
  turnoverRate: number;
  daysOfStock: number;
}

export interface HourlyPattern {
  hour: number;
  hourLabel: string;
  salesCount: number;
  revenue: number;
  averageTicket: number;
}

export const analyticsApi = {
  getDashboard: async (period?: string) => {
    const response = await apiClient.get('/analytics/dashboard', {
      params: { period },
    });
    return response.data;
  },

  getTrends: async (period?: 'week' | 'month' | 'year') => {
    const response = await apiClient.get('/analytics/trends', {
      params: { period },
    });
    return response.data;
  },

  getCustomerSegmentation: async () => {
    const response = await apiClient.get('/analytics/customer-segmentation');
    return response.data;
  },

  getProductPerformance: async (period?: string) => {
    const response = await apiClient.get('/analytics/product-performance', {
      params: { period },
    });
    return response.data;
  },

  getHourlyPattern: async (days?: number) => {
    const response = await apiClient.get('/analytics/hourly-pattern', {
      params: { days },
    });
    return response.data;
  },

  exportData: async (
    type: 'dashboard' | 'products' | 'customers',
    period?: string,
    format?: 'csv' | 'xlsx' | 'pdf'
  ) => {
    const response = await apiClient.post(
      '/analytics/export',
      { type, period, format },
      { responseType: 'blob' }
    );
    return response.data;
  },
};
