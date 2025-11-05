'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi } from '@/lib/api/delivery';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Switch,
  useToast,
} from '@retail/ui';
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  DollarSign,
  Clock,
  Loader2,
  Calculator,
} from 'lucide-react';

export function DeliveryZones() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    postalCodes: '',
    neighborhoods: '',
    baseCost: '',
    costPerKm: '',
    freeDeliveryMin: '',
    estimatedMinutes: '60',
    maxDeliveryTime: '120',
    priority: '0',
    isActive: true,
  });

  const { data: zonesData, isLoading } = useQuery({
    queryKey: ['delivery-zones'],
    queryFn: () => deliveryApi.getZones(true),
  });

  const createZoneMutation = useMutation({
    mutationFn: deliveryApi.createZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      toast({
        title: 'Zona creada',
        description: 'La zona de delivery se creó correctamente',
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear la zona',
        variant: 'destructive',
      });
    },
  });

  const updateZoneMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      deliveryApi.updateZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      toast({
        title: 'Zona actualizada',
        description: 'La zona se actualizó correctamente',
      });
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar la zona',
        variant: 'destructive',
      });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: deliveryApi.deleteZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-zones'] });
      toast({
        title: 'Zona eliminada',
        description: 'La zona se eliminó correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo eliminar la zona',
        variant: 'destructive',
      });
    },
  });

  const zones = zonesData?.data || [];

  const handleOpenDialog = (zone?: any) => {
    if (zone) {
      setEditingZone(zone);
      setFormData({
        name: zone.name,
        description: zone.description || '',
        postalCodes: Array.isArray(zone.postalCodes) ? zone.postalCodes.join(', ') : '',
        neighborhoods: Array.isArray(zone.neighborhoods)
          ? zone.neighborhoods.join(', ')
          : '',
        baseCost: zone.baseCost.toString(),
        costPerKm: zone.costPerKm.toString(),
        freeDeliveryMin: zone.freeDeliveryMin?.toString() || '',
        estimatedMinutes: zone.estimatedMinutes.toString(),
        maxDeliveryTime: zone.maxDeliveryTime.toString(),
        priority: zone.priority.toString(),
        isActive: zone.isActive,
      });
    } else {
      setEditingZone(null);
      setFormData({
        name: '',
        description: '',
        postalCodes: '',
        neighborhoods: '',
        baseCost: '',
        costPerKm: '',
        freeDeliveryMin: '',
        estimatedMinutes: '60',
        maxDeliveryTime: '120',
        priority: '0',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingZone(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      postalCodes: formData.postalCodes
        ? formData.postalCodes.split(',').map((s) => s.trim())
        : [],
      neighborhoods: formData.neighborhoods
        ? formData.neighborhoods.split(',').map((s) => s.trim())
        : [],
      baseCost: parseFloat(formData.baseCost),
      costPerKm: parseFloat(formData.costPerKm || '0'),
      freeDeliveryMin: formData.freeDeliveryMin
        ? parseFloat(formData.freeDeliveryMin)
        : undefined,
      estimatedMinutes: parseInt(formData.estimatedMinutes),
      maxDeliveryTime: parseInt(formData.maxDeliveryTime),
      priority: parseInt(formData.priority),
      isActive: formData.isActive,
    };

    if (editingZone) {
      updateZoneMutation.mutate({ id: editingZone.id, data });
    } else {
      createZoneMutation.mutate(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta zona?')) {
      await deleteZoneMutation.mutateAsync(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Zonas de Cobertura</h2>
          <p className="text-gray-600">Define las zonas donde realizas deliveries</p>
        </div>

        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Zona
        </Button>
      </div>

      {/* Zones Grid */}
      {isLoading ? (
        <div className="text-center py-12">Cargando zonas...</div>
      ) : zones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay zonas configuradas</h3>
            <p className="text-gray-600 mb-4">Crea tu primera zona de cobertura</p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Zona
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone: any) => (
            <Card key={zone.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      {zone.name}
                    </CardTitle>
                    {zone.description && (
                      <p className="text-sm text-gray-600 mt-1">{zone.description}</p>
                    )}
                  </div>
                  <Badge variant={zone.isActive ? 'default' : 'secondary'}>
                    {zone.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Costs */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Costo Base</span>
                      <span className="font-semibold">${zone.baseCost.toFixed(2)}</span>
                    </div>
                    {zone.costPerKm > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Por Km</span>
                        <span className="font-semibold">${zone.costPerKm.toFixed(2)}</span>
                      </div>
                    )}
                    {zone.freeDeliveryMin && (
                      <div className="text-xs text-gray-600 mt-2">
                        Envío gratis desde ${zone.freeDeliveryMin}
                      </div>
                    )}
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span>
                      Estimado: {zone.estimatedMinutes} min (máx {zone.maxDeliveryTime} min)
                    </span>
                  </div>

                  {/* Coverage */}
                  {zone.postalCodes && zone.postalCodes.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        Códigos Postales
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {zone.postalCodes.slice(0, 3).map((code: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {code}
                          </Badge>
                        ))}
                        {zone.postalCodes.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{zone.postalCodes.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {zone.neighborhoods && zone.neighborhoods.length > 0 && (
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Barrios</div>
                      <div className="flex flex-wrap gap-1">
                        {zone.neighborhoods.slice(0, 2).map((n: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {n}
                          </Badge>
                        ))}
                        {zone.neighborhoods.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{zone.neighborhoods.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-3 border-t flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(zone)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(zone.id)}
                      disabled={deleteZoneMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingZone ? 'Editar Zona' : 'Nueva Zona'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Zona *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Zona Centro"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el área de cobertura..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postalCodes">Códigos Postales</Label>
                  <Input
                    id="postalCodes"
                    value={formData.postalCodes}
                    onChange={(e) =>
                      setFormData({ ...formData, postalCodes: e.target.value })
                    }
                    placeholder="1000, 1001, 1002"
                  />
                  <p className="text-xs text-gray-600">Separados por comas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="neighborhoods">Barrios</Label>
                  <Input
                    id="neighborhoods"
                    value={formData.neighborhoods}
                    onChange={(e) =>
                      setFormData({ ...formData, neighborhoods: e.target.value })
                    }
                    placeholder="Palermo, Recoleta"
                  />
                  <p className="text-xs text-gray-600">Separados por comas</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="baseCost">Costo Base ($) *</Label>
                  <Input
                    id="baseCost"
                    type="number"
                    step="0.01"
                    value={formData.baseCost}
                    onChange={(e) => setFormData({ ...formData, baseCost: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="costPerKm">Costo por Km ($)</Label>
                  <Input
                    id="costPerKm"
                    type="number"
                    step="0.01"
                    value={formData.costPerKm}
                    onChange={(e) => setFormData({ ...formData, costPerKm: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="freeDeliveryMin">Envío gratis desde ($)</Label>
                  <Input
                    id="freeDeliveryMin"
                    type="number"
                    step="0.01"
                    value={formData.freeDeliveryMin}
                    onChange={(e) =>
                      setFormData({ ...formData, freeDeliveryMin: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedMinutes">Tiempo Estimado (min) *</Label>
                  <Input
                    id="estimatedMinutes"
                    type="number"
                    value={formData.estimatedMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, estimatedMinutes: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDeliveryTime">Tiempo Máximo (min) *</Label>
                  <Input
                    id="maxDeliveryTime"
                    type="number"
                    value={formData.maxDeliveryTime}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDeliveryTime: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Input
                    id="priority"
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <Label htmlFor="isActive" className="font-medium">
                    Zona Activa
                  </Label>
                  <p className="text-sm text-gray-600">
                    Solo las zonas activas se pueden seleccionar
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createZoneMutation.isPending || updateZoneMutation.isPending}
              >
                {createZoneMutation.isPending || updateZoneMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingZone ? (
                  'Actualizar'
                ) : (
                  'Crear Zona'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
