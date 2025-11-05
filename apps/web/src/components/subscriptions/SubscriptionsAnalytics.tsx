'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@retail/ui';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

interface Props {
  stats: any;
  billingStats: any;
}

export function SubscriptionsAnalytics({ stats, billingStats }: Props) {
  if (!stats || !billingStats) {
    return <div className="text-center py-12">No hay datos disponibles</div>;
  }

  // Status distribution
  const statusData = stats.byStatus?.map((item: any, index: number) => ({
    name: item.status,
    value: item._count,
    color: COLORS[index % COLORS.length],
  })) || [];

  // MRR and Churn
  const metricsData = [
    { name: 'MRR', value: stats.monthlyRecurringRevenue || 0 },
    { name: 'Churn Rate', value: stats.churnRate || 0 },
  ];

  // Billing stats
  const billingData = [
    { name: 'Total', value: billingStats.totalInvoices },
    { name: 'Pagadas', value: billingStats.paidInvoices },
    { name: 'Fallidas', value: billingStats.failedInvoices },
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Total Suscripciones</div>
            <div className="text-3xl font-bold">{stats.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">MRR</div>
            <div className="text-3xl font-bold text-green-600">
              ${stats.monthlyRecurringRevenue?.toFixed(0) || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Churn Rate</div>
            <div className="text-3xl font-bold text-red-600">
              {stats.churnRate?.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Tasa de Cobro</div>
            <div className="text-3xl font-bold text-blue-600">
              {billingStats.collectionRate?.toFixed(1) || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        {statusData.length > 0 && (
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
                    {statusData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Billing Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Estadísticas de Facturación</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={billingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>💰 Desglose de Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-800 mb-1">Total Facturado</div>
              <div className="text-2xl font-bold text-green-600">
                ${billingStats.totalRevenue?.toFixed(2) || 0}
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-800 mb-1">Pendiente de Cobro</div>
              <div className="text-2xl font-bold text-orange-600">
                ${billingStats.pendingAmount?.toFixed(2) || 0}
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800 mb-1">Facturas Pagadas</div>
              <div className="text-2xl font-bold text-blue-600">
                {billingStats.paidInvoices || 0}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.churnRate > 5 && (
              <div className="p-4 bg-red-50 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-2">
                  ⚠️ Alta tasa de cancelación
                </h4>
                <p className="text-sm text-red-800">
                  La tasa de churn del {stats.churnRate.toFixed(1)}% está por encima del
                  objetivo. Considera implementar estrategias de retención.
                </p>
              </div>
            )}

            {billingStats.collectionRate < 90 && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">
                  💳 Mejorar tasa de cobro
                </h4>
                <p className="text-sm text-orange-800">
                  Tasa de cobro del {billingStats.collectionRate.toFixed(1)}%. Revisa los
                  métodos de pago y envía recordatorios.
                </p>
              </div>
            )}

            {stats.monthlyRecurringRevenue > 10000 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">
                  🎉 Excelente MRR
                </h4>
                <p className="text-sm text-green-800">
                  El ingreso recurrente mensual de $
                  {stats.monthlyRecurringRevenue.toFixed(0)} es muy saludable.
                </p>
              </div>
            )}

            {stats.churnRate < 3 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  ⭐ Baja cancelación
                </h4>
                <p className="text-sm text-blue-800">
                  Churn rate del {stats.churnRate.toFixed(1)}% es excelente. ¡Los clientes
                  están satisfechos!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
