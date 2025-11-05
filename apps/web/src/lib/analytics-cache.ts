import { QueryClient } from '@tanstack/react-query';
import { apiClient } from './api-client';

export const analyticsQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache analytics data for 5 minutes
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30, // Previously cacheTime

      // Retry failed requests
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Don't refetch on window focus for analytics
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Prefetch analytics data
 */
export async function prefetchAnalyticsData(
  dateRange: { from: Date; to: Date }
) {
  await analyticsQueryClient.prefetchQuery({
    queryKey: ['dashboard-analytics', dateRange],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/dashboard', {
        params: {
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
        },
      });
      return response.data.data;
    },
  });
}

/**
 * Prefetch all analytics charts data
 */
export async function prefetchAllAnalyticsCharts(
  dateRange: { from: Date; to: Date }
) {
  const prefetchPromises = [
    // Dashboard overview
    analyticsQueryClient.prefetchQuery({
      queryKey: ['dashboard-analytics', dateRange],
      queryFn: async () => {
        const response = await apiClient.get('/analytics/dashboard', {
          params: {
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString(),
          },
        });
        return response.data.data;
      },
    }),

    // Top products
    analyticsQueryClient.prefetchQuery({
      queryKey: ['top-products', dateRange],
      queryFn: async () => {
        const response = await apiClient.get('/analytics/top-products', {
          params: {
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString(),
            limit: 10,
          },
        });
        return response.data.data;
      },
    }),

    // Sales by category
    analyticsQueryClient.prefetchQuery({
      queryKey: ['sales-by-category', dateRange],
      queryFn: async () => {
        const response = await apiClient.get('/analytics/sales-by-category', {
          params: {
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString(),
          },
        });
        return response.data.data;
      },
    }),

    // Sales by payment method
    analyticsQueryClient.prefetchQuery({
      queryKey: ['sales-by-payment-method', dateRange],
      queryFn: async () => {
        const response = await apiClient.get('/analytics/sales-by-payment-method', {
          params: {
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString(),
          },
        });
        return response.data.data;
      },
    }),

    // Hourly distribution
    analyticsQueryClient.prefetchQuery({
      queryKey: ['hourly-distribution', dateRange],
      queryFn: async () => {
        const response = await apiClient.get('/analytics/hourly-distribution', {
          params: {
            startDate: dateRange.from.toISOString(),
            endDate: dateRange.to.toISOString(),
          },
        });
        return response.data.data;
      },
    }),
  ];

  await Promise.all(prefetchPromises);
}

/**
 * Invalidate all analytics cache
 */
export function invalidateAnalyticsCache() {
  analyticsQueryClient.invalidateQueries({
    predicate: (query) => {
      const key = query.queryKey[0];
      return typeof key === 'string' && (
        key.includes('analytics') ||
        key.includes('top-products') ||
        key.includes('sales-by-') ||
        key.includes('hourly-')
      );
    },
  });
}

/**
 * Clear all analytics cache
 */
export function clearAnalyticsCache() {
  analyticsQueryClient.clear();
}
