'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@retail/ui';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatCurrencyARS } from '@retail/shared';

interface TopProductsChartProps {
  data: Array<{
    id: string;
    name: string;
    quantitySold: number;
    revenueCents: number;
  }>;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function TopProductsChart({ data }: TopProductsChartProps) {
  // Tomar top 5
  const topProducts = data.slice(0, 5);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-3 shadow-sm">
          <p className="font-medium">{data.name}</p>
          <div className="mt-2 space-y-1 text-sm">
            <p>Cantidad vendida: {data.quantitySold}</p>
            <p>Ingresos: {formatCurrencyARS(data.revenueCents)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Productos Más Vendidos</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={topProducts} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" stroke="#888888" fontSize={12} />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              width={150}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="quantitySold" radius={[0, 8, 8, 0]}>
              {topProducts.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
