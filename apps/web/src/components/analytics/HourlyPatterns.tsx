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
  Badge,
} from '@retail/ui';
import {
  Clock,
  Sun,
  Moon,
  TrendingUp,
  Calendar,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = {
  morning: '#f59e0b',
  afternoon: '#3b82f6',
  evening: '#8b5cf6',
  night: '#1e293b',
};

export function HourlyPatterns() {
  const [days, setDays] = useState<7 | 14 | 30 | 60 | 90>(30);

  const { data: patternsData, isLoading } = useQuery({
    queryKey: ['hourly-patterns', days],
    queryFn: () => analyticsApi.getHourlyPatterns(days),
  });

  const data = patternsData?.data;

  if (isLoading) {
    return <div className="text-center py-12">Cargando patrones horarios...</div>;
  }

  if (!data) return null;

  // Determine peak and quiet hours
  const peakHour = data.hourlyData.reduce((max: any, curr: any) =>
    curr.revenue > max.revenue ? curr : max
  );

  const quietHour = data.hourlyData.reduce((min: any, curr: any) =>
    curr.revenue < min.revenue ? curr : min
  );

  // Day parts data
  const dayPartsData = [
    {
      name: 'Mañana (6-12)',
      revenue: data.dayParts.morning.revenue,
      sales: data.dayParts.morning.salesCount,
      avgTicket: data.dayParts.morning.averageTicket,
      color: COLORS.morning,
    },
    {
      name: 'Tarde (12-18)',
      revenue: data.dayParts.afternoon.revenue,
      sales: data.dayParts.afternoon.salesCount,
      avgTicket: data.dayParts.afternoon.averageTicket,
      color: COLORS.afternoon,
    },
    {
      name: 'Noche (18-24)',
      revenue: data.dayParts.evening.revenue,
      sales: data.dayParts.evening.salesCount,
      avgTicket: data.dayParts.evening.averageTicket,
      color: COLORS.evening,
    },
    {
      name: 'Madrugada (0-6)',
      revenue: data.dayParts.night.revenue,
      sales: data.dayParts.night.salesCount,
      avgTicket: data.dayParts.night.averageTicket,
      color: COLORS.night,
    },
  ];

  // Recommendations
  const recommendations = [];

  if (peakHour.hour >= 12 && peakHour.hour <= 14) {
    recommendations.push({
      title: 'Optimizar hora pico de almuerzo',
      description:
        'Tu hora pico es durante el almuerzo. Considera aumentar personal y stock durante este período.',
      type: 'success',
    });
  }

  if (quietHour.hour >= 6 && quietHour.hour <= 22) {
    recommendations.push({
      title: 'Activar horas tranquilas',
      description: `Las ${quietHour.hour}:00 son muy tranquilas. Considera promociones para aumentar el tráfico.`,
      type: 'warning',
    });
  }

  if (data.dayParts.evening.revenue > data.dayParts.morning.revenue * 1.5) {
    recommendations.push({
      title: 'Negocio nocturno fuerte',
      description:
        'Tu negocio es más fuerte por la noche. Asegura disponibilidad de productos populares nocturnos.',
      type: 'info',
    });
  }

  if (data.dayParts.night.revenue > 0) {
    recommendations.push({
      title: 'Ventas madrugada activas',
      description: 'Tienes ventas en madrugada. Evalúa si justifica mantener operaciones 24/7.',
      type: 'info',
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" />
            Patrones Horarios de Ventas
          </h2>
          <p className="text-gray-600">Análisis de comportamiento por hora del día</p>
        </div>

        <Select value={days.toString()} onValueChange={(value) => setDays(Number(value) as any)}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 días</SelectItem>
            <SelectItem value="14">Últimos 14 días</SelectItem>
            <SelectItem value="30">Últimos 30 días</SelectItem>
            <SelectItem value="60">Últimos 60 días</SelectItem>
            <SelectItem value="90">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Hora Pico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{peakHour.hour}:00</div>
            <p className="text-sm text-gray-600 mt-1">
              ${peakHour.revenue.toFixed(2)} en ingresos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Moon className="h-4 w-4" />
              Hora Tranquila
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quietHour.hour}:00</div>
            <p className="text-sm text-gray-600 mt-1">
              ${quietHour.revenue.toFixed(2)} en ingresos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Ingresos Promedio/Hora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {(
                data.hourlyData.reduce((sum: number, h: any) => sum + h.revenue, 0) /
                data.hourlyData.length
              ).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Ventas Promedio/Hora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                data.hourlyData.reduce((sum: number, h: any) => sum + h.salesCount, 0) /
                data.hourlyData.length
              ).toFixed(1)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ingresos por Hora del Día</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={data.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickFormatter={(hour) => `${hour}:00`}
                label={{ value: 'Hora del día', position: 'bottom' }}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `$${value.toFixed(2)}`}
                labelFormatter={(hour) => `Hora: ${hour}:00`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="Ingresos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sales Count Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cantidad de Ventas por Hora</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickFormatter={(hour) => `${hour}:00`}
                label={{ value: 'Hora del día', position: 'bottom' }}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(hour) => `Hora: ${hour}:00`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
              />
              <Legend />
              <Bar dataKey="salesCount" fill="#10b981" name="Cantidad de Ventas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Average Ticket Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Promedio por Hora</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="hour"
                tickFormatter={(hour) => `${hour}:00`}
                label={{ value: 'Hora del día', position: 'bottom' }}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `$${value.toFixed(2)}`}
                labelFormatter={(hour) => `Hora: ${hour}:00`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="averageTicket"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Ticket Promedio"
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Day Parts Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Comparación por Franjas Horarias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {dayPartsData.map((part, index) => (
              <Card key={index} className="border-l-4" style={{ borderLeftColor: part.color }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {index === 0 && <Sun className="h-4 w-4" />}
                    {index === 1 && <TrendingUp className="h-4 w-4" />}
                    {index === 2 && <Clock className="h-4 w-4" />}
                    {index === 3 && <Moon className="h-4 w-4" />}
                    {part.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-600">Ingresos</div>
                      <div className="text-lg font-bold">${part.revenue.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Ventas</div>
                      <div className="text-md font-medium">{part.sales}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Ticket Prom.</div>
                      <div className="text-md font-medium">${part.avgTicket.toFixed(2)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dayPartsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `$${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
              />
              <Legend />
              <Bar dataKey="revenue" name="Ingresos">
                {dayPartsData.map((entry, index) => (
                  <rect key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tabla Detallada por Hora</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Hora</th>
                  <th className="text-right py-3 px-4">Ventas</th>
                  <th className="text-right py-3 px-4">Ingresos</th>
                  <th className="text-right py-3 px-4">Ticket Prom.</th>
                  <th className="text-right py-3 px-4">% del Total</th>
                  <th className="text-center py-3 px-4">Intensidad</th>
                </tr>
              </thead>
              <tbody>
                {data.hourlyData.map((hour: any, index: number) => {
                  const totalRevenue = data.hourlyData.reduce(
                    (sum: number, h: any) => sum + h.revenue,
                    0
                  );
                  const percentage = (hour.revenue / totalRevenue) * 100;

                  let intensity: 'high' | 'medium' | 'low' = 'low';
                  if (percentage > 8) intensity = 'high';
                  else if (percentage > 4) intensity = 'medium';

                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{hour.hour}:00</td>
                      <td className="text-right py-3 px-4">{hour.salesCount}</td>
                      <td className="text-right py-3 px-4">${hour.revenue.toFixed(2)}</td>
                      <td className="text-right py-3 px-4">
                        ${hour.averageTicket.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4">{percentage.toFixed(1)}%</td>
                      <td className="text-center py-3 px-4">
                        <Badge
                          variant={
                            intensity === 'high'
                              ? 'default'
                              : intensity === 'medium'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {intensity === 'high'
                            ? 'Alta'
                            : intensity === 'medium'
                            ? 'Media'
                            : 'Baja'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>💡 Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    rec.type === 'success'
                      ? 'bg-green-50 border-green-500'
                      : rec.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-500'
                      : 'bg-blue-50 border-blue-500'
                  }`}
                >
                  <h4 className="font-semibold mb-1">{rec.title}</h4>
                  <p className="text-sm text-gray-700">{rec.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
