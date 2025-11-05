'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi, DeliveryStatus, DELIVERY_STATUS_LABELS } from '@/lib/api/delivery';
import {
  Button,
  Card,
  CardContent,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  useToast,
} from '@retail/ui';
import {
  Package,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  UserCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  PENDING: { color: 'bg-gray-100 text-gray-800', icon: Clock },
  ASSIGNED: { color: 'bg-blue-100 text-blue-800', icon: UserCheck },
  PICKED_UP: { color: 'bg-indigo-100 text-indigo-800', icon: Package },
  IN_TRANSIT: { color: 'bg-purple-100 text-purple-800', icon: Truck },
  ARRIVED: { color: 'bg-yellow-100 text-yellow-800', icon: MapPin },
  DELIVERED: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  FAILED: { color: 'bg-red-100 text-red-800', icon: XCircle },
  CANCELLED: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
  RETURNED: { color: 'bg-orange-100 text-orange-800', icon: Truck },
};

export function DeliveriesList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [assignDriverDialog, setAssignDriverDialog] = useState<any>(null);

  const { data: deliveriesData, isLoading } = useQuery({
    queryKey: ['deliveries', statusFilter],
    queryFn: () =>
      deliveryApi.getDeliveries({
        status: statusFilter !== 'all' ? (statusFilter as DeliveryStatus) : undefined,
      }),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const { data: driversData } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: () => deliveryApi.getAvailableDrivers(),
  });

  const assignDriverMutation = useMutation({
    mutationFn: ({ deliveryId, driverId }: { deliveryId: string; driverId: string }) =>
      deliveryApi.assignDriver(deliveryId, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast({
        title: 'Repartidor asignado',
        description: 'El delivery fue asignado correctamente',
      });
      setAssignDriverDialog(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo asignar el repartidor',
        variant: 'destructive',
      });
    },
  });

  const autoAssignMutation = useMutation({
    mutationFn: deliveryApi.autoAssignDelivery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast({
        title: 'Asignación automática',
        description: 'El delivery fue asignado automáticamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo asignar automáticamente',
        variant: 'destructive',
      });
    },
  });

  const deliveries = deliveriesData?.data?.deliveries || [];
  const availableDrivers = driversData?.data || [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDING">Pendientes</SelectItem>
                <SelectItem value="ASSIGNED">Asignados</SelectItem>
                <SelectItem value="PICKED_UP">Recogidos</SelectItem>
                <SelectItem value="IN_TRANSIT">En camino</SelectItem>
                <SelectItem value="DELIVERED">Entregados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Deliveries List */}
      {isLoading ? (
        <div className="text-center py-12">Cargando entregas...</div>
      ) : deliveries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay entregas</h3>
            <p className="text-gray-600">No se encontraron entregas con los filtros aplicados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {deliveries.map((delivery: any) => {
            const statusConfig = STATUS_CONFIG[delivery.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = statusConfig?.icon;

            return (
              <Card key={delivery.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${statusConfig?.color}`}>
                          {StatusIcon && <StatusIcon className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-semibold text-lg">
                            {delivery.deliveryNumber}
                          </div>
                          <Badge className={statusConfig?.color}>
                            {DELIVERY_STATUS_LABELS[delivery.status as DeliveryStatus]}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600 mb-1 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Cliente
                          </div>
                          <div className="font-medium">{delivery.contactName}</div>
                          <div className="text-gray-600">{delivery.contactPhone}</div>
                        </div>

                        <div>
                          <div className="text-gray-600 mb-1 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Dirección
                          </div>
                          <div className="font-medium">{delivery.address}</div>
                          <div className="text-gray-600">
                            {delivery.city}, {delivery.state}
                          </div>
                        </div>

                        <div>
                          <div className="text-gray-600 mb-1 flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Repartidor
                          </div>
                          {delivery.driver ? (
                            <>
                              <div className="font-medium">
                                {delivery.driver.firstName} {delivery.driver.lastName}
                              </div>
                              <div className="text-gray-600">{delivery.driver.phone}</div>
                            </>
                          ) : (
                            <div className="text-gray-500 italic">Sin asignar</div>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(delivery.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </div>
                        {delivery.estimatedArrival && (
                          <div className="flex items-center gap-1">
                            Estimado:{' '}
                            {format(new Date(delivery.estimatedArrival), 'HH:mm', { locale: es })}
                          </div>
                        )}
                        <div className="font-medium text-blue-600">
                          ${delivery.deliveryCost.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDelivery(delivery)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalles
                      </Button>

                      {delivery.status === 'PENDING' && !delivery.driverId && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAssignDriverDialog(delivery)}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Asignar
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => autoAssignMutation.mutate(delivery.id)}
                            disabled={autoAssignMutation.isPending}
                          >
                            Auto-Asignar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delivery Details Dialog */}
      <Dialog open={!!selectedDelivery} onOpenChange={() => setSelectedDelivery(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Delivery</DialogTitle>
          </DialogHeader>

          {selectedDelivery && (
            <div className="space-y-6">
              {/* Status Timeline */}
              <div>
                <h3 className="font-semibold mb-3">Historial de Estados</h3>
                <div className="space-y-2">
                  {selectedDelivery.statusHistory?.map((history: any, index: number) => (
                    <div key={history.id} className="flex items-start gap-3">
                      <div
                        className={`w-3 h-3 rounded-full mt-1 ${
                          index === 0 ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      />
                      <div className="flex-1">
                        <div className="font-medium">
                          {DELIVERY_STATUS_LABELS[history.toStatus as DeliveryStatus]}
                        </div>
                        <div className="text-sm text-gray-600">
                          {format(new Date(history.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </div>
                        {history.notes && (
                          <div className="text-sm text-gray-700 mt-1">{history.notes}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sale Details */}
              {selectedDelivery.sale && (
                <div>
                  <h3 className="font-semibold mb-3">Detalle del Pedido</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">N° Venta:</span>
                      <span className="font-medium">{selectedDelivery.sale.saleNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium">
                        ${((selectedDelivery.sale.totalCents || 0) / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span className="font-medium">{selectedDelivery.sale.items?.length || 0}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedDelivery.deliveryNotes && (
                <div>
                  <h3 className="font-semibold mb-2">Notas de Entrega</h3>
                  <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                    <p className="text-sm">{selectedDelivery.deliveryNotes}</p>
                  </div>
                </div>
              )}

              {/* Rating */}
              {selectedDelivery.rating && (
                <div>
                  <h3 className="font-semibold mb-2">Calificación</h3>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl">{'⭐'.repeat(selectedDelivery.rating)}</div>
                    <span className="text-gray-600">({selectedDelivery.rating}/5)</span>
                  </div>
                  {selectedDelivery.feedback && (
                    <p className="text-sm text-gray-700 mt-2">{selectedDelivery.feedback}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog
        open={!!assignDriverDialog}
        onOpenChange={() => setAssignDriverDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Repartidor</DialogTitle>
          </DialogHeader>

          {assignDriverDialog && (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Delivery: <strong>{assignDriverDialog.deliveryNumber}</strong>
              </div>

              {availableDrivers.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  No hay repartidores disponibles en este momento
                </div>
              ) : (
                <div className="space-y-2">
                  {availableDrivers.map((driver: any) => (
                    <Button
                      key={driver.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() =>
                        assignDriverMutation.mutate({
                          deliveryId: assignDriverDialog.id,
                          driverId: driver.id,
                        })
                      }
                      disabled={assignDriverMutation.isPending}
                    >
                      <User className="h-4 w-4 mr-2" />
                      <div className="text-left flex-1">
                        <div className="font-medium">
                          {driver.firstName} {driver.lastName}
                        </div>
                        <div className="text-xs text-gray-600">
                          {driver.phone} • {driver.vehicleType}
                        </div>
                      </div>
                      {driver.rating && (
                        <div className="text-sm">⭐ {driver.rating.toFixed(1)}</div>
                      )}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
