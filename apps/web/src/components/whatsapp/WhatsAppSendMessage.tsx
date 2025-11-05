'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi } from '@/lib/api/whatsapp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  Users,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export function WhatsAppSendMessage() {
  const queryClient = useQueryClient();

  // Single message state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');

  // Bulk message state
  const [phoneNumbers, setPhoneNumbers] = useState('');
  const [bulkMessage, setBulkMessage] = useState('');

  // Send single message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: { phoneNumber: string; message: string; mediaUrl?: string }) =>
      whatsappApi.sendMessage(data),
    onSuccess: () => {
      toast.success('Mensaje enviado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'messages'] });
      // Reset form
      setPhoneNumber('');
      setMessage('');
      setMediaUrl('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al enviar mensaje');
    },
  });

  // Send bulk messages mutation
  const sendBulkMessagesMutation = useMutation({
    mutationFn: (data: { phoneNumbers: string[]; message: string }) =>
      whatsappApi.sendBulkMessages(data),
    onSuccess: (data) => {
      toast.success(
        `Mensajes enviados: ${data.success} exitosos, ${data.failed} fallidos`
      );
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'messages'] });
      // Reset form
      setPhoneNumbers('');
      setBulkMessage('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al enviar mensajes masivos');
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim() || !message.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    sendMessageMutation.mutate({
      phoneNumber: phoneNumber.trim(),
      message: message.trim(),
      mediaUrl: mediaUrl.trim() || undefined,
    });
  };

  const handleSendBulkMessages = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumbers.trim() || !bulkMessage.trim()) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    // Split phone numbers by comma or newline
    const numbers = phoneNumbers
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (numbers.length === 0) {
      toast.error('Por favor ingresa al menos un número de teléfono');
      return;
    }

    sendBulkMessagesMutation.mutate({
      phoneNumbers: numbers,
      message: bulkMessage.trim(),
    });
  };

  const parsedPhoneNumbers = phoneNumbers
    .split(/[,\n]/)
    .map((n) => n.trim())
    .filter((n) => n.length > 0);

  return (
    <Tabs defaultValue="single" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="single">
          <MessageSquare className="mr-2 h-4 w-4" />
          Mensaje Individual
        </TabsTrigger>
        <TabsTrigger value="bulk">
          <Users className="mr-2 h-4 w-4" />
          Mensaje Masivo
        </TabsTrigger>
      </TabsList>

      {/* Single Message */}
      <TabsContent value="single">
        <Card>
          <CardHeader>
            <CardTitle>Enviar Mensaje Individual</CardTitle>
            <CardDescription>
              Envía un mensaje personalizado a un número de teléfono específico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">
                  Número de Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phoneNumber"
                  placeholder="+54 9 11 1234-5678"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Incluye el código de país (ej: +54 para Argentina)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">
                  Mensaje <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Escribe tu mensaje aquí..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {message.length} caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mediaUrl">URL de Imagen/Video (Opcional)</Label>
                <Input
                  id="mediaUrl"
                  placeholder="https://ejemplo.com/imagen.jpg"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  type="url"
                />
                <p className="text-xs text-muted-foreground">
                  Envía una imagen o video adjunto (debe ser una URL pública)
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  El mensaje se enviará inmediatamente. Asegúrate de que el número sea
                  correcto antes de enviar.
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                className="w-full"
                disabled={sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Mensaje
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Bulk Messages */}
      <TabsContent value="bulk">
        <Card>
          <CardHeader>
            <CardTitle>Enviar Mensajes Masivos</CardTitle>
            <CardDescription>
              Envía el mismo mensaje a múltiples números de teléfono
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendBulkMessages} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumbers">
                  Números de Teléfono <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="phoneNumbers"
                  placeholder="+54 9 11 1234-5678, +54 9 11 8765-4321&#10;Uno por línea o separados por coma"
                  value={phoneNumbers}
                  onChange={(e) => setPhoneNumbers(e.target.value)}
                  rows={6}
                  required
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Incluye el código de país. Separa los números con comas o saltos de línea
                  </p>
                  {parsedPhoneNumbers.length > 0 && (
                    <Badge variant="secondary">
                      {parsedPhoneNumbers.length} número{parsedPhoneNumbers.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulkMessage">
                  Mensaje <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="bulkMessage"
                  placeholder="Escribe el mensaje que se enviará a todos los números..."
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  rows={6}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {bulkMessage.length} caracteres
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Los mensajes se enviarán con un intervalo de 2-3 segundos entre cada uno para
                  evitar límites de tasa. Esto puede tomar varios minutos para listas grandes.
                </AlertDescription>
              </Alert>

              {parsedPhoneNumbers.length > 0 && (
                <div className="rounded-lg border bg-muted p-4">
                  <p className="mb-2 text-sm font-medium">
                    Números a enviar ({parsedPhoneNumbers.length}):
                  </p>
                  <div className="max-h-32 overflow-y-auto">
                    <div className="flex flex-wrap gap-2">
                      {parsedPhoneNumbers.slice(0, 10).map((num, idx) => (
                        <Badge key={idx} variant="outline">
                          {num}
                        </Badge>
                      ))}
                      {parsedPhoneNumbers.length > 10 && (
                        <Badge variant="secondary">
                          +{parsedPhoneNumbers.length - 10} más
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={sendBulkMessagesMutation.isPending || parsedPhoneNumbers.length === 0}
              >
                {sendBulkMessagesMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando mensajes...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar a {parsedPhoneNumbers.length} número
                    {parsedPhoneNumbers.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results after sending */}
        {sendBulkMessagesMutation.isSuccess && sendBulkMessagesMutation.data && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Resultados del Envío</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {sendBulkMessagesMutation.data.success}
                      </p>
                      <p className="text-sm text-muted-foreground">Exitosos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-2xl font-bold">
                        {sendBulkMessagesMutation.data.failed}
                      </p>
                      <p className="text-sm text-muted-foreground">Fallidos</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
