import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { savePendingSale, getPendingSales } from '@/lib/database';
import { useSyncStore } from '@/store/sync-store';

interface Sale {
  id: string;
  tenantId: string;
  totalCents: number;
  taxCents: number;
  createdAt: string;
  items: SaleItem[];
}

interface SaleItem {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  taxRate: number;
}

interface CreateSaleInput {
  items: SaleItem[];
}

export function useSales() {
  return useQuery<Sale[]>({
    queryKey: ['sales'],
    queryFn: async () => {
      const response = await apiClient.get<Sale[]>('/api/sales');
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { incrementPendingChanges, decrementPendingChanges } = useSyncStore();

  return useMutation({
    mutationFn: async (input: CreateSaleInput) => {
      try {
        const response = await apiClient.post<Sale>('/api/sales', input);
        return response.data;
      } catch (error) {
        // If offline, save to pending queue
        const pendingSale = {
          id: `pending-${Date.now()}`,
          ...input,
          createdAt: new Date().toISOString(),
        };
        savePendingSale(pendingSale);
        incrementPendingChanges();
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
  });
}

export function usePendingSales() {
  return useQuery({
    queryKey: ['pending-sales'],
    queryFn: getPendingSales,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}
