'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface RevenueChartProps {
  data: Array<{
    date: string;
    revenue: number;
    salesCount: number;
  }>;
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formattedData = data.map((item) => ({
    date: format(parseISO(item.date), 'dd MMM', { locale: es }),
    revenue: item.revenue / 100,
    salesCount: item.salesCount,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => `$${value.toLocaleString('es-AR')}`}
        />
        <Tooltip
          formatter={(value: any, name: string) => {
            if (name === 'revenue') {
              return [`$${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 'Ingresos'];
            }
            return [value, 'Ventas'];
          }}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#6200ee"
          strokeWidth={2}
          name="Ingresos"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="salesCount"
          stroke="#03dac6"
          strokeWidth={2}
          name="Cantidad de Ventas"
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
