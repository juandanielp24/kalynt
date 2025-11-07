'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { locationsApi, TransferStatus } from '@/lib/api/locations';
import { useLocation } from '@/contexts/LocationContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@retail/ui';
import {
  Plus,
  ArrowRightLeft,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CreateTransferDialog } from '@/components/transfers/CreateTransferDialog';
import Link from 'next/link';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pendiente',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
  },
  APPROVED: {
    label: 'Aprobada',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle,
  },
  IN_TRANSIT: {
    label: 'En Tránsito',
    color: 'bg-purple-100 text-purple-800',
    icon: Truck,
  },
  RECEIVED: {
    label: 'Recibida',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  CANCELLED: {
    label: 'Cancelada',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle,
  },
  REJECTED: {
    label: 'Rechazada',
    color: 'bg-red-100 text-red-800',
    icon: AlertCircle,
  },
};

export default function TransfersPage() {
  const { currentLocation, locations } = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');

  const { data: transfersData, isLoading } = useQuery({
    queryKey: ['transfers', statusFilter, locationFilter],
    queryFn: () =>
      locationsApi.getTransfers({
        status: statusFilter !== 'all' ? (statusFilter as TransferStatus) : undefined,
        fromLocationId: locationFilter === 'from' ? currentLocation?.id : undefined,
        toLocationId: locationFilter === 'to' ? currentLocation?.id : undefined,
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ['transfer-stats', currentLocation?.id],
    queryFn: () => locationsApi.getTransferStatistics({ locationId: currentLocation?.id }),
  });

  const transfers = transfersData?.data?.transfers || [];
  const stats = statsData?.data || {};

  return (
    <ProtectedRoute>
      <PermissionGuard resource="STOCK_MOVEMENTS" action="READ">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Transferencias de Stock</h1>
              <p className="text-gray-600 mt-1">
                Gestiona el movimiento de productos entre sucursales
              </p>
            </div>

            <PermissionGuard resource="STOCK_MOVEMENTS" action="CREATE">
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Transferencia
              </Button>
            </PermissionGuard>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-600">
                  Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pending || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">
                  Aprobadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.approved || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-600">
                  En Tránsito
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.inTransit || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">
                  Recibidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.received || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Canceladas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.cancelled || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="PENDING">Pendientes</SelectItem>
                      <SelectItem value="APPROVED">Aprobadas</SelectItem>
                      <SelectItem value="IN_TRANSIT">En Tránsito</SelectItem>
                      <SelectItem value="RECEIVED">Recibidas</SelectItem>
                      <SelectItem value="CANCELLED">Canceladas</SelectItem>
                      <SelectItem value="REJECTED">Rechazadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las transferencias</SelectItem>
                      <SelectItem value="from">Saliendo de aquí</SelectItem>
                      <SelectItem value="to">Llegando aquí</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transfers List */}
          {isLoading ? (
            <div className="text-center py-12">Cargando transferencias...</div>
          ) : transfers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <ArrowRightLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay transferencias</h3>
                <p className="text-gray-600 mb-4">
                  Crea tu primera transferencia entre sucursales
                </p>
                <PermissionGuard resource="STOCK_MOVEMENTS" action="CREATE">
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Transferencia
                  </Button>
                </PermissionGuard>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {transfers.map((transfer: any) => {
                const StatusIcon = STATUS_CONFIG[transfer.status as keyof typeof STATUS_CONFIG]?.icon;
                const statusConfig = STATUS_CONFIG[transfer.status as keyof typeof STATUS_CONFIG];

                return (
                  <Card key={transfer.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {transfer.transferNumber}
                            </h3>
                            <Badge className={statusConfig?.color}>
                              {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                              {statusConfig?.label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                            <span className="font-medium">{transfer.fromLocation.name}</span>
                            <ArrowRightLeft className="h-4 w-4" />
                            <span className="font-medium">{transfer.toLocation.name}</span>
                          </div>

                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <div>
                              <span className="text-gray-500">Solicitado por:</span>{' '}
                              {transfer.requestedBy.name}
                            </div>
                            <div>
                              <span className="text-gray-500">Hace:</span>{' '}
                              {formatDistanceToNow(new Date(transfer.requestedAt), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </div>
                            <div>
                              <span className="text-gray-500">Items:</span>{' '}
                              {transfer.items?.length || 0}
                            </div>
                          </div>

                          {transfer.notes && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="text-gray-500">Notas:</span> {transfer.notes}
                            </div>
                          )}
                        </div>

                        <Link href={`/inventory/transfers/${transfer.id}`}>
                          <Button variant="outline">Ver Detalles</Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Create Transfer Dialog */}
          <CreateTransferDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>
      </PermissionGuard>
    </ProtectedRoute>
  );
}
