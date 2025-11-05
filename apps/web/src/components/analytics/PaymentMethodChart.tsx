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
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface PaymentMethodChartProps {
  dateRange: { from: Date; to: Date };
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  debit_card: 'Débito',
  credit_card: 'Crédito',
  mercado_pago: 'Mercado Pago',
  bank_transfer: 'Transferencia',
};

export function PaymentMethodChart({ dateRange }: PaymentMethodChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['sales-by-payment-method', dateRange],
    queryFn: async () => {
      const response = await apiClient.get('/analytics/sales-by-payment-method', {
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
    method: PAYMENT_METHOD_LABELS[item.paymentMethod] || item.paymentMethod,
    revenue: item.revenue / 100,
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
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="method" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: any, name: string) => {
            if (name === 'revenue') {
              return [`$${value.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 'Ingresos'];
            }
            return [value, 'Ventas'];
          }}
        />
        <Legend />
        <Bar dataKey="revenue" fill="#6200ee" name="Ingresos" />
        <Bar dataKey="count" fill="#03dac6" name="Cantidad" />
      </BarChart>
    </ResponsiveContainer>
  );
}
