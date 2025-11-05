'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

interface CategoryChartProps {
  dateRange: { from: Date; to: Date };
}

const COLORS = [
  '#6200ee',
  '#03dac6',
  '#ff6f00',
  '#e91e63',
  '#2196f3',
  '#4caf50',
  '#ff9800',
  '#9c27b0',
];

export function CategoryChart({ dateRange }: CategoryChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['sales-by-category', dateRange],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/sales-by-category', {
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
    name: item.categoryName,
    value: item.revenue / 100,
    count: item.salesCount,
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
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any) => `$${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
