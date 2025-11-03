import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export interface DashboardData {
  overview: {
    totalSalesToday: number;
    totalSalesCents: number;
    transactionsCount: number;
    averageTicketCents: number;
    growthPercentage: number;
  };
  salesChart: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    quantitySold: number;
    revenueCents: number;
  }>;
  recentSales: Array<{
    id: string;
    saleNumber: string;
    customerName: string;
    totalCents: number;
    createdAt: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    currentStock: number;
    minStock: number;
  }>;
}

export function useDashboardData(dateRange?: { from: Date; to: Date }) {
  const from = dateRange?.from || startOfMonth(new Date());
  const to = dateRange?.to || endOfMonth(new Date());

  return useQuery<DashboardData>({
    queryKey: ['dashboard', format(from, 'yyyy-MM-dd'), format(to, 'yyyy-MM-dd')],
    queryFn: async () => {
      const response = await apiClient.get('/dashboard', {
        params: {
          dateFrom: from.toISOString(),
          dateTo: to.toISOString(),
        },
      });
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchInterval: 5 * 60 * 1000, // Auto-refresh cada 5 min
  });
}

export function useChartData(period: 'day' | 'week' | 'month' = 'month') {
  return useQuery({
    queryKey: ['chart-data', period],
    queryFn: async () => {
      const response = await apiClient.get(`/analytics/sales-chart`, {
        params: { period },
      });
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
