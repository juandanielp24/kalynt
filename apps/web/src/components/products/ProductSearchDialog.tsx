'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi, Product } from '@/lib/api/products';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Button,
  Badge,
  ScrollArea,
} from '@retail/ui';
import { Search, Package } from 'lucide-react';

interface ProductSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (product: Product) => void;
}

export function ProductSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: ProductSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['products-search', searchQuery],
    queryFn: () =>
      productsApi.findAll({
        search: searchQuery || undefined,
        limit: 20,
      }),
    enabled: open,
  });

  const products = productsData?.data || [];

  const handleSelectProduct = (product: Product) => {
    onSelect(product);
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buscar Producto</DialogTitle>
          <DialogDescription>
            Busca productos por nombre, SKU o código de barras
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, SKU o código de barras..."
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Products List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="text-center py-8 text-gray-600">
                Buscando productos...
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {searchQuery
                    ? 'No se encontraron productos'
                    : 'Escribe para buscar productos'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {products.map((product) => {
                  const totalStock = product.stock?.reduce(
                    (sum, s) => sum + s.quantity,
                    0
                  ) || 0;

                  return (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{product.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {product.sku}
                            </Badge>
                            {product.barcode && (
                              <Badge variant="outline" className="text-xs">
                                {product.barcode}
                              </Badge>
                            )}
                          </div>
                          {product.category && (
                            <p className="text-sm text-gray-600 mt-1">
                              {product.category.name}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            ${(product.priceCents / 100).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Stock: {totalStock}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
