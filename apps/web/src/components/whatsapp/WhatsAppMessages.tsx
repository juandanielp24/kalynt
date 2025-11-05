'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { whatsappApi, MessageDirection, MessageStatus, type WhatsAppMessage } from '@/lib/api/whatsapp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCheck,
  Check,
  Clock,
  Loader2,
  MessageSquare,
  Search,
  XCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const statusIcons: Record<MessageStatus, any> = {
  PENDING: Clock,
  SENT: Check,
  DELIVERED: CheckCheck,
  READ: CheckCheck,
  FAILED: XCircle,
};

const statusColors: Record<MessageStatus, string> = {
  PENDING: 'text-yellow-600 dark:text-yellow-400',
  SENT: 'text-blue-600 dark:text-blue-400',
  DELIVERED: 'text-green-600 dark:text-green-400',
  READ: 'text-green-600 dark:text-green-400',
  FAILED: 'text-red-600 dark:text-red-400',
};

const statusLabels: Record<MessageStatus, string> = {
  PENDING: 'Pendiente',
  SENT: 'Enviado',
  DELIVERED: 'Entregado',
  READ: 'Leído',
  FAILED: 'Fallido',
};

export function WhatsAppMessages() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [direction, setDirection] = useState<MessageDirection | 'ALL'>('ALL');
  const [status, setStatus] = useState<MessageStatus | 'ALL'>('ALL');
  const [limit, setLimit] = useState(50);

  // Fetch messages
  const { data: messages, isLoading, error } = useQuery<WhatsAppMessage[]>({
    queryKey: ['whatsapp', 'messages', { phoneNumber, direction, status, limit }],
    queryFn: () =>
      whatsappApi.getMessages({
        phoneNumber: phoneNumber || undefined,
        direction: direction !== 'ALL' ? direction : undefined,
        status: status !== 'ALL' ? status : undefined,
        limit,
      }),
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['whatsapp', 'messages', 'stats'],
    queryFn: () => whatsappApi.getMessageStats(7),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Query will automatically refetch due to state changes
  };

  const handleReset = () => {
    setPhoneNumber('');
    setDirection('ALL');
    setStatus('ALL');
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Error al cargar mensajes: {(error as any).message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSent || 0}</div>
              <p className="text-xs text-muted-foreground">Últimos 7 días</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entregados</CardTitle>
              <CheckCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDelivered || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.deliveryRate ? `${stats.deliveryRate}%` : '0%'} tasa de entrega
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leídos</CardTitle>
              <CheckCheck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRead || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.readRate ? `${stats.readRate}%` : '0%'} tasa de lectura
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fallidos</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFailed || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.failureRate ? `${stats.failureRate}%` : '0%'} tasa de fallo
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra mensajes de WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Número de Teléfono</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phoneNumber"
                    placeholder="Buscar por teléfono..."
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direction">Dirección</Label>
                <Select value={direction} onValueChange={(value: any) => setDirection(value)}>
                  <SelectTrigger id="direction">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas</SelectItem>
                    <SelectItem value="OUTGOING">Enviados</SelectItem>
                    <SelectItem value="INCOMING">Recibidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos</SelectItem>
                    <SelectItem value="PENDING">Pendiente</SelectItem>
                    <SelectItem value="SENT">Enviado</SelectItem>
                    <SelectItem value="DELIVERED">Entregado</SelectItem>
                    <SelectItem value="READ">Leído</SelectItem>
                    <SelectItem value="FAILED">Fallido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit">Límite</Label>
                <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
                  <SelectTrigger id="limit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                <Search className="mr-2 h-4 w-4" />
                Buscar
              </Button>
              <Button type="button" variant="outline" onClick={handleReset}>
                Limpiar Filtros
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>Mensajes ({messages?.length || 0})</CardTitle>
          <CardDescription>Historial de mensajes de WhatsApp</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : !messages || messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm text-muted-foreground">
                No se encontraron mensajes
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dirección</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Contenido</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Plantilla</TableHead>
                    <TableHead>Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.map((message) => {
                    const StatusIcon = statusIcons[message.status];
                    return (
                      <TableRow key={message.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {message.direction === MessageDirection.OUTGOING ? (
                              <ArrowUpCircle className="h-4 w-4 text-blue-600" />
                            ) : (
                              <ArrowDownCircle className="h-4 w-4 text-green-600" />
                            )}
                            <span className="text-sm">
                              {message.direction === MessageDirection.OUTGOING
                                ? 'Enviado'
                                : 'Recibido'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs">{message.phoneNumber}</code>
                        </TableCell>
                        <TableCell>
                          <p className="max-w-md truncate text-sm">{message.content}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <StatusIcon
                              className={cn('h-4 w-4', statusColors[message.status])}
                            />
                            <Badge
                              variant={
                                message.status === MessageStatus.FAILED
                                  ? 'destructive'
                                  : message.status === MessageStatus.READ ||
                                    message.status === MessageStatus.DELIVERED
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {statusLabels[message.status]}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          {message.template ? (
                            <Badge variant="outline">{message.template.name}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <p>{new Date(message.createdAt).toLocaleDateString()}</p>
                            <p className="text-muted-foreground">
                              {new Date(message.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
