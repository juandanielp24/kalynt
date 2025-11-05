'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
} from '@retail/ui';
import {
  Users,
  Star,
  Heart,
  TrendingUp,
  UserPlus,
  AlertTriangle,
  XCircle,
  Moon,
  Download,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const SEGMENT_CONFIG = {
  champions: {
    icon: Star,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    chartColor: '#eab308',
  },
  loyal: {
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    chartColor: '#ec4899',
  },
  potentialLoyalist: {
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    chartColor: '#3b82f6',
  },
  newCustomers: {
    icon: UserPlus,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    chartColor: '#10b981',
  },
  atRisk: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    chartColor: '#f59e0b',
  },
  cantLose: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    chartColor: '#ef4444',
  },
  hibernating: {
    icon: Moon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    chartColor: '#6b7280',
  },
};

interface Props {
  onExport: () => void;
}

export function CustomerSegments({ onExport }: Props) {
  const { data: segmentData, isLoading } = useQuery({
    queryKey: ['customer-segmentation'],
    queryFn: () => analyticsApi.getCustomerSegmentation(),
  });

  if (isLoading) {
    return <div className="text-center py-12">Cargando segmentación...</div>;
  }

  const data = segmentData?.data;
  if (!data) return null;

  const chartData = Object.entries(data.segments).map(([key, segment]: [string, any]) => ({
    name: key,
    value: segment.count,
    color: SEGMENT_CONFIG[key as keyof typeof SEGMENT_CONFIG]?.chartColor || '#000',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Segmentación de Clientes (RFM)
          </h2>
          <p className="text-gray-600">
            Análisis de Recencia, Frecuencia y Monetario
          </p>
        </div>

        <Button onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalCustomers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Clientes Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.summary.activeCustomers}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {data.summary.totalCustomers > 0
                ? ((data.summary.activeCustomers / data.summary.totalCustomers) * 100).toFixed(1)
                : 0}
              % del total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">
              En Riesgo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {data.summary.atRiskCustomers}
            </div>
            <p className="text-xs text-gray-600 mt-1">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Inactivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {data.summary.inactiveCustomers}
            </div>
            <p className="text-xs text-gray-600 mt-1">Más de 6 meses</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribución de Segmentos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={130}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(data.segments).map(([segmentKey, segment]: [string, any]) => {
          const config = SEGMENT_CONFIG[segmentKey as keyof typeof SEGMENT_CONFIG];
          const Icon = config?.icon || Users;

          return (
            <Card
              key={segmentKey}
              className={`border-l-4 ${config?.borderColor}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${config?.bgColor}`}>
                      <Icon className={`h-5 w-5 ${config?.color}`} />
                    </div>
                    <div>
                      <div className="capitalize">
                        {segmentKey.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-sm font-normal text-gray-600 mt-1">
                        {segment.description}
                      </div>
                    </div>
                  </CardTitle>
                  <Badge variant="secondary" className="text-lg">
                    {segment.count}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {segment.customers.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700 mb-2">
                      Top Clientes:
                    </div>
                    {segment.customers.slice(0, 5).map((customer: any) => (
                      <div
                        key={customer.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-xs text-gray-600">
                            Última compra: {customer.lastPurchase}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">
                            ${customer.monetary.toFixed(0)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {customer.frequency} compras
                          </div>
                        </div>
                      </div>
                    ))}
                    {segment.count > 5 && (
                      <div className="text-xs text-gray-600 text-center pt-2">
                        +{segment.count - 5} clientes más
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center text-gray-600 py-4">
                    No hay clientes en este segmento
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>=¡ Recomendaciones por Segmento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">
                Champions & Loyal
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>" Programa VIP con beneficios exclusivos</li>
                <li>" Early access a nuevos productos</li>
                <li>" Descuentos especiales y promociones</li>
              </ul>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                Potential Loyalist & New Customers
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>" Programa de onboarding personalizado</li>
                <li>" Cupones de segunda compra</li>
                <li>" Comunicación frecuente con valor</li>
              </ul>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2">
                At Risk & Can't Lose
              </h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>" Campaña de reactivación urgente</li>
                <li>" Ofertas personalizadas agresivas</li>
                <li>" Contacto directo para feedback</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Hibernating</h4>
              <ul className="text-sm text-gray-800 space-y-1">
                <li>" Campaña win-back con incentivo fuerte</li>
                <li>" Encuesta para entender motivos</li>
                <li>" Considerar costo de reactivación</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
