'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { usePOSStore } from '@/stores/pos-store';
import { Input, Card, Badge } from '@retail/ui';
import { Search, Barcode, Package } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { useToast } from '@retail/ui';

interface Product {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  taxRate: number;
  barcode?: string;
  stock: Array<{
    quantity: number;
    locationId: string;
  }>;
  category?: {
    name: string;
  };
  imageUrl?: string;
}

export function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const addItem = usePOSStore((state) => state.addItem);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // Query products
  const { data, isLoading } = useQuery({
    queryKey: ['products', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) return { data: [] };

      const response = await apiClient.get('/products', {
        params: {
          search: debouncedSearch,
          limit: 20,
        },
      });
      return response.data;
    },
    enabled: debouncedSearch.length >= 2,
  });

  const products: Product[] = data?.data || [];

  // Handle product selection
  const handleSelectProduct = useCallback(
    (product: Product) => {
      // Check stock
      const currentStock = product.stock[0]?.quantity || 0;

      if (currentStock <= 0) {
        toast({
          title: 'Sin stock',
          description: `${product.name} no tiene stock disponible`,
          variant: 'destructive',
        });
        return;
      }

      addItem(product);

      toast({
        title: 'Producto agregado',
        description: `${product.name} agregado al carrito`,
      });

      // Clear search and focus
      setSearchTerm('');
      inputRef.current?.focus();
    },
    [addItem, toast]
  );

  // Barcode scanner support
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Detect barcode scanner (usually ends with Enter)
      if (e.key === 'Enter' && searchTerm) {
        // Try to find by barcode
        const product = products.find((p) => p.barcode === searchTerm);
        if (product) {
          handleSelectProduct(product);
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [searchTerm, products, handleSelectProduct]);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar productos por nombre, SKU o código de barras..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 text-lg h-14"
          autoFocus
        />
        <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-8 text-gray-500">
          Buscando productos...
        </div>
      )}

      {/* Results */}
      {!isLoading && searchTerm.length >= 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No se encontraron productos</p>
            </div>
          ) : (
            products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={handleSelectProduct}
              />
            ))
          )}
        </div>
      )}

      {/* Empty State */}
      {!searchTerm && (
        <div className="text-center py-12 text-gray-500">
          <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">Busca productos para comenzar</p>
          <p className="text-sm mt-2">
            Escribe el nombre, SKU o escanea el código de barras
          </p>
        </div>
      )}
    </div>
  );
}

// Product Card Component
function ProductCard({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: (product: Product) => void;
}) {
  const stock = product.stock[0]?.quantity || 0;
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 5;

  return (
    <Card
      className={`p-4 cursor-pointer transition-all hover:shadow-md ${
        isOutOfStock ? 'opacity-50' : ''
      }`}
      onClick={() => !isOutOfStock && onSelect(product)}
    >
      <div className="flex items-start gap-3">
        {/* Product Image */}
        <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center flex-shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover rounded-md"
            />
          ) : (
            <Package className="h-8 w-8 text-gray-400" />
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{product.name}</h3>
          <p className="text-sm text-gray-500 truncate">SKU: {product.sku}</p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-lg font-bold text-primary">
              ${(product.priceCents / 100).toFixed(2)}
            </span>

            {isOutOfStock && (
              <Badge variant="destructive">Sin stock</Badge>
            )}
            {isLowStock && (
              <Badge variant="secondary">Stock: {stock}</Badge>
            )}
          </div>

          {product.category && (
            <p className="text-xs text-gray-500 mt-1">{product.category.name}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
