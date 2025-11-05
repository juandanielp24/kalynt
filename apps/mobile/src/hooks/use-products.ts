import { useEffect, useState } from 'react';
import { db } from '../db';
import { products } from '../db/schema';
import { like, or } from 'drizzle-orm';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  priceCents: number;
  taxRate: number;
  imageUrl?: string;
  isActive: boolean;
  stock?: {
    quantity: number;
  };
}

export function useProducts(searchQuery: string) {
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setProductsList([]);
        return;
      }

      setIsLoading(true);

      try {
        const query = `%${searchQuery}%`;

        const results = await db.query.products.findMany({
          where: or(
            like(products.name, query),
            like(products.sku, query),
            like(products.barcode, query)
          ),
          with: {
            stock: {
              limit: 1,
            },
          },
          limit: 20,
        });

        setProductsList(results as any);
      } catch (error) {
        console.error('Failed to load products:', error);
        setProductsList([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [searchQuery]);

  return {
    products: productsList,
    isLoading,
  };
}
