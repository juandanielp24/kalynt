'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loyaltyApi, LoyaltyReward, RewardType, REWARD_TYPE_LABELS, LoyaltyTier } from '@/lib/api/loyalty';
import { productsApi, Product } from '@/lib/api/products';
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
  Gift,
  Image as ImageIcon,
  BarChart3,
  Loader2,
  Star,
} from 'lucide-react';

interface Props {
  programId: string;
}

export function RewardsManager({ programId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [viewingStats, setViewingStats] = useState<LoyaltyReward | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    pointsCost: '',
    type: RewardType.DISCOUNT_PERCENTAGE,
    value: '',
    productId: '',
    stock: '',
    requiredTierId: '',
    validDays: '',
  });

  const { data: rewardsData, isLoading } = useQuery({
    queryKey: ['loyalty-rewards', programId],
    queryFn: () => loyaltyApi.getRewards(programId),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getProducts(),
  });

  const { data: tiersData } = useQuery({
    queryKey: ['loyalty-tiers', programId],
    queryFn: () => loyaltyApi.getTiers(programId),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => loyaltyApi.createReward(programId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-rewards', programId] });
      toast({ title: 'Recompensa creada correctamente' });
      handleCloseForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear la recompensa',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      loyaltyApi.updateReward(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-rewards', programId] });
      toast({ title: 'Recompensa actualizada correctamente' });
      handleCloseForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar la recompensa',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: loyaltyApi.deleteReward,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-rewards', programId] });
      toast({ title: 'Recompensa eliminada correctamente' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo eliminar la recompensa',
        variant: 'destructive',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: loyaltyApi.toggleRewardStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-rewards', programId] });
      toast({ title: 'Estado actualizado' });
    },
  });

  const rewards = rewardsData?.data || [];
  const products = productsData?.data || [];
  const tiers = tiersData?.data || [];

  const handleEdit = (reward: LoyaltyReward) => {
    setEditingReward(reward);
    setFormData({
      name: reward.name,
      description: reward.description,
      imageUrl: reward.imageUrl || '',
      pointsCost: reward.pointsCost.toString(),
      type: reward.type,
      value: reward.value?.toString() || '',
      productId: reward.productId || '',
      stock: reward.stock?.toString() || '',
      requiredTierId: reward.requiredTierId || '',
      validDays: reward.validDays?.toString() || '',
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingReward(null);
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      pointsCost: '',
      type: RewardType.DISCOUNT_PERCENTAGE,
      value: '',
      productId: '',
      stock: '',
      requiredTierId: '',
      validDays: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      description: formData.description,
      imageUrl: formData.imageUrl || undefined,
      pointsCost: parseInt(formData.pointsCost),
      type: formData.type,
      value: formData.value ? parseFloat(formData.value) : undefined,
      productId: formData.productId || undefined,
      stock: formData.stock ? parseInt(formData.stock) : undefined,
      requiredTierId: formData.requiredTierId || undefined,
      validDays: formData.validDays ? parseInt(formData.validDays) : undefined,
    };

    if (editingReward) {
      updateMutation.mutate({ id: editingReward.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta recompensa?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando recompensas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Catálogo de Recompensas</h2>
          <p className="text-gray-600 text-sm">
            Productos y beneficios canjeables con puntos
          </p>
        </div>

        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Recompensa
        </Button>
      </div>

      {rewards.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay recompensas</h3>
            <p className="text-gray-600 mb-4">
              Crea recompensas para que los clientes puedan canjear sus puntos
            </p>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Primera Recompensa
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward: LoyaltyReward) => (
            <Card
              key={reward.id}
              className={`hover:shadow-lg transition-shadow ${
                !reward.isActive ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-3">
                {reward.imageUrl ? (
                  <img
                    src={reward.imageUrl}
                    alt={reward.name}
                    className="w-full h-40 object-cover rounded-lg mb-2"
                  />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-2 flex items-center justify-center">
                    <Gift className="h-16 w-16 text-purple-600" />
                  </div>
                )}

                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">{reward.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={reward.isActive ? 'default' : 'secondary'}>
                        {reward.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <Badge variant="outline">
                        {REWARD_TYPE_LABELS[reward.type]}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {reward.description}
                </p>

                <div className="bg-purple-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Costo</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 text-purple-600 fill-purple-600" />
                      <span className="text-xl font-bold text-purple-600">
                        {reward.pointsCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  {reward.value && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor:</span>
                      <span className="font-medium">
                        {reward.type === RewardType.DISCOUNT_PERCENTAGE
                          ? `${reward.value}%`
                          : `$${reward.value}`}
                      </span>
                    </div>
                  )}

                  {reward.stock !== null && reward.stock !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stock:</span>
                      <Badge variant={reward.stock > 0 ? 'secondary' : 'destructive'}>
                        {reward.stock}
                      </Badge>
                    </div>
                  )}

                  {reward.requiredTier && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nivel requerido:</span>
                      <Badge
                        variant="secondary"
                        style={{ backgroundColor: reward.requiredTier.color }}
                      >
                        {reward.requiredTier.name}
                      </Badge>
                    </div>
                  )}

                  {reward.validDays && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Validez:</span>
                      <span className="font-medium">{reward.validDays} días</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-600">Canjes:</span>
                    <span className="font-medium">
                      {reward._count?.redemptions || 0}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingStats(reward)}
                    className="flex-1"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleMutation.mutate(reward.id)}
                    disabled={toggleMutation.isPending}
                  >
                    <Power className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(reward)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(reward.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reward Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReward ? 'Editar Recompensa' : 'Nueva Recompensa'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: 20% de Descuento"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe la recompensa..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL de Imagen</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pointsCost">Costo en Puntos *</Label>
                  <Input
                    id="pointsCost"
                    type="number"
                    value={formData.pointsCost}
                    onChange={(e) =>
                      setFormData({ ...formData, pointsCost: e.target.value })
                    }
                    placeholder="500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: RewardType) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REWARD_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(formData.type === RewardType.DISCOUNT_PERCENTAGE ||
                formData.type === RewardType.DISCOUNT_FIXED ||
                formData.type === RewardType.STORE_CREDIT) && (
                <div className="space-y-2">
                  <Label htmlFor="value">
                    Valor{' '}
                    {formData.type === RewardType.DISCOUNT_PERCENTAGE ? '(%)' : '($)'}
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) =>
                      setFormData({ ...formData, value: e.target.value })
                    }
                    placeholder={
                      formData.type === RewardType.DISCOUNT_PERCENTAGE ? '20' : '500'
                    }
                  />
                </div>
              )}

              {formData.type === RewardType.FREE_PRODUCT && products.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="productId">Producto</Label>
                  <Select
                    value={formData.productId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, productId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: Product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock (opcional)</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    placeholder="Ilimitado"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validDays">Días Válidos</Label>
                  <Input
                    id="validDays"
                    type="number"
                    value={formData.validDays}
                    onChange={(e) =>
                      setFormData({ ...formData, validDays: e.target.value })
                    }
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requiredTierId">Nivel Requerido</Label>
                  <Select
                    value={formData.requiredTierId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, requiredTierId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Cualquiera" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Cualquier nivel</SelectItem>
                      {tiers.map((tier: LoyaltyTier) => (
                        <SelectItem key={tier.id} value={tier.id}>
                          {tier.icon} {tier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                ) : editingReward ? (
                  'Actualizar'
                ) : (
                  'Crear Recompensa'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      {viewingStats && (
        <RewardStatsDialog
          reward={viewingStats}
          onClose={() => setViewingStats(null)}
        />
      )}
    </div>
  );
}

// Reward Stats Dialog Component
function RewardStatsDialog({
  reward,
  onClose,
}: {
  reward: LoyaltyReward;
  onClose: () => void;
}) {
  const { data: statsData, isLoading } = useQuery({
    queryKey: ['reward-stats', reward.id],
    queryFn: () => loyaltyApi.getRewardStatistics(reward.id),
  });

  const stats = statsData?.data;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Estadísticas - {reward.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-12">Cargando estadísticas...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600">Total Canjes</div>
                  <div className="text-2xl font-bold">{stats?.totalRedemptions}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600">Pendientes</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {stats?.pendingRedemptions}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600">Usados</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats?.usedRedemptions}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-gray-600">Puntos Totales</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats?.totalPointsCost?.toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            </div>

            {stats?.topRedeemers && stats.topRedeemers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Top Canjeadores</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.topRedeemers.map((redeemer: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center gap-3">
                          <div className="font-semibold text-gray-600">
                            #{index + 1}
                          </div>
                          <div>
                            <div className="font-medium">
                              {redeemer.member?.customer?.name || 'Cliente'}
                            </div>
                            <div className="text-sm text-gray-600">
                              {redeemer.redemptions} canjes
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
