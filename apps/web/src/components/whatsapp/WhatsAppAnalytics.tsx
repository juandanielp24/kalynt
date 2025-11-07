'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { whatsappApi } from '@/lib/api/whatsapp';
import { Card, CardContent, CardHeader, CardTitle } from '@retail/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@retail/ui';
import {
  BarChart3,
  TrendingUp,
  Send,
  CheckCheck,
  Eye,
  XCircle,
  MessageSquare,
  Loader2,
} from 'lucide-react';
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
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b'];

export function WhatsAppAnalytics() {
  const [period, setPeriod] = useState('30');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['whatsapp', 'messages', 'stats', period],
    queryFn: () => whatsappApi.getMessageStats(parseInt(period)),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const statusData = [
    { name: 'Enviados', value: stats.totalSent || 0, color: COLORS[1] },
    { name: 'Entregados', value: stats.totalDelivered || 0, color: COLORS[0] },
    { name: 'Leídos', value: stats.totalRead || 0, color: COLORS[3] },
    { name: 'Fallidos', value: stats.totalFailed || 0, color: COLORS[2] },
  ];

  const deliveryRate = stats.totalSent > 0
    ? ((stats.totalDelivered / stats.totalSent) * 100).toFixed(1)
    : '0.0';

  const readRate = stats.totalDelivered > 0
    ? ((stats.totalRead / stats.totalDelivered) * 100).toFixed(1)
    : '0.0';

  const failureRate = stats.totalSent > 0
    ? ((stats.totalFailed / stats.totalSent) * 100).toFixed(1)
    : '0.0';

  const rateData = [
    {
      name: 'Tasas',
      entrega: parseFloat(deliveryRate),
      lectura: parseFloat(readRate),
      fallo: parseFloat(failureRate),
    },
  ];

  const totalMessages = stats.totalSent || 0;

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics de WhatsApp</h2>
          <p className="text-muted-foreground">Estadísticas de mensajes enviados</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              Total Mensajes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalMessages}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              En los últimos {period} días
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <CheckCheck className="h-4 w-4" />
              Tasa de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {deliveryRate}%
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.totalDelivered} entregados de {totalMessages}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400">
              <Eye className="h-4 w-4" />
              Tasa de Lectura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {readRate}%
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.totalRead} leídos de {stats.totalDelivered}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              Tasa de Fallo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {failureRate}%
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {stats.totalFailed} fallidos de {totalMessages}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                      className="h-3 w-3 rounded-full"
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

        {/* Rates Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Tasas de Rendimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="entrega" name="Tasa de Entrega %" fill="#10b981" />
                <Bar dataKey="lectura" name="Tasa de Lectura %" fill="#3b82f6" />
                <Bar dataKey="fallo" name="Tasa de Fallo %" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Insights de Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {parseFloat(deliveryRate) >= 95 && (
              <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3 dark:bg-green-950">
                <TrendingUp className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-100">
                    Excelente tasa de entrega
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Tu tasa de entrega es superior al 95%. ¡Sigue así!
                  </p>
                </div>
              </div>
            )}

            {parseFloat(deliveryRate) < 85 && totalMessages > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-950">
                <XCircle className="mt-0.5 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                    Tasa de entrega baja
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Verifica que los números de teléfono estén correctos y que WhatsApp esté
                    conectado.
                  </p>
                </div>
              </div>
            )}

            {parseFloat(readRate) >= 70 && stats.totalDelivered > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
                <Eye className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Alta tasa de lectura
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Más del 70% de tus mensajes son leídos. Tus clientes están muy
                    comprometidos.
                  </p>
                </div>
              </div>
            )}

            {parseFloat(failureRate) > 10 && totalMessages > 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3 dark:bg-red-950">
                <XCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
                <div>
                  <h4 className="font-medium text-red-900 dark:text-red-100">
                    Alta tasa de fallos
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Más del 10% de tus mensajes fallan. Revisa los números de teléfono y la
                    conexión de WhatsApp.
                  </p>
                </div>
              </div>
            )}

            {totalMessages === 0 && (
              <div className="flex items-start gap-3 rounded-lg bg-muted p-3">
                <MessageSquare className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">Sin mensajes</h4>
                  <p className="text-sm text-muted-foreground">
                    No hay mensajes enviados en este período. Comienza a enviar mensajes para
                    ver estadísticas.
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
