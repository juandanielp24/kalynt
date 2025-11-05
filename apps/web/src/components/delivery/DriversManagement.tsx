'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  deliveryApi,
  Driver,
  VehicleType,
  DriverStatus,
  VEHICLE_TYPE_LABELS,
  DRIVER_STATUS_LABELS,
} from '@/lib/api/delivery';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@retail/ui';
import {
  User,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Car,
  MapPin,
  Star,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  AVAILABLE: { color: 'bg-green-100 text-green-800', label: 'Disponible' },
  BUSY: { color: 'bg-blue-100 text-blue-800', label: 'Ocupado' },
  OFFLINE: { color: 'bg-gray-100 text-gray-800', label: 'Desconectado' },
  BREAK: { color: 'bg-yellow-100 text-yellow-800', label: 'En descanso' },
};

interface DriverFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  documentType?: string;
  documentNumber?: string;
  vehicleType: VehicleType;
  vehiclePlate?: string;
  vehicleModel?: string;
  status: DriverStatus;
  isActive: boolean;
}

export function DriversManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [createEditDialog, setCreateEditDialog] = useState<{
    open: boolean;
    driver?: Driver;
  }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    driver?: Driver;
  }>({ open: false });
  const [statsDialog, setStatsDialog] = useState<{
    open: boolean;
    driver?: Driver;
  }>({ open: false });

  const [formData, setFormData] = useState<DriverFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    documentType: 'DNI',
    documentNumber: '',
    vehicleType: VehicleType.MOTORCYCLE,
    vehiclePlate: '',
    vehicleModel: '',
    status: DriverStatus.AVAILABLE,
    isActive: true,
  });

  const { data: driversData, isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => deliveryApi.getDrivers({}),
  });

  const { data: statsData } = useQuery({
    queryKey: ['driver-stats', statsDialog.driver?.id],
    queryFn: () => deliveryApi.getDriverStatistics(statsDialog.driver!.id, 30),
    enabled: !!statsDialog.driver?.id,
  });

  const createDriverMutation = useMutation({
    mutationFn: (data: Partial<Driver>) => deliveryApi.createDriver(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({
        title: 'Repartidor creado',
        description: 'El repartidor fue creado correctamente',
      });
      setCreateEditDialog({ open: false });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear el repartidor',
        variant: 'destructive',
      });
    },
  });

  const updateDriverMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Driver> }) =>
      deliveryApi.updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({
        title: 'Repartidor actualizado',
        description: 'Los datos fueron actualizados correctamente',
      });
      setCreateEditDialog({ open: false });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar el repartidor',
        variant: 'destructive',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: DriverStatus }) =>
      deliveryApi.updateDriverStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({
        title: 'Estado actualizado',
        description: 'El estado del repartidor fue actualizado',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: (id: string) => deliveryApi.deleteDriver(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast({
        title: 'Repartidor eliminado',
        description: 'El repartidor fue eliminado correctamente',
      });
      setDeleteDialog({ open: false });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo eliminar el repartidor',
        variant: 'destructive',
      });
    },
  });

  const drivers = driversData?.data || [];
  const stats = statsData?.data;

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      documentType: 'DNI',
      documentNumber: '',
      vehicleType: VehicleType.MOTORCYCLE,
      vehiclePlate: '',
      vehicleModel: '',
      status: DriverStatus.AVAILABLE,
      isActive: true,
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setCreateEditDialog({ open: true });
  };

  const openEditDialog = (driver: Driver) => {
    setFormData({
      firstName: driver.firstName,
      lastName: driver.lastName,
      phone: driver.phone,
      email: driver.email || '',
      documentType: driver.documentType || 'DNI',
      documentNumber: driver.documentNumber || '',
      vehicleType: driver.vehicleType,
      vehiclePlate: driver.vehiclePlate || '',
      vehicleModel: driver.vehicleModel || '',
      status: driver.status,
      isActive: driver.isActive,
    });
    setCreateEditDialog({ open: true, driver });
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.phone) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor complete todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    if (createEditDialog.driver) {
      updateDriverMutation.mutate({
        id: createEditDialog.driver.id,
        data: formData,
      });
    } else {
      createDriverMutation.mutate(formData);
    }
  };

  const handleStatusChange = (driver: Driver, status: DriverStatus) => {
    updateStatusMutation.mutate({ id: driver.id, status });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Repartidores</h2>
          <p className="text-gray-600 mt-1">
            Gestiona tu equipo de repartidores
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Repartidor
        </Button>
      </div>

      {/* Drivers Grid */}
      {isLoading ? (
        <div className="text-center py-12">Cargando repartidores...</div>
      ) : drivers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay repartidores</h3>
            <p className="text-gray-600 mb-4">
              Comienza agregando tu primer repartidor
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Repartidor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {drivers.map((driver: Driver) => {
            const statusConfig = STATUS_CONFIG[driver.status];

            return (
              <Card
                key={driver.id}
                className={`hover:shadow-md transition-shadow ${
                  !driver.isActive ? 'opacity-60' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {driver.firstName} {driver.lastName}
                      </CardTitle>
                      {!driver.isActive && (
                        <Badge variant="outline" className="mt-2">
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(driver)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, driver })}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Status */}
                  <div>
                    <Label className="text-xs text-gray-600">Estado</Label>
                    <Select
                      value={driver.status}
                      onValueChange={(value) =>
                        handleStatusChange(driver, value as DriverStatus)
                      }
                      disabled={updateStatusMutation.isPending}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(DriverStatus).map((status) => (
                          <SelectItem key={status} value={status}>
                            {DRIVER_STATUS_LABELS[status]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Contact */}
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Phone className="h-4 w-4" />
                      {driver.phone}
                    </div>
                    {driver.email && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="h-4 w-4" />
                        {driver.email}
                      </div>
                    )}
                  </div>

                  {/* Vehicle */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Car className="h-4 w-4" />
                      {VEHICLE_TYPE_LABELS[driver.vehicleType]}
                    </div>
                    {driver.vehiclePlate && (
                      <div className="text-xs text-gray-600 ml-6">
                        {driver.vehiclePlate}
                        {driver.vehicleModel && ` • ${driver.vehicleModel}`}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="pt-3 border-t grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-gray-600">Entregas</div>
                      <div className="text-lg font-semibold flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        {driver.totalDeliveries}
                      </div>
                    </div>
                    {driver.rating && (
                      <div>
                        <div className="text-xs text-gray-600">Rating</div>
                        <div className="text-lg font-semibold flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {driver.rating.toFixed(1)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Location Update */}
                  {driver.lastLocationUpdate && (
                    <div className="text-xs text-gray-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Última ubicación:{' '}
                      {format(
                        new Date(driver.lastLocationUpdate),
                        'dd/MM/yyyy HH:mm',
                        { locale: es }
                      )}
                    </div>
                  )}

                  {/* View Stats Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setStatsDialog({ open: true, driver })}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Ver Estadísticas
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Driver Dialog */}
      <Dialog
        open={createEditDialog.open}
        onOpenChange={(open) =>
          !open && setCreateEditDialog({ open: false })
        }
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {createEditDialog.driver
                ? 'Editar Repartidor'
                : 'Nuevo Repartidor'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">
                  Nombre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  placeholder="Juan"
                />
              </div>
              <div>
                <Label htmlFor="lastName">
                  Apellido <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  placeholder="Pérez"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="juan@example.com"
                />
              </div>
            </div>

            {/* Document Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentType">Tipo de Documento</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, documentType: value })
                  }
                >
                  <SelectTrigger id="documentType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DNI">DNI</SelectItem>
                    <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                    <SelectItem value="CUIL">CUIL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="documentNumber">Número de Documento</Label>
                <Input
                  id="documentNumber"
                  value={formData.documentNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, documentNumber: e.target.value })
                  }
                  placeholder="12345678"
                />
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="vehicleType">
                  Tipo de Vehículo <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.vehicleType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicleType: value as VehicleType })
                  }
                >
                  <SelectTrigger id="vehicleType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(VehicleType).map((type) => (
                      <SelectItem key={type} value={type}>
                        {VEHICLE_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="vehiclePlate">Patente</Label>
                <Input
                  id="vehiclePlate"
                  value={formData.vehiclePlate}
                  onChange={(e) =>
                    setFormData({ ...formData, vehiclePlate: e.target.value })
                  }
                  placeholder="ABC123"
                />
              </div>
              <div>
                <Label htmlFor="vehicleModel">Modelo</Label>
                <Input
                  id="vehicleModel"
                  value={formData.vehicleModel}
                  onChange={(e) =>
                    setFormData({ ...formData, vehicleModel: e.target.value })
                  }
                  placeholder="Honda Wave"
                />
              </div>
            </div>

            {/* Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as DriverStatus })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(DriverStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {DRIVER_STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    className="rounded"
                  />
                  <span className="text-sm">Activo</span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateEditDialog({ open: false })}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                createDriverMutation.isPending || updateDriverMutation.isPending
              }
            >
              {createEditDialog.driver ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Repartidor</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong>
                {deleteDialog.driver?.firstName} {deleteDialog.driver?.lastName}
              </strong>
              ? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteDialog.driver &&
                deleteDriverMutation.mutate(deleteDialog.driver.id)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Driver Statistics Dialog */}
      <Dialog
        open={statsDialog.open}
        onOpenChange={(open) => !open && setStatsDialog({ open: false })}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Estadísticas de{' '}
              {statsDialog.driver?.firstName} {statsDialog.driver?.lastName}
            </DialogTitle>
          </DialogHeader>

          {stats ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600 mb-1">Total</div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-600" />
                      {stats.totals?.total || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600 mb-1">Entregados</div>
                    <div className="text-2xl font-bold flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      {stats.totals?.delivered || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600 mb-1">Rating</div>
                    <div className="text-2xl font-bold flex items-center gap-2 text-yellow-600">
                      <Star className="h-5 w-5" />
                      {stats.totals?.averageRating?.toFixed(1) || 'N/A'}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-gray-600 mb-1">Tiempo Prom.</div>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-600" />
                      {stats.totals?.averageTime
                        ? `${Math.round(stats.totals.averageTime)}m`
                        : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* By Status */}
              {stats.byStatus && stats.byStatus.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Por Estado (30 días)</h3>
                  <div className="space-y-2">
                    {stats.byStatus.map((item: any) => (
                      <div
                        key={item.status}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm font-medium">
                          {DRIVER_STATUS_LABELS[item.status as DriverStatus] ||
                            item.status}
                        </span>
                        <span className="text-lg font-bold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Desempeño</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Tasa de éxito</div>
                    <div className="text-lg font-semibold text-green-600">
                      {stats.totals?.total > 0
                        ? (
                            ((stats.totals?.delivered || 0) /
                              stats.totals.total) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Entregas totales</div>
                    <div className="text-lg font-semibold">
                      {statsDialog.driver?.totalDeliveries || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">
              Cargando estadísticas...
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
