'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { deliveryApi } from '@/lib/api/delivery';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@retail/ui';
import {
  Truck,
  MapPin,
  Users,
  Settings,
  BarChart3,
  Package,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { DeliveriesList } from '@/components/delivery/DeliveriesList';
import { DeliveryZones } from '@/components/delivery/DeliveryZones';
import { DriversManagement } from '@/components/delivery/DriversManagement';
import { DeliverySettings } from '@/components/delivery/DeliverySettings';
import { DeliveryAnalytics } from '@/components/delivery/DeliveryAnalytics';

export default function DeliveryPage() {
  const [activeTab, setActiveTab] = useState('deliveries');

  const { data: statsData } = useQuery({
    queryKey: ['delivery-stats'],
    queryFn: () => deliveryApi.getStatistics(7),
  });

  const stats = statsData?.data;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Truck className="h-8 w-8 text-blue-600" />
            Sistema de Delivery
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona entregas, repartidores y zonas de cobertura
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Total Entregas (7d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totals?.total || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Entregados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.byStatus?.find((s: any) => s.status === 'DELIVERED')?.count || 0}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {stats.totals?.total > 0
                  ? ((stats.byStatus?.find((s: any) => s.status === 'DELIVERED')?.count || 0) / stats.totals.total * 100).toFixed(1)
                  : 0}% tasa de éxito
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                En Proceso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {(stats.byStatus?.filter((s: any) =>
                  ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'].includes(s.status)
                ).reduce((sum: number, s: any) => sum + s.count, 0)) || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Ingresos (7d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(stats.totals?.totalRevenue || 0).toLocaleString('es-AR')}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Prom: ${(stats.totals?.averageCost || 0).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="deliveries" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Entregas
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Repartidores
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Zonas
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="deliveries" className="mt-6">
          <DeliveriesList />
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          <DriversManagement />
        </TabsContent>

        <TabsContent value="zones" className="mt-6">
          <DeliveryZones />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <DeliveryAnalytics />
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <DeliverySettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
