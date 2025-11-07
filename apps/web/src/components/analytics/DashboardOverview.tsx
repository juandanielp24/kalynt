'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@retail/ui';
import {
  AreaChart,
  Area,
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
import { DashboardData } from '@/lib/api/analytics';
import { TrendingUp, TrendingDown, Package, MapPin, CreditCard } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface Props {
  data: DashboardData;
  period: string;
}

export function DashboardOverview({ data, period }: Props) {
  // Prepare data for charts
  const revenueData = data.revenueByDay.map((day) => ({
    date: new Date(day.date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    Ingresos: day.revenue,
    Ganancia: day.profit,
    Ventas: day.sales,
  }));

  const categoryData = data.topCategories.map((cat) => ({
    name: cat.categoryName,
    value: cat.revenue,
    sales: cat.salesCount,
  }));

  const paymentMethodData = data.salesByPaymentMethod.map((pm) => ({
    name: pm.method,
    value: pm.revenue,
    count: pm.count,
    percentage: pm.percentage,
  }));

  return (
    <div className="space-y-6">
      {/* Revenue Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Evolución de Ingresos y Ganancia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Ingresos"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="Ganancia"
                stackId="2"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Top 10 Productos por Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart
                data={data.topProducts.slice(0, 10)}
                layout="vertical"
                margin={{ left: 100 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#3b82f6" name="Ingresos" />
                <Bar dataKey="profit" fill="#10b981" name="Ganancia" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Categories Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value.toFixed(0)}`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {categoryData.map((cat, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">{cat.sales} ventas</span>
                    <span className="font-medium">${cat.value.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Location */}
        {data.salesByLocation.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600" />
                Ventas por Ubicación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.salesByLocation.map((location, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{location.locationName}</span>
                      <span className="text-sm text-gray-600">
                        {location.salesCount} ventas
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (location.revenue /
                                  Math.max(
                                    ...data.salesByLocation.map((l) => l.revenue)
                                  )) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="ml-4 font-medium">
                        ${location.revenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Ticket promedio: ${location.averageTicket.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-blue-600" />
              Métodos de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {paymentMethodData.map((method, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{method.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600">{method.count} transacciones</span>
                    <span className="font-medium">${method.value.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Comparativa de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-600 mb-1">Período Actual</div>
                <div className="text-2xl font-bold">
                  {data.sales.current.totalSales}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Período Anterior</div>
                <div className="text-lg text-gray-700">
                  {data.sales.previous.totalSales}
                </div>
              </div>
              <div
                className={`flex items-center gap-2 text-sm ${
                  data.sales.growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {data.sales.growth >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {data.sales.growth >= 0 ? '+' : ''}
                  {data.sales.growth.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Comparativa de Ingresos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-600 mb-1">Período Actual</div>
                <div className="text-2xl font-bold">
                  ${data.sales.current.totalRevenue.toLocaleString('es-AR')}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Período Anterior</div>
                <div className="text-lg text-gray-700">
                  ${data.sales.previous.totalRevenue.toLocaleString('es-AR')}
                </div>
              </div>
              <div
                className={`flex items-center gap-2 text-sm ${
                  data.sales.growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {data.sales.growth >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {data.sales.growth >= 0 ? '+' : ''}
                  {data.sales.growth.toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Comparativa de Margen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-gray-600 mb-1">Período Actual</div>
                <div className="text-2xl font-bold">
                  {data.sales.current.profitMargin.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Período Anterior</div>
                <div className="text-lg text-gray-700">
                  {data.sales.previous.profitMargin.toFixed(1)}%
                </div>
              </div>
              <div
                className={`flex items-center gap-2 text-sm ${
                  data.sales.current.profitMargin >= data.sales.previous.profitMargin
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {data.sales.current.profitMargin >= data.sales.previous.profitMargin ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="font-medium">
                  {data.sales.current.profitMargin >= data.sales.previous.profitMargin
                    ? '+'
                    : ''}
                  {(
                    data.sales.current.profitMargin - data.sales.previous.profitMargin
                  ).toFixed(1)}
                  pp
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
