'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface HourlyDistributionChartProps {
  dateRange: { from: Date; to: Date };
}

export function HourlyDistributionChart({ dateRange }: HourlyDistributionChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['hourly-distribution', dateRange],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/hourly-distribution', {
        params: {
          startDate: dateRange.from.toISOString(),
          endDate: dateRange.to.toISOString(),
        },
      });
      return response.data.data;
    },
  });

  if (isLoading) {
    return <div className="h-[300px] flex items-center justify-center">Cargando...</div>;
  }

  const chartData = data?.map((item: any) => ({
    hour: `${String(item.hour).padStart(2, '0')}:00`,
    revenue: item.revenue / 100,
    salesCount: item.salesCount,
  })) || [];

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-gray-500">
        No hay datos para mostrar
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: any, name: string) => {
            if (name === 'revenue') {
              return [`$${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 'Ingresos'];
            }
            return [value, 'Ventas'];
          }}
        />
        <Bar dataKey="revenue" fill="#6200ee" name="Ingresos" />
        <Bar dataKey="salesCount" fill="#03dac6" name="Cantidad de Ventas" />
      </BarChart>
    </ResponsiveContainer>
  );
}
