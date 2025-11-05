'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { deliveryApi } from '@/lib/api/delivery';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { TrendingUp, Package, CheckCircle, XCircle, Clock } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export function DeliveryAnalytics() {
  const [period, setPeriod] = useState('30');

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['delivery-stats', period],
    queryFn: () => deliveryApi.getStatistics(parseInt(period)),
  });

  const stats = statsData?.data;

  if (isLoading) {
    return <div className="text-center py-12">Cargando analytics...</div>;
  }

  if (!stats) {
    return null;
  }

  const statusData = [
    { name: 'Completados', value: stats.completed, color: COLORS[0] },
    { name: 'En Proceso', value: stats.inProgress, color: COLORS[1] },
    { name: 'Pendientes', value: stats.pending, color: COLORS[2] },
    { name: 'Fallidos', value: stats.failed, color: COLORS[3] },
    { name: 'Cancelados', value: stats.cancelled, color: COLORS[4] },
  ];

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics de Delivery</h2>
          <p className="text-gray-600">Análisis detallado de entregas</p>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="60">Últimos 60 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Total Deliveries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-600 mt-1">
              En los últimos {period} días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Tasa de Éxito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.completionRate.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {stats.completed} de {stats.total} completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Calificación Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              ⭐ {stats.avgRating.toFixed(1)}
            </div>
            <p className="text-xs text-gray-600 mt-1">De 5.0 estrellas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${stats.totalRevenue.toLocaleString('es-AR')}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Promedio: ${stats.avgDeliveryCost.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 space-y-2">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tasa de Completado</span>
                  <span className="font-medium">{stats.completionRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Deliveries Exitosos</span>
                  <span className="font-medium">
                    {stats.completed} / {stats.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Tasa de Fallos</span>
                  <span className="font-medium">
                    {stats.total > 0 ? ((stats.failed / stats.total) * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{
                      width: `${stats.total > 0 ? (stats.failed / stats.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600 mb-2">Ingresos por Delivery</div>
                <div className="text-2xl font-bold">
                  ${stats.avgDeliveryCost.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600 mt-1">Costo promedio</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Insights y Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.completionRate >= 95 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Excelente tasa de éxito</h4>
                  <p className="text-sm text-green-700">
                    Tu tasa de completado es superior al 95%. ¡Mantén el gran trabajo!
                  </p>
                </div>
              </div>
            )}

            {stats.completionRate < 80 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <XCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900">Tasa de éxito mejorable</h4>
                  <p className="text-sm text-yellow-700">
                    Considera revisar los procesos de asignación y seguimiento de entregas.
                  </p>
                </div>
              </div>
            )}

            {stats.pending > stats.completed && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Muchos deliveries pendientes</h4>
                  <p className="text-sm text-blue-700">
                    Tienes {stats.pending} deliveries pendientes. Considera contratar más
                    repartidores o habilitar la asignación automática.
                  </p>
                </div>
              </div>
            )}

            {stats.failed > stats.total * 0.1 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Alta tasa de fallos</h4>
                  <p className="text-sm text-red-700">
                    Más del 10% de tus deliveries fallan. Revisa las direcciones y contacta a
                    los clientes antes de enviar.
                  </p>
                </div>
              </div>
            )}

            {stats.avgRating < 4.0 && stats.avgRating > 0 && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900">
                    Calificación por debajo del promedio
                  </h4>
                  <p className="text-sm text-orange-700">
                    Trabaja en mejorar la experiencia de entrega. Considera capacitar a los
                    repartidores en atención al cliente.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
