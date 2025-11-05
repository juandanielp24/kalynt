'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@retail/ui';

interface TopProductsProps {
  dateRange: { from: Date; to: Date };
}

export function TopProducts({ dateRange }: TopProductsProps) {
  const { data, isLoading } = useQuery({
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
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Productos Más Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">Cargando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Productos Más Vendidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No hay datos para mostrar
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos Más Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((product: any, index: number) => (
            <div
              key={product.productId}
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {index + 1}
                </div>

                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{product.productName}</h4>
                  {product.sku && (
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-8 text-right">
                <div>
                  <p className="text-sm text-gray-500">Unidades</p>
                  <p className="font-semibold text-gray-900">{product.unitsSold}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ingresos</p>
                  <p className="font-semibold text-gray-900">
                    ${(product.revenue / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
