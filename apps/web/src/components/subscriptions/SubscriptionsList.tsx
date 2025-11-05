'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  subscriptionsApi,
  Subscription,
  SubscriptionStatus,
  SUBSCRIPTION_STATUS_LABELS,
  BILLING_INTERVAL_LABELS,
} from '@/lib/api/subscriptions';
import {
  Card,
  CardContent,
  Badge,
  Button,
  useToast,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
} from '@retail/ui';
import {
  CreditCard,
  Calendar,
  DollarSign,
  Pause,
  Play,
  X,
  RotateCcw,
  Edit,
  Eye,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function SubscriptionsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: subscriptionsData, isLoading } = useQuery({
    queryKey: ['subscriptions', filterStatus],
    queryFn: () =>
      subscriptionsApi.getSubscriptions({
        status:
          filterStatus !== 'all' ? (filterStatus as SubscriptionStatus) : undefined,
      }),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, immediate, reason }: any) =>
      subscriptionsApi.cancelSubscription(id, { immediate, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({ title: 'Suscripción cancelada correctamente' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo cancelar la suscripción',
        variant: 'destructive',
      });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: ({ id, reason }: any) =>
      subscriptionsApi.pauseSubscription(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({ title: 'Suscripción pausada correctamente' });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: subscriptionsApi.resumeSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({ title: 'Suscripción reactivada correctamente' });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: subscriptionsApi.reactivateSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({ title: 'Suscripción reactivada correctamente' });
    },
  });

  const subscriptions = subscriptionsData?.data || [];

  const filteredSubscriptions = subscriptions.filter((sub: Subscription) => {
    const matchesSearch =
      sub.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.plan?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getStatusBadge = (status: SubscriptionStatus) => {
    const colors: Record<SubscriptionStatus, string> = {
      TRIAL: 'bg-purple-100 text-purple-800',
      ACTIVE: 'bg-green-100 text-green-800',
      PAST_DUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-orange-100 text-orange-800',
      EXPIRED: 'bg-gray-100 text-gray-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
    };

    return (
      <Badge className={colors[status]}>{SUBSCRIPTION_STATUS_LABELS[status]}</Badge>
    );
  };

  const handleCancel = async (id: string) => {
    const immediate = confirm(
      '¿Cancelar inmediatamente? (No = cancelar al final del período)'
    );
    const reason = prompt('Motivo de cancelación (opcional):');

    if (reason !== null) {
      await cancelMutation.mutateAsync({ id, immediate, reason: reason || undefined });
    }
  };

  const handlePause = async (id: string) => {
    const reason = prompt('Motivo de pausa (opcional):');
    if (reason !== null) {
      await pauseMutation.mutateAsync({ id, reason: reason || undefined });
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando suscripciones...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por cliente o plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value={SubscriptionStatus.TRIAL}>En Prueba</SelectItem>
                <SelectItem value={SubscriptionStatus.ACTIVE}>Activas</SelectItem>
                <SelectItem value={SubscriptionStatus.PAST_DUE}>Vencidas</SelectItem>
                <SelectItem value={SubscriptionStatus.CANCELLED}>Canceladas</SelectItem>
                <SelectItem value={SubscriptionStatus.PAUSED}>Pausadas</SelectItem>
                <SelectItem value={SubscriptionStatus.EXPIRED}>Expiradas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions */}
      {filteredSubscriptions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay suscripciones</h3>
            <p className="text-gray-600">
              {searchTerm ? 'No se encontraron resultados' : 'No hay suscripciones activas'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSubscriptions.map((subscription: Subscription) => (
            <Card
              key={subscription.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {subscription.plan?.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <span className="font-medium">
                            {subscription.customer?.name}
                          </span>
                          <span>•</span>
                          <span>{subscription.customer?.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold text-blue-600 text-base">
                            ${subscription.price}
                          </span>
                          <span className="text-gray-600">
                            / {BILLING_INTERVAL_LABELS[subscription.interval]}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-600 mb-1">Inicio:</div>
                        <div className="font-medium">
                          {format(parseISO(subscription.startedAt), 'dd MMM yyyy', {
                            locale: es,
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-600 mb-1">Próximo Pago:</div>
                        <div className="font-medium">
                          {subscription.nextBillingDate
                            ? format(
                                parseISO(subscription.nextBillingDate),
                                'dd MMM yyyy',
                                { locale: es }
                              )
                            : '-'}
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-600 mb-1">Período Actual:</div>
                        <div className="font-medium">
                          {format(
                            parseISO(subscription.currentPeriodStart),
                            'dd MMM',
                            { locale: es }
                          )}{' '}
                          -{' '}
                          {format(parseISO(subscription.currentPeriodEnd), 'dd MMM', {
                            locale: es,
                          })}
                        </div>
                      </div>
                    </div>

                    {subscription.addons && subscription.addons.length > 0 && (
                      <div className="mt-3 flex gap-2">
                        <span className="text-sm text-gray-600">Add-ons:</span>
                        {subscription.addons.map((addon) => (
                          <Badge key={addon.id} variant="outline">
                            {addon.addon?.name} x{addon.quantity}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(subscription.status)}

                    <div className="flex gap-2 mt-2">
                      {subscription.status === SubscriptionStatus.ACTIVE && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePause(subscription.id)}
                            disabled={pauseMutation.isPending}
                          >
                            <Pause className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancel(subscription.id)}
                            disabled={cancelMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}

                      {subscription.status === SubscriptionStatus.PAUSED && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => resumeMutation.mutate(subscription.id)}
                          disabled={resumeMutation.isPending}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}

                      {subscription.status === SubscriptionStatus.CANCELLED &&
                        !subscription.endedAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reactivateMutation.mutate(subscription.id)}
                            disabled={reactivateMutation.isPending}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}

                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
