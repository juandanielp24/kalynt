'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@retail/ui';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { MapPin } from 'lucide-react';
import { subDays } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function LocationAnalyticsPage() {
  const [dateRange, setDateRange] = useState('30');

  const startDate = subDays(new Date(), parseInt(dateRange));
  const endDate = new Date();

  // Sales comparison
  const { data: salesData } = useQuery({
    queryKey: ['location-sales-comparison', dateRange],
    queryFn: async () => {
      const response = await apiClient.get('/location-analytics/sales-comparison', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      });
      return response.data;
    },
  });

  // Stock distribution
  const { data: stockData } = useQuery({
    queryKey: ['location-stock-distribution'],
    queryFn: async () => {
      const response = await apiClient.get('/location-analytics/stock-distribution');
      return response.data;
    },
  });

  const salesComparison = salesData?.data || [];
  const stockDistribution = stockData?.data || [];

  // Calculate totals
  const totalSales = salesComparison.reduce(
    (sum: number, loc: any) => sum + loc.totalSales,
    0
  );
  const totalSalesCount = salesComparison.reduce(
    (sum: number, loc: any) => sum + loc.salesCount,
    0
  );

  return (
    <ProtectedRoute>
      <PermissionGuard resource="ANALYTICS" action="READ">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Análisis por Sucursales</h1>
              <p className="text-gray-600 mt-1">
                Compara el rendimiento entre todas tus ubicaciones
              </p>
            </div>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 días</SelectItem>
                <SelectItem value="30">Últimos 30 días</SelectItem>
                <SelectItem value="90">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Ventas Totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalSales.toLocaleString()}
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {totalSalesCount} transacciones
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Sucursales Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesComparison.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Top Performer
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesComparison[0] && (
                  <div>
                    <div className="font-bold">{salesComparison[0].location?.name}</div>
                    <p className="text-xs text-gray-600 mt-1">
                      ${salesComparison[0].totalSales.toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Ticket Promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${totalSalesCount > 0 ? (totalSales / totalSalesCount).toFixed(2) : '0.00'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <Tabs defaultValue="sales" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sales">Ventas por Sucursal</TabsTrigger>
              <TabsTrigger value="stock">Distribución de Stock</TabsTrigger>
              <TabsTrigger value="comparison">Comparación Detallada</TabsTrigger>
            </TabsList>

            {/* Sales Chart */}
            <TabsContent value="sales" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Sucursal</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={salesComparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="location.name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <Tooltip
                        formatter={(value: any) => `$${value.toLocaleString()}`}
                      />
                      <Legend />
                      <Bar dataKey="totalSales" name="Ventas Totales" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Cantidad de Ventas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salesComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="location.name"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="salesCount" name="# Ventas" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ticket Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salesComparison}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="location.name"
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value: any) => `$${value.toFixed(2)}`}
                        />
                        <Bar dataKey="averageSale" name="Promedio" fill="#f59e0b" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Stock Distribution */}
            <TabsContent value="stock" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribución de Stock (Unidades)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={stockDistribution}
                          dataKey="quantity"
                          nameKey="location.name"
                          cx="50%"
                          cy="50%"
                          outerRadius={120}
                          label={(entry) => `${entry.percentage.toFixed(1)}%`}
                        >
                          {stockDistribution.map((_: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Stock por Sucursal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stockDistribution.map((item: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor: COLORS[index % COLORS.length],
                                }}
                              />
                              <span className="font-medium">
                                {item.location?.name}
                              </span>
                            </div>
                            <span className="font-bold">
                              {item.quantity.toLocaleString()} unidades
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>{item.productsCount} productos</span>
                            <span>{item.percentage.toFixed(1)}% del total</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Detailed Comparison */}
            <TabsContent value="comparison">
              <Card>
                <CardHeader>
                  <CardTitle>Comparación Detallada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salesComparison.map((location: any, index: number) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <MapPin className="h-5 w-5 text-primary" />
                            <div>
                              <h3 className="font-semibold text-lg">
                                {location.location?.name}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {location.location?.code}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              ${location.totalSales.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">
                              en ventas totales
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mt-4">
                          <div>
                            <div className="text-sm text-gray-600">
                              Cantidad de Ventas
                            </div>
                            <div className="text-xl font-bold">
                              {location.salesCount}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              Ticket Promedio
                            </div>
                            <div className="text-xl font-bold">
                              ${location.averageSale.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              % del Total
                            </div>
                            <div className="text-xl font-bold">
                              {totalSales > 0
                                ? ((location.totalSales / totalSales) * 100).toFixed(1)
                                : '0.0'}
                              %
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PermissionGuard>
    </ProtectedRoute>
  );
}
