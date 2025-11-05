'use client';

import { useMemo } from 'react';
import { Promotion, PROMOTION_TYPE_LABELS, DISCOUNT_TYPE_LABELS } from '@/lib/api/promotions';
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@retail/ui';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { TrendingUp, AlertTriangle, Gift, Calendar } from 'lucide-react';

interface Props {
  promotions: Promotion[];
}

const COLORS = {
  active: '#10b981',
  inactive: '#ef4444',
  types: ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'],
};

export function PromotionsAnalytics({ promotions }: Props) {
  const analytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const total = promotions.length;
    const active = promotions.filter((p) => p.isActive).length;
    const expired = promotions.filter((p) => new Date(p.endDate) < now).length;
    const expiringSoon = promotions.filter(
      (p) =>
        p.isActive &&
        new Date(p.endDate) > now &&
        new Date(p.endDate) <= thirtyDaysFromNow
    ).length;

    // Active vs Inactive
    const statusData = [
      { name: 'Activas', value: active, color: COLORS.active },
      { name: 'Inactivas', value: total - active, color: COLORS.inactive },
    ];

    // By Type
    const byType = promotions.reduce((acc, p) => {
      const type = PROMOTION_TYPE_LABELS[p.type];
      if (!acc[type]) {
        acc[type] = { type, count: 0, uses: 0 };
      }
      acc[type].count++;
      acc[type].uses += p.currentUses;
      return acc;
    }, {} as Record<string, { type: string; count: number; uses: number }>);
    const typeData = Object.values(byType);

    // By Discount Type
    const byDiscountType = promotions.reduce((acc, p) => {
      const type = DISCOUNT_TYPE_LABELS[p.discountType];
      if (!acc[type]) {
        acc[type] = { type, count: 0 };
      }
      acc[type].count++;
      return acc;
    }, {} as Record<string, { type: string; count: number }>);
    const discountTypeData = Object.values(byDiscountType);

    // Top 10 by Usage
    const topByUsage = promotions
      .sort((a, b) => b.currentUses - a.currentUses)
      .slice(0, 10)
      .map((p) => ({
        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
        uses: p.currentUses,
      }));

    // Insights
    const insights = [];

    if (expiringSoon > 0) {
      insights.push({
        type: 'warning',
        message: `${expiringSoon} ${
          expiringSoon === 1 ? 'promoción expira' : 'promociones expiran'
        } en los próximos 30 días`,
      });
    }

    if (expired > 5) {
      insights.push({
        type: 'info',
        message: `Tienes ${expired} promociones expiradas que podrías archivar o eliminar`,
      });
    }

    if (active < 3) {
      insights.push({
        type: 'warning',
        message: `Solo tienes ${active} ${
          active === 1 ? 'promoción activa' : 'promociones activas'
        }. Considera crear más promociones`,
      });
    }

    const successfulPromotions = promotions.filter((p) => p.currentUses > 50).length;
    if (successfulPromotions > 0) {
      insights.push({
        type: 'success',
        message: `¡Excelente! ${successfulPromotions} ${
          successfulPromotions === 1 ? 'promoción tiene' : 'promociones tienen'
        } más de 50 usos`,
      });
    }

    return {
      total,
      active,
      expired,
      expiringSoon,
      statusData,
      typeData,
      discountTypeData,
      topByUsage,
      insights,
    };
  }, [promotions]);

  if (promotions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay datos</h3>
          <p className="text-gray-600">Crea promociones para ver analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{analytics.total}</p>
              </div>
              <Gift className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Activas</p>
                <p className="text-2xl font-bold">{analytics.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Por Expirar</p>
                <p className="text-2xl font-bold">{analytics.expiringSoon}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expiradas</p>
                <p className="text-2xl font-bold">{analytics.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active vs Inactive Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Promociones</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Type Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Por Tipo de Promoción</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Cantidad" />
                <Bar dataKey="uses" fill="#10b981" name="Usos" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Discount Type Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Por Tipo de Descuento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.discountTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8b5cf6" name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 by Usage */}
        {analytics.topByUsage.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Más Usadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.topByUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="uses" fill="#f59e0b" name="Usos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Insights */}
      {analytics.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Insights y Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg flex items-start gap-3 ${
                    insight.type === 'success'
                      ? 'bg-green-50 text-green-800'
                      : insight.type === 'warning'
                      ? 'bg-orange-50 text-orange-800'
                      : 'bg-blue-50 text-blue-800'
                  }`}
                >
                  {insight.type === 'success' ? (
                    <TrendingUp className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : insight.type === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Gift className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm">{insight.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
