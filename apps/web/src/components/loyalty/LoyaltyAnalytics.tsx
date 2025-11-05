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
} from 'recharts';

interface Props {
  programId: string;
  stats: any;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function LoyaltyAnalytics({ programId, stats }: Props) {
  if (!stats) {
    return <div className="text-center py-12">No hay datos disponibles</div>;
  }

  // Members by tier
  const tierData = stats.membersByTier?.map((item: any, index: number) => ({
    name: item.tierId || 'Sin nivel',
    value: item._count,
    color: COLORS[index % COLORS.length],
  })) || [];

  // Points distribution
  const pointsData = [
    { name: 'Puntos Ganados', value: stats.pointsEarned || 0 },
    { name: 'Puntos Canjeados', value: stats.pointsSpent || 0 },
    { name: 'Puntos Activos', value: stats.currentPoints || 0 },
  ];

  // Engagement metrics
  const engagementRate =
    stats.totalMembers > 0
      ? ((stats.activeMembers / stats.totalMembers) * 100).toFixed(1)
      : '0';

  const redemptionRate =
    stats.pointsEarned > 0
      ? ((stats.pointsSpent / stats.pointsEarned) * 100).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Tasa de Participación</div>
            <div className="text-3xl font-bold text-blue-600">{engagementRate}%</div>
            <div className="text-xs text-gray-600 mt-1">
              {stats.activeMembers} de {stats.totalMembers} activos
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Tasa de Canje</div>
            <div className="text-3xl font-bold text-purple-600">
              {redemptionRate}%
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Puntos canjeados vs ganados
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Promedio por Miembro</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.totalMembers > 0
                ? Math.round(stats.currentPoints / stats.totalMembers)
                : 0}
            </div>
            <div className="text-xs text-gray-600 mt-1">Puntos activos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600 mb-1">Valor Total Puntos</div>
            <div className="text-3xl font-bold text-orange-600">
              ${stats.pointsLiability?.toFixed(0) || 0}
            </div>
            <div className="text-xs text-gray-600 mt-1">Pasivo de puntos</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Members by Tier */}
        {tierData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Nivel</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={tierData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {tierData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Points Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Puntos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={pointsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>💡 Insights del Programa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {parseFloat(engagementRate) < 50 && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">
                  📉 Baja participación
                </h4>
                <p className="text-sm text-orange-800">
                  Solo el {engagementRate}% de los miembros están activos. Considera
                  campañas de re-engagement o incentivos especiales.
                </p>
              </div>
            )}

            {parseFloat(redemptionRate) < 30 && stats.pointsEarned > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  🎁 Pocos canjes
                </h4>
                <p className="text-sm text-blue-800">
                  La tasa de canje es baja ({redemptionRate}%). Asegúrate de que las
                  recompensas sean atractivas y fáciles de canjear.
                </p>
              </div>
            )}

            {stats.pointsLiability > 10000 && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">
                  💰 Alto pasivo de puntos
                </h4>
                <p className="text-sm text-purple-800">
                  El valor de puntos activos es de ${stats.pointsLiability.toFixed(0)}.
                  Monitorea el pasivo y considera promociones para incentivar canjes.
                </p>
              </div>
            )}

            {parseFloat(engagementRate) > 70 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">
                  ⭐ Excelente participación
                </h4>
                <p className="text-sm text-green-800">
                  El {engagementRate}% de participación es excelente. ¡El programa está
                  funcionando muy bien!
                </p>
              </div>
            )}

            {stats.totalMembers === 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  🚀 Comenzando
                </h4>
                <p className="text-sm text-blue-800">
                  Tu programa está recién creado. Promociona el programa entre tus
                  clientes para comenzar a ver resultados.
                </p>
              </div>
            )}

            {stats.totalRedemptions > 100 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">
                  🎉 Gran actividad
                </h4>
                <p className="text-sm text-green-800">
                  Has tenido {stats.totalRedemptions} canjes. ¡Tu programa de fidelidad
                  está generando gran engagement!
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
