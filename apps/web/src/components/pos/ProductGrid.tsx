'use client';

import { Package, Plus } from 'lucide-react';
import { Card, Button, Badge } from '@retail/ui';
import { formatCurrencyARS } from '@retail/shared';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  priceCents: number;
  taxRate: number;
  category?: {
    name: string;
  };
  stock?: Array<{
    quantity: number;
  }>;
}

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  onProductSelect: (product: Product) => void;
}

export function ProductGrid({ products, isLoading, onProductSelect }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-24 bg-muted rounded mb-3" />
            <div className="h-4 bg-muted rounded mb-2" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No hay productos</h3>
        <p className="text-muted-foreground">
          No se encontraron productos. Intenta con otra búsqueda.
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => {
        const stockQuantity = product.stock?.[0]?.quantity || 0;
        const inStock = stockQuantity > 0;
        const lowStock = stockQuantity > 0 && stockQuantity <= 5;

        return (
          <Card
            key={product.id}
            className={`p-4 cursor-pointer hover:shadow-lg transition-shadow ${
              !inStock ? 'opacity-50' : ''
            }`}
            onClick={() => inStock && onProductSelect(product)}
          >
            {/* Product Image Placeholder */}
            <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>

            {/* Product Info */}
            <div className="space-y-2">
              <div>
                <h3 className="font-semibold line-clamp-2 min-h-[2.5rem]">
                  {product.name}
                </h3>
                <p className="text-sm text-muted-foreground">{product.sku}</p>
              </div>

              {product.category && (
                <Badge variant="outline" className="text-xs">
                  {product.category.name}
                </Badge>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">
                    {formatCurrencyARS(product.priceCents)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    + IVA {(product.taxRate * 100).toFixed(1)}%
                  </p>
                </div>

                <Button
                  size="icon"
                  disabled={!inStock}
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductSelect(product);
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Stock indicator */}
              <div className="pt-2 border-t">
                {inStock ? (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Stock:</span>
                    <span
                      className={`font-medium ${
                        lowStock ? 'text-orange-600' : 'text-green-600'
                      }`}
                    >
                      {stockQuantity} {lowStock && '⚠️'}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-red-600 font-medium">
                    Sin stock
                  </span>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
