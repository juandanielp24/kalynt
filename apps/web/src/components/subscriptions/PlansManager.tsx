'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  subscriptionsApi,
  SubscriptionPlan,
  BillingInterval,
  BILLING_INTERVAL_LABELS,
} from '@/lib/api/subscriptions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  useToast,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@retail/ui';
import {
  Plus,
  Edit,
  Trash2,
  Power,
  DollarSign,
  Users,
  Check,
  Star,
  Loader2,
} from 'lucide-react';

export function PlansManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    interval: BillingInterval.MONTHLY,
    intervalCount: '1',
    currency: 'USD',
    trialDays: '',
    setupFee: '',
    features: [] as string[],
    maxUsers: '',
    maxProducts: '',
    maxStorage: '',
    displayOrder: '0',
    isPopular: false,
    badge: '',
  });

  const [featureInput, setFeatureInput] = useState('');

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionsApi.getPlans(),
  });

  const createMutation = useMutation({
    mutationFn: subscriptionsApi.createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({ title: 'Plan creado correctamente' });
      handleCloseForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear el plan',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      subscriptionsApi.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({ title: 'Plan actualizado correctamente' });
      handleCloseForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: subscriptionsApi.deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({ title: 'Plan eliminado correctamente' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: subscriptionsApi.togglePlanStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      toast({ title: 'Estado actualizado' });
    },
  });

  const plans = plansData?.data || [];

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      interval: plan.interval,
      intervalCount: plan.intervalCount.toString(),
      currency: plan.currency,
      trialDays: plan.trialDays?.toString() || '',
      setupFee: plan.setupFee?.toString() || '',
      features: (plan.features as string[]) || [],
      maxUsers: plan.maxUsers?.toString() || '',
      maxProducts: plan.maxProducts?.toString() || '',
      maxStorage: plan.maxStorage?.toString() || '',
      displayOrder: plan.displayOrder.toString(),
      isPopular: plan.isPopular,
      badge: plan.badge || '',
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      interval: BillingInterval.MONTHLY,
      intervalCount: '1',
      currency: 'USD',
      trialDays: '',
      setupFee: '',
      features: [],
      maxUsers: '',
      maxProducts: '',
      maxStorage: '',
      displayOrder: '0',
      isPopular: false,
      badge: '',
    });
    setFeatureInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      price: parseFloat(formData.price),
      interval: formData.interval,
      intervalCount: parseInt(formData.intervalCount),
      currency: formData.currency,
      trialDays: formData.trialDays ? parseInt(formData.trialDays) : undefined,
      setupFee: formData.setupFee ? parseFloat(formData.setupFee) : undefined,
      features: formData.features.length > 0 ? formData.features : undefined,
      maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : undefined,
      maxProducts: formData.maxProducts ? parseInt(formData.maxProducts) : undefined,
      maxStorage: formData.maxStorage ? parseInt(formData.maxStorage) : undefined,
      displayOrder: parseInt(formData.displayOrder),
      isPopular: formData.isPopular,
      badge: formData.badge || undefined,
    };

    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este plan?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando planes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Planes de Suscripción</h2>
          <p className="text-gray-600 text-sm">Configura tus planes y precios</p>
        </div>

        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan: SubscriptionPlan) => (
          <Card
            key={plan.id}
            className={`relative hover:shadow-lg transition-shadow ${
              !plan.isActive ? 'opacity-60' : ''
            } ${plan.isPopular ? 'border-2 border-purple-500' : ''}`}
          >
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white">
                  <Star className="h-3 w-3 mr-1" />
                  {plan.badge}
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-3">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              {plan.description && (
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
              )}

              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-gray-600">
                    / {BILLING_INTERVAL_LABELS[plan.interval]}
                  </span>
                </div>

                {plan.setupFee && (
                  <p className="text-sm text-gray-600 mt-2">
                    + ${plan.setupFee} setup fee
                  </p>
                )}

                {plan.trialDays && (
                  <Badge variant="secondary" className="mt-2">
                    {plan.trialDays} días de prueba gratis
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {/* Features */}
              {plan.features && (plan.features as string[]).length > 0 && (
                <div className="space-y-2 mb-4">
                  {(plan.features as string[]).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Limits */}
              <div className="space-y-2 mb-4 text-sm border-t pt-4">
                {plan.maxUsers && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Usuarios:</span>
                    <span className="font-medium">{plan.maxUsers}</span>
                  </div>
                )}
                {plan.maxProducts && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Productos:</span>
                    <span className="font-medium">{plan.maxProducts}</span>
                  </div>
                )}
                {plan.maxStorage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Almacenamiento:</span>
                    <span className="font-medium">{plan.maxStorage} MB</span>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-600 mb-4 pb-4 border-t pt-4">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{plan._count?.subscriptions || 0} suscripciones</span>
                </div>
                <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                  {plan.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMutation.mutate(plan.id)}
                  disabled={toggleMutation.isPending}
                  className="flex-1"
                >
                  <Power className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(plan)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(plan.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlan ? 'Editar Plan' : 'Nuevo Plan'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Información Básica</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre del Plan *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="badge">Badge (Ej: Popular, Mejor Valor)</Label>
                    <Input
                      id="badge"
                      value={formData.badge}
                      onChange={(e) =>
                        setFormData({ ...formData, badge: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="font-semibold">Precio y Facturación</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interval">Intervalo *</Label>
                    <Select
                      value={formData.interval}
                      onValueChange={(value: BillingInterval) =>
                        setFormData({ ...formData, interval: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(BILLING_INTERVAL_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="intervalCount">Cantidad de Intervalos</Label>
                    <Input
                      id="intervalCount"
                      type="number"
                      value={formData.intervalCount}
                      onChange={(e) =>
                        setFormData({ ...formData, intervalCount: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="setupFee">Cargo Inicial (Setup Fee)</Label>
                    <Input
                      id="setupFee"
                      type="number"
                      step="0.01"
                      value={formData.setupFee}
                      onChange={(e) =>
                        setFormData({ ...formData, setupFee: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trialDays">Días de Prueba Gratis</Label>
                    <Input
                      id="trialDays"
                      type="number"
                      value={formData.trialDays}
                      onChange={(e) =>
                        setFormData({ ...formData, trialDays: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayOrder">Orden de Visualización</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={formData.displayOrder}
                      onChange={(e) =>
                        setFormData({ ...formData, displayOrder: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4">
                <h3 className="font-semibold">Características Incluidas</h3>

                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar característica..."
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                  />
                  <Button type="button" onClick={addFeature}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {formData.features.length > 0 && (
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFeature(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Limits */}
              <div className="space-y-4">
                <h3 className="font-semibold">Límites del Plan</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxUsers">Usuarios Máximos</Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      value={formData.maxUsers}
                      onChange={(e) =>
                        setFormData({ ...formData, maxUsers: e.target.value })
                      }
                      placeholder="Ilimitado"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxProducts">Productos Máximos</Label>
                    <Input
                      id="maxProducts"
                      type="number"
                      value={formData.maxProducts}
                      onChange={(e) =>
                        setFormData({ ...formData, maxProducts: e.target.value })
                      }
                      placeholder="Ilimitado"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxStorage">Almacenamiento (MB)</Label>
                    <Input
                      id="maxStorage"
                      type="number"
                      value={formData.maxStorage}
                      onChange={(e) =>
                        setFormData({ ...formData, maxStorage: e.target.value })
                      }
                      placeholder="Ilimitado"
                    />
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <Label htmlFor="isPopular">Marcar como "Popular"</Label>
                  <Switch
                    id="isPopular"
                    checked={formData.isPopular}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isPopular: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingPlan ? (
                  'Actualizar Plan'
                ) : (
                  'Crear Plan'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
