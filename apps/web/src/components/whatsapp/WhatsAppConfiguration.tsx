'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { whatsappApi, type WhatsAppConfig } from '@/lib/api/whatsapp';
import { Button } from '@retail/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@retail/ui';
import { Label } from '@retail/ui';
import { Switch } from '@retail/ui';
import { Badge } from '@retail/ui';
import { AlertCircle, CheckCircle2, Loader2, QrCode, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@retail/ui';
import { toast } from 'sonner';

export function WhatsAppConfiguration() {
  const queryClient = useQueryClient();
  const [qrCode, setQrCode] = useState<string | null>(null);

  // Fetch configuration
  const { data: config, isLoading } = useQuery<WhatsAppConfig>({
    queryKey: ['whatsapp', 'config'],
    queryFn: whatsappApi.getConfig,
  });

  // Fetch status with polling every 10 seconds
  const { data: status } = useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: whatsappApi.getStatus,
    refetchInterval: 10000, // Poll every 10 seconds
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: whatsappApi.connect,
    onSuccess: (data) => {
      if (data.qrCode) {
        setQrCode(data.qrCode);
        toast.info('Escanea el código QR con WhatsApp');
      } else if (data.isConnected) {
        toast.success('WhatsApp conectado exitosamente');
        queryClient.invalidateQueries({ queryKey: ['whatsapp'] });
        setQrCode(null);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al conectar WhatsApp');
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: whatsappApi.disconnect,
    onSuccess: () => {
      toast.success('WhatsApp desconectado');
      queryClient.invalidateQueries({ queryKey: ['whatsapp'] });
      setQrCode(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al desconectar WhatsApp');
    },
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: (data: Partial<WhatsAppConfig>) => whatsappApi.updateConfig(data),
    onSuccess: () => {
      toast.success('Configuración actualizada');
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'config'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al actualizar configuración');
    },
  });

  const handleConnect = () => {
    connectMutation.mutate();
  };

  const handleDisconnect = () => {
    if (confirm('¿Estás seguro de desconectar WhatsApp?')) {
      disconnectMutation.mutate();
    }
  };

  const handleToggle = (field: keyof WhatsAppConfig, value: boolean) => {
    updateConfigMutation.mutate({ [field]: value });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!config) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>No se pudo cargar la configuración de WhatsApp</AlertDescription>
      </Alert>
    );
  }

  const isConnected = status?.isConnected || config.isConnected;

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Estado de Conexión</CardTitle>
              <CardDescription>
                Conecta tu cuenta de WhatsApp Business para enviar notificaciones automáticas
              </CardDescription>
            </div>
            <Badge variant={isConnected ? 'default' : 'secondary'} className="h-8">
              {isConnected ? (
                <>
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                  Conectado
                </>
              ) : (
                <>
                  <AlertCircle className="mr-1 h-4 w-4" />
                  Desconectado
                </>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 dark:bg-green-950">
                <Smartphone className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    WhatsApp conectado
                  </p>
                  {config.phoneNumber && (
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Número: {config.phoneNumber}
                    </p>
                  )}
                  {config.lastConnected && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Última conexión: {new Date(config.lastConnected).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
              >
                {disconnectMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Desconectar WhatsApp
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {qrCode ? (
                <div className="space-y-4">
                  <Alert>
                    <QrCode className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Escanea este código QR con WhatsApp:</strong>
                      <ol className="mt-2 list-inside list-decimal text-sm">
                        <li>Abre WhatsApp en tu teléfono</li>
                        <li>Ve a Configuración → Dispositivos vinculados</li>
                        <li>Toca &quot;Vincular un dispositivo&quot;</li>
                        <li>Escanea este código QR</li>
                      </ol>
                    </AlertDescription>
                  </Alert>
                  <div className="flex justify-center rounded-lg bg-white p-4">
                    <img src={qrCode} alt="QR Code" className="h-64 w-64" />
                  </div>
                  <p className="text-center text-sm text-muted-foreground">
                    El código QR se renovará automáticamente si expira
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed p-8">
                  <Smartphone className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center">
                    <p className="font-medium">WhatsApp no está conectado</p>
                    <p className="text-sm text-muted-foreground">
                      Conecta tu cuenta para comenzar a enviar notificaciones
                    </p>
                  </div>
                  <Button onClick={handleConnect} disabled={connectMutation.isPending}>
                    {connectMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Conectar WhatsApp
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Configuración de Notificaciones</CardTitle>
          <CardDescription>
            Configura qué notificaciones automáticas deseas enviar a tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificaciones Habilitadas</Label>
              <p className="text-sm text-muted-foreground">
                Activar o desactivar todas las notificaciones automáticas
              </p>
            </div>
            <Switch
              checked={config.notificationsEnabled}
              onCheckedChange={(checked) => handleToggle('notificationsEnabled', checked)}
              disabled={!isConnected || updateConfigMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Confirmaciones de Pedidos</Label>
              <p className="text-sm text-muted-foreground">
                Enviar confirmación cuando se crea un pedido
              </p>
            </div>
            <Switch
              checked={config.orderConfirmations}
              onCheckedChange={(checked) => handleToggle('orderConfirmations', checked)}
              disabled={!isConnected || !config.notificationsEnabled || updateConfigMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Stock</Label>
              <p className="text-sm text-muted-foreground">
                Notificar a clientes cuando productos vuelven a estar disponibles
              </p>
            </div>
            <Switch
              checked={config.stockAlerts}
              onCheckedChange={(checked) => handleToggle('stockAlerts', checked)}
              disabled={!isConnected || !config.notificationsEnabled || updateConfigMutation.isPending}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Recordatorios de Pago</Label>
              <p className="text-sm text-muted-foreground">
                Enviar recordatorios para pagos pendientes
              </p>
            </div>
            <Switch
              checked={config.paymentReminders}
              onCheckedChange={(checked) => handleToggle('paymentReminders', checked)}
              disabled={!isConnected || !config.notificationsEnabled || updateConfigMutation.isPending}
            />
          </div>

          {!isConnected && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Debes conectar WhatsApp para habilitar las notificaciones automáticas
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Negocio</CardTitle>
          <CardDescription>
            Esta información se incluirá en los mensajes de WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Nombre del Negocio</Label>
            <p className="text-sm">{config.businessName || 'No configurado'}</p>
          </div>
          <div className="grid gap-2">
            <Label>Número de Teléfono</Label>
            <p className="text-sm">{config.phoneNumber || 'No conectado'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
