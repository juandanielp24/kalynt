'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@retail/ui';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

export function SalesTrends() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  const { data: trendsData, isLoading } = useQuery({
    queryKey: ['sales-trends', period],
    queryFn: () => analyticsApi.getTrends(period),
  });

  const trends = trendsData?.data || [];

  if (isLoading) {
    return <div className="text-center py-12">Cargando tendencias...</div>;
  }

  // Calculate growth rates
  const trendsWithGrowth = trends.map((trend: any, index: number) => {
    if (index === 0) return { ...trend, growth: 0 };
    const prevRevenue = trends[index - 1].revenue;
    const growth = prevRevenue > 0 ? ((trend.revenue - prevRevenue) / prevRevenue) * 100 : 0;
    return { ...trend, growth };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Análisis de Tendencias
          </h2>
          <p className="text-gray-600">
            Evolución histórica de ventas e ingresos
          </p>
        </div>

        <Select
          value={period}
          onValueChange={(value: any) => setPeriod(value)}
        >
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Por Semana</SelectItem>
            <SelectItem value="month">Por Mes</SelectItem>
            <SelectItem value="year">Por Año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Períodos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trends.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ventas Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trends.reduce((sum: number, t: any) => sum + t.salesCount, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {trends
                .reduce((sum: number, t: any) => sum + t.revenue, 0)
                .toLocaleString('es-AR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ganancia Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              $
              {trends
                .reduce((sum: number, t: any) => sum + t.profit, 0)
                .toLocaleString('es-AR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue and Profit Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución de Ingresos y Ganancia</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="revenue"
                fill="#3b82f6"
                name="Ingresos"
                radius={[8, 8, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="profit"
                stroke="#10b981"
                strokeWidth={2}
                name="Ganancia"
                dot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sales Count Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Cantidad de Ventas por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
              />
              <Legend />
              <Bar
                dataKey="salesCount"
                fill="#8b5cf6"
                name="Cantidad de Ventas"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Average Ticket Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Evolución del Ticket Promedio</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="averageTicket"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Ticket Promedio"
                dot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Growth Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Tasa de Crecimiento (% vs período anterior)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendsWithGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
              />
              <Legend />
              <Bar
                dataKey="growth"
                fill="#10b981"
                name="Crecimiento %"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tabla Detallada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Período</th>
                  <th className="text-right py-3 px-4">Ventas</th>
                  <th className="text-right py-3 px-4">Ingresos</th>
                  <th className="text-right py-3 px-4">Costos</th>
                  <th className="text-right py-3 px-4">Ganancia</th>
                  <th className="text-right py-3 px-4">Margen %</th>
                  <th className="text-right py-3 px-4">Ticket Prom.</th>
                  <th className="text-right py-3 px-4">Crecimiento</th>
                </tr>
              </thead>
              <tbody>
                {trendsWithGrowth.map((trend: any, index: number) => {
                  const margin = trend.revenue > 0 ? (trend.profit / trend.revenue) * 100 : 0;
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{trend.period}</td>
                      <td className="text-right py-3 px-4">{trend.salesCount}</td>
                      <td className="text-right py-3 px-4">
                        ${trend.revenue.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4">
                        ${trend.cost.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4 text-green-600 font-medium">
                        ${trend.profit.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4">{margin.toFixed(1)}%</td>
                      <td className="text-right py-3 px-4">
                        ${trend.averageTicket.toFixed(2)}
                      </td>
                      <td
                        className={`text-right py-3 px-4 font-medium ${
                          trend.growth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {index === 0 ? '-' : `${trend.growth >= 0 ? '+' : ''}${trend.growth.toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
