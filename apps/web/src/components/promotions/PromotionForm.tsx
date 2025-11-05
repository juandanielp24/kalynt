'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import {
  promotionsApi,
  Promotion,
  PromotionType,
  DiscountType,
  PROMOTION_TYPE_LABELS,
  DISCOUNT_TYPE_LABELS,
} from '@/lib/api/promotions';
import { productsApi } from '@/lib/api/products';
import { categoriesApi } from '@/lib/api/categories';
import { locationsApi } from '@/lib/api/locations';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  useToast,
  Badge,
} from '@retail/ui';
import { Loader2, X } from 'lucide-react';

interface Props {
  promotion?: Promotion | null;
  onClose: () => void;
}

export function PromotionForm({ promotion, onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    type: 'COUPON' as PromotionType,
    discountType: 'PERCENTAGE' as DiscountType,
    discountValue: '',
    startDate: '',
    endDate: '',
    maxUses: '',
    maxUsesPerCustomer: '',
    minPurchaseAmount: '',
    maxDiscountAmount: '',
    applicableToAll: true,
    applicableProducts: [] as string[],
    applicableCategories: [] as string[],
    excludedProducts: [] as string[],
    applicableLocations: [] as string[],
    applicableToNewCustomers: false,
    applicableToReturningCustomers: false,
    canStackWithOthers: false,
    priority: '0',
    autoApply: false,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.getProducts(),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getCategories(),
  });

  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.getLocations(),
  });

  useEffect(() => {
    if (promotion) {
      setFormData({
        name: promotion.name,
        description: promotion.description || '',
        code: promotion.code || '',
        type: promotion.type,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue.toString(),
        startDate: promotion.startDate.split('T')[0],
        endDate: promotion.endDate.split('T')[0],
        maxUses: promotion.maxUses?.toString() || '',
        maxUsesPerCustomer: promotion.maxUsesPerCustomer?.toString() || '',
        minPurchaseAmount: promotion.minPurchaseAmount?.toString() || '',
        maxDiscountAmount: promotion.maxDiscountAmount?.toString() || '',
        applicableToAll: promotion.applicableToAll,
        applicableProducts: (promotion.applicableProducts as string[]) || [],
        applicableCategories: (promotion.applicableCategories as string[]) || [],
        excludedProducts: (promotion.excludedProducts as string[]) || [],
        applicableLocations: (promotion.applicableLocations as string[]) || [],
        applicableToNewCustomers: promotion.applicableToNewCustomers,
        applicableToReturningCustomers: promotion.applicableToReturningCustomers,
        canStackWithOthers: promotion.canStackWithOthers,
        priority: promotion.priority.toString(),
        autoApply: promotion.autoApply,
      });
    }
  }, [promotion]);

  const createMutation = useMutation({
    mutationFn: promotionsApi.createPromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast({
        title: 'Promoción creada',
        description: 'La promoción se creó correctamente',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear la promoción',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      promotionsApi.updatePromotion(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast({
        title: 'Promoción actualizada',
        description: 'La promoción se actualizó correctamente',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar la promoción',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      code: formData.code || undefined,
      type: formData.type,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
      maxUsesPerCustomer: formData.maxUsesPerCustomer
        ? parseInt(formData.maxUsesPerCustomer)
        : undefined,
      minPurchaseAmount: formData.minPurchaseAmount
        ? parseFloat(formData.minPurchaseAmount)
        : undefined,
      maxDiscountAmount: formData.maxDiscountAmount
        ? parseFloat(formData.maxDiscountAmount)
        : undefined,
      applicableToAll: formData.applicableToAll,
      applicableProducts:
        formData.applicableProducts.length > 0 ? formData.applicableProducts : undefined,
      applicableCategories:
        formData.applicableCategories.length > 0
          ? formData.applicableCategories
          : undefined,
      excludedProducts:
        formData.excludedProducts.length > 0 ? formData.excludedProducts : undefined,
      applicableLocations:
        formData.applicableLocations.length > 0 ? formData.applicableLocations : undefined,
      applicableToNewCustomers: formData.applicableToNewCustomers,
      applicableToReturningCustomers: formData.applicableToReturningCustomers,
      canStackWithOthers: formData.canStackWithOthers,
      priority: parseInt(formData.priority),
      autoApply: formData.autoApply,
    };

    if (promotion) {
      updateMutation.mutate({ id: promotion.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const products = productsData?.data || [];
  const categories = categoriesData?.data || [];
  const locations = locationsData?.data || [];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {promotion ? 'Editar Promoción' : 'Nueva Promoción'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Información Básica</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Descuento de Verano"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe la promoción..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: PromotionType) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROMOTION_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'COUPON' && (
                  <div className="space-y-2">
                    <Label htmlFor="code">Código (opcional)</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      placeholder="Ej: VERANO2024"
                    />
                    <p className="text-xs text-gray-600">
                      Deja vacío para generar cupones únicos
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Discount Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold">Configuración del Descuento</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Tipo de Descuento *</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value: DiscountType) =>
                      setFormData({ ...formData, discountType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DISCOUNT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">Valor *</Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: e.target.value })
                    }
                    placeholder={
                      formData.discountType === 'PERCENTAGE' ? 'Ej: 20' : 'Ej: 500'
                    }
                    required
                  />
                  <p className="text-xs text-gray-600">
                    {formData.discountType === 'PERCENTAGE'
                      ? 'Porcentaje de descuento'
                      : 'Monto en pesos'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPurchaseAmount">Compra Mínima ($)</Label>
                  <Input
                    id="minPurchaseAmount"
                    type="number"
                    step="0.01"
                    value={formData.minPurchaseAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, minPurchaseAmount: e.target.value })
                    }
                  />
                </div>

                {formData.discountType === 'PERCENTAGE' && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscountAmount">Descuento Máximo ($)</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      step="0.01"
                      value={formData.maxDiscountAmount}
                      onChange={(e) =>
                        setFormData({ ...formData, maxDiscountAmount: e.target.value })
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Validity Period */}
            <div className="space-y-4">
              <h3 className="font-semibold">Período de Validez</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha Inicio *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha Fin *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            {/* Usage Limits */}
            <div className="space-y-4">
              <h3 className="font-semibold">Límites de Uso</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Usos Máximos Totales</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="Ilimitado"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxUsesPerCustomer">Usos por Cliente</Label>
                  <Input
                    id="maxUsesPerCustomer"
                    type="number"
                    value={formData.maxUsesPerCustomer}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUsesPerCustomer: e.target.value })
                    }
                    placeholder="Ilimitado"
                  />
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold">Configuración Avanzada</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <Label>Aplicar a Todos los Productos</Label>
                    <p className="text-xs text-gray-600">
                      Si está desactivado, elige productos/categorías específicos
                    </p>
                  </div>
                  <Switch
                    checked={formData.applicableToAll}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, applicableToAll: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <Label>Auto-Aplicar</Label>
                    <p className="text-xs text-gray-600">
                      Aplicar automáticamente sin código
                    </p>
                  </div>
                  <Switch
                    checked={formData.autoApply}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, autoApply: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <Label>Permitir Apilamiento</Label>
                    <p className="text-xs text-gray-600">
                      Puede combinarse con otras promociones
                    </p>
                  </div>
                  <Switch
                    checked={formData.canStackWithOthers}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, canStackWithOthers: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Input
                  id="priority"
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                />
                <p className="text-xs text-gray-600">
                  Mayor número = mayor prioridad de aplicación
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
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
              ) : promotion ? (
                'Actualizar'
              ) : (
                'Crear Promoción'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
