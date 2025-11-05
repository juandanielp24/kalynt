'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi } from '@/lib/api/delivery';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Label,
  Switch,
  useToast,
} from '@retail/ui';
import { Loader2, Settings } from 'lucide-react';

export function DeliverySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['delivery-settings'],
    queryFn: () => deliveryApi.getSettings(),
  });

  const [formData, setFormData] = useState({
    enableDelivery: true,
    autoAssign: false,
    defaultBaseCost: '',
    defaultCostPerKm: '',
    freeDeliveryEnabled: false,
    freeDeliveryMinAmount: '',
    defaultEstimatedTime: '60',
    bufferTime: '15',
    workingHoursStart: '',
    workingHoursEnd: '',
    notifyCustomerOnAssign: true,
    notifyCustomerOnPickup: true,
    notifyCustomerOnArrival: true,
    notifyCustomerOnDelivery: true,
  });

  useEffect(() => {
    if (settingsData?.data) {
      const settings = settingsData.data;
      setFormData({
        enableDelivery: settings.enableDelivery,
        autoAssign: settings.autoAssign,
        defaultBaseCost: settings.defaultBaseCost.toString(),
        defaultCostPerKm: settings.defaultCostPerKm.toString(),
        freeDeliveryEnabled: settings.freeDeliveryEnabled,
        freeDeliveryMinAmount: settings.freeDeliveryMinAmount?.toString() || '',
        defaultEstimatedTime: settings.defaultEstimatedTime.toString(),
        bufferTime: settings.bufferTime.toString(),
        workingHoursStart: settings.workingHoursStart || '',
        workingHoursEnd: settings.workingHoursEnd || '',
        notifyCustomerOnAssign: settings.notifyCustomerOnAssign,
        notifyCustomerOnPickup: settings.notifyCustomerOnPickup,
        notifyCustomerOnArrival: settings.notifyCustomerOnArrival,
        notifyCustomerOnDelivery: settings.notifyCustomerOnDelivery,
      });
    }
  }, [settingsData]);

  const updateSettingsMutation = useMutation({
    mutationFn: deliveryApi.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-settings'] });
      toast({
        title: 'Configuración actualizada',
        description: 'Los cambios se guardaron correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar la configuración',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      enableDelivery: formData.enableDelivery,
      autoAssign: formData.autoAssign,
      defaultBaseCost: parseFloat(formData.defaultBaseCost),
      defaultCostPerKm: parseFloat(formData.defaultCostPerKm),
      freeDeliveryEnabled: formData.freeDeliveryEnabled,
      freeDeliveryMinAmount: formData.freeDeliveryMinAmount
        ? parseFloat(formData.freeDeliveryMinAmount)
        : undefined,
      defaultEstimatedTime: parseInt(formData.defaultEstimatedTime),
      bufferTime: parseInt(formData.bufferTime),
      workingHoursStart: formData.workingHoursStart || undefined,
      workingHoursEnd: formData.workingHoursEnd || undefined,
      notifyCustomerOnAssign: formData.notifyCustomerOnAssign,
      notifyCustomerOnPickup: formData.notifyCustomerOnPickup,
      notifyCustomerOnArrival: formData.notifyCustomerOnArrival,
      notifyCustomerOnDelivery: formData.notifyCustomerOnDelivery,
    };

    updateSettingsMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando configuración...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configuración de Delivery
        </h2>
        <p className="text-gray-600">Configura el comportamiento del sistema de deliveries</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración General</CardTitle>
              <CardDescription>Ajustes básicos del sistema de delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enableDelivery">Habilitar Sistema de Delivery</Label>
                  <p className="text-sm text-gray-600">Activa o desactiva el módulo completo</p>
                </div>
                <Switch
                  id="enableDelivery"
                  checked={formData.enableDelivery}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, enableDelivery: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="autoAssign">Asignación Automática</Label>
                  <p className="text-sm text-gray-600">
                    Asignar automáticamente deliveries a repartidores disponibles
                  </p>
                </div>
                <Switch
                  id="autoAssign"
                  checked={formData.autoAssign}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, autoAssign: checked })
                  }
                  disabled={!formData.enableDelivery}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cost Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Costos Predeterminados</CardTitle>
              <CardDescription>Se usan cuando no hay zona específica configurada</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultBaseCost">Costo Base ($)</Label>
                  <Input
                    id="defaultBaseCost"
                    type="number"
                    step="0.01"
                    value={formData.defaultBaseCost}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultBaseCost: e.target.value })
                    }
                    disabled={!formData.enableDelivery}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultCostPerKm">Costo por Kilómetro ($)</Label>
                  <Input
                    id="defaultCostPerKm"
                    type="number"
                    step="0.01"
                    value={formData.defaultCostPerKm}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultCostPerKm: e.target.value })
                    }
                    disabled={!formData.enableDelivery}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="freeDeliveryEnabled">Envío Gratis</Label>
                  <p className="text-sm text-gray-600">Ofrecer envío gratis desde un monto mínimo</p>
                </div>
                <Switch
                  id="freeDeliveryEnabled"
                  checked={formData.freeDeliveryEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, freeDeliveryEnabled: checked })
                  }
                  disabled={!formData.enableDelivery}
                />
              </div>

              {formData.freeDeliveryEnabled && (
                <div className="space-y-2">
                  <Label htmlFor="freeDeliveryMinAmount">Monto Mínimo para Envío Gratis ($)</Label>
                  <Input
                    id="freeDeliveryMinAmount"
                    type="number"
                    step="0.01"
                    value={formData.freeDeliveryMinAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, freeDeliveryMinAmount: e.target.value })
                    }
                    disabled={!formData.enableDelivery}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Time Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Tiempos</CardTitle>
              <CardDescription>Tiempos estimados y horarios de operación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultEstimatedTime">Tiempo Estimado (minutos)</Label>
                  <Input
                    id="defaultEstimatedTime"
                    type="number"
                    value={formData.defaultEstimatedTime}
                    onChange={(e) =>
                      setFormData({ ...formData, defaultEstimatedTime: e.target.value })
                    }
                    disabled={!formData.enableDelivery}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bufferTime">Tiempo de Buffer (minutos)</Label>
                  <Input
                    id="bufferTime"
                    type="number"
                    value={formData.bufferTime}
                    onChange={(e) => setFormData({ ...formData, bufferTime: e.target.value })}
                    disabled={!formData.enableDelivery}
                  />
                  <p className="text-xs text-gray-600">Tiempo extra para imprevistos</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="workingHoursStart">Horario Inicio (opcional)</Label>
                  <Input
                    id="workingHoursStart"
                    type="time"
                    value={formData.workingHoursStart}
                    onChange={(e) =>
                      setFormData({ ...formData, workingHoursStart: e.target.value })
                    }
                    disabled={!formData.enableDelivery}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="workingHoursEnd">Horario Fin (opcional)</Label>
                  <Input
                    id="workingHoursEnd"
                    type="time"
                    value={formData.workingHoursEnd}
                    onChange={(e) =>
                      setFormData({ ...formData, workingHoursEnd: e.target.value })
                    }
                    disabled={!formData.enableDelivery}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones al Cliente</CardTitle>
              <CardDescription>
                Configura cuando enviar notificaciones por WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifyCustomerOnAssign">Al Asignar Repartidor</Label>
                  <p className="text-sm text-gray-600">Cuando se asigna el delivery</p>
                </div>
                <Switch
                  id="notifyCustomerOnAssign"
                  checked={formData.notifyCustomerOnAssign}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notifyCustomerOnAssign: checked })
                  }
                  disabled={!formData.enableDelivery}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifyCustomerOnPickup">Al Recoger Pedido</Label>
                  <p className="text-sm text-gray-600">Cuando el repartidor recoge el pedido</p>
                </div>
                <Switch
                  id="notifyCustomerOnPickup"
                  checked={formData.notifyCustomerOnPickup}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notifyCustomerOnPickup: checked })
                  }
                  disabled={!formData.enableDelivery}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifyCustomerOnArrival">Al Llegar al Destino</Label>
                  <p className="text-sm text-gray-600">Cuando el repartidor llega a la dirección</p>
                </div>
                <Switch
                  id="notifyCustomerOnArrival"
                  checked={formData.notifyCustomerOnArrival}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notifyCustomerOnArrival: checked })
                  }
                  disabled={!formData.enableDelivery}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifyCustomerOnDelivery">Al Entregar Pedido</Label>
                  <p className="text-sm text-gray-600">Cuando se completa la entrega</p>
                </div>
                <Switch
                  id="notifyCustomerOnDelivery"
                  checked={formData.notifyCustomerOnDelivery}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notifyCustomerOnDelivery: checked })
                  }
                  disabled={!formData.enableDelivery}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button type="submit" disabled={updateSettingsMutation.isPending}>
            {updateSettingsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Configuración'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
