'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@retail/ui';
import { formatCurrencyARS } from '@retail/shared';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
} from 'lucide-react';
import { cn } from '@retail/ui';

interface StatsCardsProps {
  data: {
    totalSalesToday: number;
    totalSalesCents: number;
    transactionsCount: number;
    averageTicketCents: number;
    growthPercentage: number;
  };
}

export function StatsCards({ data }: StatsCardsProps) {
  const isPositiveGrowth = data.growthPercentage >= 0;

  const stats = [
    {
      title: 'Ventas Hoy',
      value: formatCurrencyARS(data.totalSalesCents),
      icon: DollarSign,
      change: data.growthPercentage,
      changeLabel: 'vs. ayer',
    },
    {
      title: 'Transacciones',
      value: data.transactionsCount.toString(),
      icon: ShoppingCart,
      change: null,
      changeLabel: '',
    },
    {
      title: 'Ticket Promedio',
      value: formatCurrencyARS(data.averageTicketCents),
      icon: Users,
      change: null,
      changeLabel: '',
    },
    {
      title: 'Productos Activos',
      value: data.totalSalesToday.toString(),
      icon: Package,
      change: null,
      changeLabel: '',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.change !== null && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                {isPositiveGrowth ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span
                  className={cn(
                    'font-medium',
                    isPositiveGrowth ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {isPositiveGrowth ? '+' : ''}
                  {stat.change.toFixed(1)}%
                </span>
                <span>{stat.changeLabel}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
