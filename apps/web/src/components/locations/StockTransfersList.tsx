'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  AlertCircle,
  MoreVertical,
  Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Input,
  Label,
  Textarea,
  useToast,
} from '@retail/ui';
import {
  locationsApi,
  StockTransfer,
  TransferStatus,
  TRANSFER_STATUS_LABELS,
} from '@/lib/api/locations';

export function StockTransfersList() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTransfer, setSelectedTransfer] = useState<StockTransfer | null>(
    null
  );
  const [actionDialog, setActionDialog] = useState<{
    type: 'approve' | 'reject' | 'ship' | 'receive' | 'cancel' | null;
    open: boolean;
  }>({ type: null, open: false });
  const [actionData, setActionData] = useState<any>({});

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch transfers
  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers', statusFilter],
    queryFn: () =>
      locationsApi.getTransfers({
        status:
          statusFilter !== 'all' ? (statusFilter as TransferStatus) : undefined,
      }),
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => locationsApi.approveTransfer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: 'Transferencia aprobada',
        description: 'La transferencia ha sido aprobada correctamente.',
      });
      closeActionDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al aprobar la transferencia',
        variant: 'destructive',
      });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      locationsApi.rejectTransfer(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: 'Transferencia rechazada',
        description: 'La transferencia ha sido rechazada.',
      });
      closeActionDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al rechazar la transferencia',
        variant: 'destructive',
      });
    },
  });

  // Ship mutation
  const shipMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      locationsApi.shipTransfer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: 'Transferencia enviada',
        description: 'La transferencia ha sido marcada como enviada.',
      });
      closeActionDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al enviar la transferencia',
        variant: 'destructive',
      });
    },
  });

  // Receive mutation
  const receiveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      locationsApi.receiveTransfer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: 'Transferencia recibida',
        description: 'La transferencia ha sido marcada como recibida.',
      });
      closeActionDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al recibir la transferencia',
        variant: 'destructive',
      });
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      locationsApi.cancelTransfer(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: 'Transferencia cancelada',
        description: 'La transferencia ha sido cancelada.',
      });
      closeActionDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'Error al cancelar la transferencia',
        variant: 'destructive',
      });
    },
  });

  const getStatusIcon = (status: TransferStatus) => {
    switch (status) {
      case TransferStatus.PENDING:
        return <Clock className="h-4 w-4" />;
      case TransferStatus.APPROVED:
        return <CheckCircle className="h-4 w-4" />;
      case TransferStatus.IN_TRANSIT:
        return <Truck className="h-4 w-4" />;
      case TransferStatus.RECEIVED:
        return <Package className="h-4 w-4" />;
      case TransferStatus.CANCELLED:
      case TransferStatus.REJECTED:
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: TransferStatus) => {
    switch (status) {
      case TransferStatus.PENDING:
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case TransferStatus.APPROVED:
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case TransferStatus.IN_TRANSIT:
        return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';
      case TransferStatus.RECEIVED:
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case TransferStatus.CANCELLED:
      case TransferStatus.REJECTED:
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  const openActionDialog = (
    transfer: StockTransfer,
    type: 'approve' | 'reject' | 'ship' | 'receive' | 'cancel'
  ) => {
    setSelectedTransfer(transfer);
    setActionDialog({ type, open: true });
    setActionData({});
  };

  const closeActionDialog = () => {
    setActionDialog({ type: null, open: false });
    setSelectedTransfer(null);
    setActionData({});
  };

  const handleAction = () => {
    if (!selectedTransfer) return;

    switch (actionDialog.type) {
      case 'approve':
        approveMutation.mutate(selectedTransfer.id);
        break;
      case 'reject':
        if (!actionData.reason) {
          toast({
            title: 'Campo requerido',
            description: 'Debes proporcionar un motivo de rechazo.',
            variant: 'destructive',
          });
          return;
        }
        rejectMutation.mutate({ id: selectedTransfer.id, reason: actionData.reason });
        break;
      case 'ship':
        shipMutation.mutate({ id: selectedTransfer.id, data: actionData });
        break;
      case 'receive':
        receiveMutation.mutate({ id: selectedTransfer.id, data: actionData });
        break;
      case 'cancel':
        if (!actionData.reason) {
          toast({
            title: 'Campo requerido',
            description: 'Debes proporcionar un motivo de cancelación.',
            variant: 'destructive',
          });
          return;
        }
        cancelMutation.mutate({
          id: selectedTransfer.id,
          reason: actionData.reason,
        });
        break;
    }
  };

  const canApprove = (transfer: StockTransfer) =>
    transfer.status === TransferStatus.PENDING;
  const canReject = (transfer: StockTransfer) =>
    transfer.status === TransferStatus.PENDING;
  const canShip = (transfer: StockTransfer) =>
    transfer.status === TransferStatus.APPROVED;
  const canReceive = (transfer: StockTransfer) =>
    transfer.status === TransferStatus.IN_TRANSIT;
  const canCancel = (transfer: StockTransfer) =>
    [TransferStatus.PENDING, TransferStatus.APPROVED].includes(transfer.status);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Label>Estado:</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.values(TransferStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {TRANSFER_STATUS_LABELS[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Transfers List */}
      {transfers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay transferencias</h3>
            <p className="text-sm text-muted-foreground text-center">
              {statusFilter !== 'all'
                ? 'No se encontraron transferencias con este estado.'
                : 'No hay transferencias de stock registradas.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transfers.map((transfer: StockTransfer) => (
            <Card key={transfer.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {transfer.transferNumber}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{transfer.fromLocation?.name}</span>
                      <ArrowRight className="h-4 w-4" />
                      <span>{transfer.toLocation?.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(transfer.status)}>
                      <span className="mr-1">{getStatusIcon(transfer.status)}</span>
                      {TRANSFER_STATUS_LABELS[transfer.status]}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {canApprove(transfer) && (
                          <DropdownMenuItem
                            onClick={() => openActionDialog(transfer, 'approve')}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Aprobar
                          </DropdownMenuItem>
                        )}
                        {canReject(transfer) && (
                          <DropdownMenuItem
                            onClick={() => openActionDialog(transfer, 'reject')}
                            className="text-red-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Rechazar
                          </DropdownMenuItem>
                        )}
                        {canShip(transfer) && (
                          <DropdownMenuItem
                            onClick={() => openActionDialog(transfer, 'ship')}
                          >
                            <Truck className="mr-2 h-4 w-4" />
                            Enviar
                          </DropdownMenuItem>
                        )}
                        {canReceive(transfer) && (
                          <DropdownMenuItem
                            onClick={() => openActionDialog(transfer, 'receive')}
                          >
                            <Package className="mr-2 h-4 w-4" />
                            Recibir
                          </DropdownMenuItem>
                        )}
                        {canCancel(transfer) && (
                          <DropdownMenuItem
                            onClick={() => openActionDialog(transfer, 'cancel')}
                            className="text-red-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancelar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items Summary */}
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {transfer._count?.items || transfer.items?.length || 0} productos
                  </span>
                </div>

                {/* Timeline */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Solicitado:</span>
                    <span>
                      {format(new Date(transfer.requestedAt), 'dd/MM/yyyy HH:mm', {
                        locale: es,
                      })}
                    </span>
                  </div>
                  {transfer.approvedAt && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">Aprobado:</span>
                      <span>
                        {format(new Date(transfer.approvedAt), 'dd/MM/yyyy HH:mm', {
                          locale: es,
                        })}
                      </span>
                    </div>
                  )}
                  {transfer.sentAt && (
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-blue-500" />
                      <span className="text-muted-foreground">Enviado:</span>
                      <span>
                        {format(new Date(transfer.sentAt), 'dd/MM/yyyy HH:mm', {
                          locale: es,
                        })}
                      </span>
                    </div>
                  )}
                  {transfer.receivedAt && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-green-500" />
                      <span className="text-muted-foreground">Recibido:</span>
                      <span>
                        {format(new Date(transfer.receivedAt), 'dd/MM/yyyy HH:mm', {
                          locale: es,
                        })}
                      </span>
                    </div>
                  )}
                  {transfer.rejectedAt && (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-muted-foreground">Rechazado:</span>
                      <span>
                        {format(new Date(transfer.rejectedAt), 'dd/MM/yyyy HH:mm', {
                          locale: es,
                        })}
                      </span>
                      {transfer.rejectionReason && (
                        <span className="text-red-600">
                          - {transfer.rejectionReason}
                        </span>
                      )}
                    </div>
                  )}
                  {transfer.cancelledAt && (
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-muted-foreground">Cancelado:</span>
                      <span>
                        {format(new Date(transfer.cancelledAt), 'dd/MM/yyyy HH:mm', {
                          locale: es,
                        })}
                      </span>
                      {transfer.cancellationReason && (
                        <span className="text-red-600">
                          - {transfer.cancellationReason}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Notes */}
                {transfer.notes && (
                  <div className="text-sm">
                    <span className="font-medium">Notas:</span>{' '}
                    <span className="text-muted-foreground">{transfer.notes}</span>
                  </div>
                )}

                {/* Tracking */}
                {transfer.trackingNumber && (
                  <div className="text-sm">
                    <span className="font-medium">Seguimiento:</span>{' '}
                    <span className="text-muted-foreground">
                      {transfer.trackingNumber}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <AlertDialog
        open={actionDialog.open}
        onOpenChange={(open) => !open && closeActionDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.type === 'approve' && 'Aprobar Transferencia'}
              {actionDialog.type === 'reject' && 'Rechazar Transferencia'}
              {actionDialog.type === 'ship' && 'Enviar Transferencia'}
              {actionDialog.type === 'receive' && 'Recibir Transferencia'}
              {actionDialog.type === 'cancel' && 'Cancelar Transferencia'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTransfer?.transferNumber}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {(actionDialog.type === 'reject' || actionDialog.type === 'cancel') && (
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo *</Label>
                <Textarea
                  id="reason"
                  placeholder="Ingresa el motivo..."
                  value={actionData.reason || ''}
                  onChange={(e) =>
                    setActionData({ ...actionData, reason: e.target.value })
                  }
                />
              </div>
            )}

            {actionDialog.type === 'ship' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="trackingNumber">Número de Seguimiento</Label>
                  <Input
                    id="trackingNumber"
                    placeholder="ABC123456"
                    value={actionData.trackingNumber || ''}
                    onChange={(e) =>
                      setActionData({
                        ...actionData,
                        trackingNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shippingMethod">Método de Envío</Label>
                  <Input
                    id="shippingMethod"
                    placeholder="Courier, Transporte, etc."
                    value={actionData.shippingMethod || ''}
                    onChange={(e) =>
                      setActionData({
                        ...actionData,
                        shippingMethod: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
