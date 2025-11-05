'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '@/lib/api/locations';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  Label,
  Input,
  useToast,
} from '@retail/ui';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  Clock,
  AlertCircle,
  ArrowRightLeft,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { useParams } from 'next/navigation';

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

export default function TransferDetailPage() {
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const transferId = params.id as string;

  const [rejectReason, setRejectReason] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingMethod, setShippingMethod] = useState('');

  const { data: transferData, isLoading } = useQuery({
    queryKey: ['transfer', transferId],
    queryFn: () => locationsApi.getTransfer(transferId),
  });

  const approveMutation = useMutation({
    mutationFn: () => locationsApi.approveTransfer(transferId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer', transferId] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: 'Transferencia aprobada',
        description: 'La transferencia ha sido aprobada correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo aprobar la transferencia',
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => locationsApi.rejectTransfer(transferId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer', transferId] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: 'Transferencia rechazada',
        description: 'La transferencia ha sido rechazada',
      });
      setRejectReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo rechazar la transferencia',
        variant: 'destructive',
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      locationsApi.sendTransfer(transferId, {
        trackingNumber: trackingNumber || undefined,
        shippingMethod: shippingMethod || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer', transferId] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: 'Transferencia enviada',
        description: 'La transferencia ha sido marcada como enviada',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo enviar la transferencia',
        variant: 'destructive',
      });
    },
  });

  const receiveMutation = useMutation({
    mutationFn: () => locationsApi.receiveTransfer(transferId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer', transferId] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: 'Transferencia recibida',
        description: 'La transferencia ha sido recibida correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo recibir la transferencia',
        variant: 'destructive',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => locationsApi.cancelTransfer(transferId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer', transferId] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: 'Transferencia cancelada',
        description: 'La transferencia ha sido cancelada',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo cancelar la transferencia',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Cargando transferencia...</div>
      </div>
    );
  }

  const transfer = transferData?.data;
  if (!transfer) {
    return <div>Transferencia no encontrada</div>;
  }

  const StatusIcon = STATUS_CONFIG[transfer.status as keyof typeof STATUS_CONFIG]?.icon;
  const statusConfig = STATUS_CONFIG[transfer.status as keyof typeof STATUS_CONFIG];

  return (
    <ProtectedRoute>
      <PermissionGuard resource="STOCK_MOVEMENTS" action="READ">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/inventory/transfers">
                <Button variant="outline" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">{transfer.transferNumber}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={statusConfig?.color}>
                    {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                    {statusConfig?.label}
                  </Badge>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-600">
                    Creada{' '}
                    {formatDistanceToNow(new Date(transfer.requestedAt), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {transfer.status === 'PENDING' && (
                <PermissionGuard resource="STOCK_MOVEMENTS" action="UPDATE">
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (
                          confirm(
                            '¿Estás seguro de rechazar esta transferencia?'
                          )
                        ) {
                          const reason = prompt('Motivo del rechazo:');
                          if (reason) {
                            rejectMutation.mutate(reason);
                          }
                        }
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Rechazar
                    </Button>
                    <Button onClick={() => approveMutation.mutate()}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Aprobar
                    </Button>
                  </>
                </PermissionGuard>
              )}

              {transfer.status === 'APPROVED' && (
                <PermissionGuard resource="STOCK_MOVEMENTS" action="UPDATE">
                  <Button onClick={() => sendMutation.mutate()}>
                    <Truck className="h-4 w-4 mr-2" />
                    Marcar como Enviada
                  </Button>
                </PermissionGuard>
              )}

              {transfer.status === 'IN_TRANSIT' && (
                <PermissionGuard resource="STOCK_MOVEMENTS" action="UPDATE">
                  <Button onClick={() => receiveMutation.mutate()}>
                    <Package className="h-4 w-4 mr-2" />
                    Confirmar Recepción
                  </Button>
                </PermissionGuard>
              )}

              {['PENDING', 'APPROVED'].includes(transfer.status) && (
                <PermissionGuard resource="STOCK_MOVEMENTS" action="UPDATE">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (
                        confirm('¿Estás seguro de cancelar esta transferencia?')
                      ) {
                        const reason = prompt('Motivo de cancelación:');
                        if (reason) {
                          cancelMutation.mutate(reason);
                        }
                      }
                    }}
                  >
                    Cancelar Transferencia
                  </Button>
                </PermissionGuard>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Locations */}
              <Card>
                <CardHeader>
                  <CardTitle>Ubicaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm text-gray-600">Origen</div>
                      <div className="font-semibold text-lg">
                        {transfer.fromLocation.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {transfer.fromLocation.code}
                      </div>
                    </div>

                    <ArrowRightLeft className="h-8 w-8 text-gray-400" />

                    <div className="flex-1 text-right">
                      <div className="text-sm text-gray-600">Destino</div>
                      <div className="font-semibold text-lg">
                        {transfer.toLocation.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {transfer.toLocation.code}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Productos ({transfer.items.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Solicitado</TableHead>
                        {transfer.status !== 'PENDING' && (
                          <TableHead className="text-right">Enviado</TableHead>
                        )}
                        {transfer.status === 'RECEIVED' && (
                          <TableHead className="text-right">Recibido</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transfer.items.map((item: any) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {item.product.imageUrl && (
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              )}
                              <span className="font-medium">
                                {item.product.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{item.product.sku}</TableCell>
                          <TableCell className="text-right">
                            {item.quantityRequested}
                          </TableCell>
                          {transfer.status !== 'PENDING' && (
                            <TableCell className="text-right">
                              {item.quantitySent || item.quantityRequested}
                            </TableCell>
                          )}
                          {transfer.status === 'RECEIVED' && (
                            <TableCell className="text-right">
                              {item.quantityReceived || item.quantitySent || item.quantityRequested}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Tracking Info (for approved status) */}
              {transfer.status === 'APPROVED' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Información de Envío</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="trackingNumber">Número de Seguimiento</Label>
                      <Input
                        id="trackingNumber"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingMethod">Método de Envío</Label>
                      <Input
                        id="shippingMethod"
                        value={shippingMethod}
                        onChange={(e) => setShippingMethod(e.target.value)}
                        placeholder="Opcional"
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Show tracking if available */}
              {transfer.trackingNumber && (
                <Card>
                  <CardHeader>
                    <CardTitle>Seguimiento</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-600">Número de Seguimiento:</span>{' '}
                        <span className="font-medium">{transfer.trackingNumber}</span>
                      </div>
                      {transfer.shippingMethod && (
                        <div>
                          <span className="text-gray-600">Método de Envío:</span>{' '}
                          <span className="font-medium">{transfer.shippingMethod}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Historial</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Requested */}
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="w-px h-full bg-gray-200 mt-2" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="font-medium">Solicitada</div>
                        <div className="text-sm text-gray-600">
                          {transfer.requestedBy.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(transfer.requestedAt), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>
                    </div>

                    {/* Approved */}
                    {transfer.approvedAt && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          {(transfer.sentAt || transfer.receivedAt) && (
                            <div className="w-px h-full bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="font-medium">Aprobada</div>
                          <div className="text-sm text-gray-600">
                            {transfer.approvedBy?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(transfer.approvedAt), 'dd/MM/yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sent */}
                    {transfer.sentAt && (
                      <div className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <Truck className="h-4 w-4 text-purple-600" />
                          </div>
                          {transfer.receivedAt && (
                            <div className="w-px h-full bg-gray-200 mt-2" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="font-medium">Enviada</div>
                          <div className="text-sm text-gray-600">
                            {transfer.sentBy?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(transfer.sentAt), 'dd/MM/yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Received */}
                    {transfer.receivedAt && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Package className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Recibida</div>
                          <div className="text-sm text-gray-600">
                            {transfer.receivedBy?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(transfer.receivedAt), 'dd/MM/yyyy HH:mm')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rejected */}
                    {transfer.rejectedAt && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Rechazada</div>
                          <div className="text-sm text-gray-600">
                            {transfer.rejectedBy?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(transfer.rejectedAt), 'dd/MM/yyyy HH:mm')}
                          </div>
                          {transfer.rejectionReason && (
                            <div className="text-sm text-red-600 mt-1">
                              {transfer.rejectionReason}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Cancelled */}
                    {transfer.cancelledAt && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <XCircle className="h-4 w-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Cancelada</div>
                          <div className="text-xs text-gray-500">
                            {format(new Date(transfer.cancelledAt), 'dd/MM/yyyy HH:mm')}
                          </div>
                          {transfer.cancellationReason && (
                            <div className="text-sm text-gray-600 mt-1">
                              {transfer.cancellationReason}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Additional Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Información Adicional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {transfer.estimatedArrival && (
                    <div>
                      <div className="text-sm text-gray-600">Fecha Estimada</div>
                      <div className="font-medium">
                        {format(new Date(transfer.estimatedArrival), 'dd/MM/yyyy')}
                      </div>
                    </div>
                  )}

                  {transfer.notes && (
                    <div>
                      <div className="text-sm text-gray-600">Notas</div>
                      <div className="text-sm">{transfer.notes}</div>
                    </div>
                  )}

                  {transfer.internalNotes && (
                    <div>
                      <div className="text-sm text-gray-600">Notas Internas</div>
                      <div className="text-sm">{transfer.internalNotes}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PermissionGuard>
    </ProtectedRoute>
  );
}
