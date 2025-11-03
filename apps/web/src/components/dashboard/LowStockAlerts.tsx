'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@retail/ui';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@retail/ui';
import Link from 'next/link';

interface LowStockAlertsProps {
  data: Array<{
    id: string;
    name: string;
    currentStock: number;
    minStock: number;
  }>;
}

export function LowStockAlerts({ data }: LowStockAlertsProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Stock Bajo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              ¡Todo bien! No hay productos con stock bajo.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Stock Bajo</CardTitle>
          <div className="rounded-full bg-destructive/10 px-2 py-1">
            <span className="text-xs font-medium text-destructive">
              {data.length} productos
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 5).map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-sm font-medium">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {product.currentStock} / Mínimo: {product.minStock}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/inventory/${product.id}`}>Ver</Link>
              </Button>
            </div>
          ))}
          {data.length > 5 && (
            <Button variant="outline" className="w-full" asChild>
              <Link href="/inventory?filter=low-stock">
                Ver todos ({data.length})
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
