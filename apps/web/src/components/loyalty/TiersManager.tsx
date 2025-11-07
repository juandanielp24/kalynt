'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loyaltyApi, LoyaltyTier } from '@/lib/api/loyalty';
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
  Switch,
} from '@retail/ui';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  Truck,
  Headphones,
  Loader2,
} from 'lucide-react';

interface Props {
  programId: string;
}

export function TiersManager({ programId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    icon: '🥉',
    pointsRequired: '0',
    order: '0',
    pointsMultiplier: '1',
    discountPercentage: '0',
    freeShipping: false,
    prioritySupport: false,
  });

  const { data: tiersData, isLoading } = useQuery({
    queryKey: ['loyalty-tiers', programId],
    queryFn: () => loyaltyApi.getTiers(programId),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => loyaltyApi.createTier(programId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-tiers', programId] });
      toast({ title: 'Nivel creado correctamente' });
      handleCloseForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear el nivel',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      loyaltyApi.updateTier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-tiers', programId] });
      toast({ title: 'Nivel actualizado correctamente' });
      handleCloseForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar el nivel',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: loyaltyApi.deleteTier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-tiers', programId] });
      toast({ title: 'Nivel eliminado correctamente' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo eliminar el nivel',
        variant: 'destructive',
      });
    },
  });

  const tiers = tiersData?.data || [];

  const handleEdit = (tier: LoyaltyTier) => {
    setEditingTier(tier);
    setFormData({
      name: tier.name,
      description: tier.description || '',
      color: tier.color || '#3b82f6',
      icon: tier.icon || '🥉',
      pointsRequired: tier.pointsRequired.toString(),
      order: tier.order.toString(),
      pointsMultiplier: tier.pointsMultiplier.toString(),
      discountPercentage: tier.discountPercentage.toString(),
      freeShipping: tier.freeShipping,
      prioritySupport: tier.prioritySupport,
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTier(null);
    setFormData({
      name: '',
      description: '',
      color: '#3b82f6',
      icon: '🥉',
      pointsRequired: '0',
      order: '0',
      pointsMultiplier: '1',
      discountPercentage: '0',
      freeShipping: false,
      prioritySupport: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      color: formData.color,
      icon: formData.icon,
      pointsRequired: parseInt(formData.pointsRequired),
      order: parseInt(formData.order),
      pointsMultiplier: parseFloat(formData.pointsMultiplier),
      discountPercentage: parseFloat(formData.discountPercentage),
      freeShipping: formData.freeShipping,
      prioritySupport: formData.prioritySupport,
    };

    if (editingTier) {
      updateMutation.mutate({ id: editingTier.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este nivel?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando niveles...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Niveles de Fidelidad</h2>
          <p className="text-gray-600 text-sm">
            Configura los niveles y sus beneficios
          </p>
        </div>

        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Nivel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier: LoyaltyTier) => (
          <Card
            key={tier.id}
            className="border-2 hover:shadow-lg transition-shadow"
            style={{ borderColor: tier.color }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{tier.icon}</span>
                  <div>
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    <p className="text-xs text-gray-600">
                      {tier.pointsRequired.toLocaleString()} pts
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {tier.description && (
                <p className="text-sm text-gray-600 mb-4">{tier.description}</p>
              )}

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Multiplicador:</span>
                  <Badge variant="secondary">
                    {tier.pointsMultiplier}x
                  </Badge>
                </div>

                {tier.discountPercentage > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Descuento:</span>
                    <Badge variant="secondary">
                      {tier.discountPercentage}%
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                {tier.freeShipping && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Truck className="h-4 w-4" />
                    <span>Envío gratis</span>
                  </div>
                )}

                {tier.prioritySupport && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Headphones className="h-4 w-4" />
                    <span>Soporte prioritario</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Users className="h-4 w-4" />
                <span>{tier._count?.members || 0} miembros</span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(tier)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(tier.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tier Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? 'Editar Nivel' : 'Nuevo Nivel'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej: Gold"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="icon">Icono</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    placeholder="🥇"
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

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pointsRequired">Puntos Requeridos *</Label>
                  <Input
                    id="pointsRequired"
                    type="number"
                    value={formData.pointsRequired}
                    onChange={(e) =>
                      setFormData({ ...formData, pointsRequired: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="order">Orden</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pointsMultiplier">Multiplicador de Puntos</Label>
                  <Input
                    id="pointsMultiplier"
                    type="number"
                    step="0.1"
                    value={formData.pointsMultiplier}
                    onChange={(e) =>
                      setFormData({ ...formData, pointsMultiplier: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountPercentage">Descuento (%)</Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    step="0.1"
                    value={formData.discountPercentage}
                    onChange={(e) =>
                      setFormData({ ...formData, discountPercentage: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <Label htmlFor="freeShipping">Envío Gratis</Label>
                  <Switch
                    id="freeShipping"
                    checked={formData.freeShipping}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, freeShipping: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <Label htmlFor="prioritySupport">Soporte Prioritario</Label>
                  <Switch
                    id="prioritySupport"
                    checked={formData.prioritySupport}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, prioritySupport: checked })
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
                ) : editingTier ? (
                  'Actualizar'
                ) : (
                  'Crear Nivel'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
