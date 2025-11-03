import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { getProductsCache, saveProductsCache } from '@/lib/database';

interface Product {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  taxRate: number;
  imageUrl?: string;
}

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        // Try to fetch from API
        const response = await apiClient.get<Product[]>('/api/products');
        const products = response.data;

        // Cache products for offline use
        saveProductsCache(products);

        return products;
      } catch (error) {
        // If API fails, fallback to cached data
        console.log('Using cached products due to network error');
        const cached = getProductsCache();
        return cached.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          priceCents: p.price_cents,
          taxRate: p.tax_rate,
        }));
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProduct(id: string) {
  return useQuery<Product>({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await apiClient.get<Product>(`/api/products/${id}`);
      return response.data;
    },
  });
}
