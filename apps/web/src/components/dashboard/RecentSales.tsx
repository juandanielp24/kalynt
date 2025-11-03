'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@retail/ui';
import { formatCurrencyARS } from '@retail/shared';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@retail/ui';

interface RecentSalesProps {
  data: Array<{
    id: string;
    saleNumber: string;
    customerName: string;
    totalCents: number;
    createdAt: string;
  }>;
}

export function RecentSales({ data }: RecentSalesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventas Recientes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((sale) => (
            <div key={sale.id} className="flex items-center gap-4">
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {sale.customerName ? sale.customerName[0].toUpperCase() : 'CF'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">
                  {sale.customerName || 'Consumidor Final'}
                </p>
                <p className="text-sm text-muted-foreground">
                  #{sale.saleNumber} •{' '}
                  {formatDistanceToNow(new Date(sale.createdAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </p>
              </div>
              <div className="font-medium">
                {formatCurrencyARS(sale.totalCents)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
