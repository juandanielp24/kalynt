'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '@/lib/api/locations';
import { apiClient } from '@/lib/api-client';
import { useLocation } from '@/contexts/LocationContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  useToast,
} from '@retail/ui';
import { Trash2, Search } from 'lucide-react';
import { ProductSearchDialog } from '@/components/products/ProductSearchDialog';

interface TransferItem {
  productId: string;
  productName: string;
  productSku: string;
  quantityRequested: number;
  availableStock: number;
  notes?: string;
}

interface CreateTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTransferDialog({ open, onOpenChange }: CreateTransferDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentLocation, locations } = useLocation();

  const [formData, setFormData] = useState({
    fromLocationId: currentLocation?.id || '',
    toLocationId: '',
    shippingMethod: '',
    estimatedArrival: '',
    notes: '',
    internalNotes: '',
  });

  const [items, setItems] = useState<TransferItem[]>([]);
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);

  const createTransferMutation = useMutation({
    mutationFn: locationsApi.createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: 'Transferencia creada',
        description: 'La transferencia ha sido creada y está pendiente de aprobación',
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear la transferencia',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      fromLocationId: currentLocation?.id || '',
      toLocationId: '',
      shippingMethod: '',
      estimatedArrival: '',
      notes: '',
      internalNotes: '',
    });
    setItems([]);
  };

  const handleAddProduct = async (product: any) => {
    // Check if product already added
    if (items.some((item) => item.productId === product.id)) {
      toast({
        title: 'Producto ya agregado',
        description: 'Este producto ya está en la lista',
        variant: 'destructive',
      });
      return;
    }

    // Get stock at origin location
    try {
      const stockResponse = await apiClient.get(
        `/stock?productId=${product.id}&locationId=${formData.fromLocationId}`
      );
      const stock = stockResponse.data.data[0];
      const availableStock = stock?.quantity || 0;

      if (availableStock === 0) {
        toast({
          title: 'Sin stock',
          description: 'No hay stock disponible de este producto en la sucursal origen',
          variant: 'destructive',
        });
        return;
      }

      setItems([
        ...items,
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantityRequested: 1,
          availableStock,
          notes: '',
        },
      ]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo obtener el stock del producto',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveItem = (productId: string) => {
    setItems(items.filter((item) => item.productId !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setItems(
      items.map((item) =>
        item.productId === productId ? { ...item, quantityRequested: Math.max(1, quantity) } : item
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fromLocationId || !formData.toLocationId) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar la sucursal origen y destino',
        variant: 'destructive',
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes agregar al menos un producto a la transferencia',
        variant: 'destructive',
      });
      return;
    }

    // Validate quantities
    for (const item of items) {
      if (item.quantityRequested > item.availableStock) {
        toast({
          title: 'Stock insuficiente',
          description: `No hay suficiente stock de ${item.productName}. Disponible: ${item.availableStock}`,
          variant: 'destructive',
        });
        return;
      }
    }

    createTransferMutation.mutate({
      fromLocationId: formData.fromLocationId,
      toLocationId: formData.toLocationId,
      items: items.map((item) => ({
        productId: item.productId,
        quantityRequested: item.quantityRequested,
        notes: item.notes,
      })),
      shippingMethod: formData.shippingMethod || undefined,
      estimatedArrival: formData.estimatedArrival || undefined,
      notes: formData.notes || undefined,
      internalNotes: formData.internalNotes || undefined,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Transferencia de Stock</DialogTitle>
            <DialogDescription>
              Crea una solicitud de transferencia entre sucursales
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Locations */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromLocation">
                  Desde Sucursal <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.fromLocationId}
                  onValueChange={(value) => {
                    setFormData({ ...formData, fromLocationId: value });
                    setItems([]); // Clear items when changing origin
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location: any) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toLocation">
                  Hacia Sucursal <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.toLocationId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, toLocationId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations
                      .filter((l: any) => l.id !== formData.fromLocationId)
                      .map((location: any) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shippingMethod">Método de Envío</Label>
                <Input
                  id="shippingMethod"
                  value={formData.shippingMethod}
                  onChange={(e) => setFormData({ ...formData, shippingMethod: e.target.value })}
                  placeholder="ej: Correo, Transporte privado, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimatedArrival">Fecha Estimada de Llegada</Label>
                <Input
                  id="estimatedArrival"
                  type="date"
                  value={formData.estimatedArrival}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedArrival: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Products */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>
                  Productos <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProductSearchOpen(true)}
                  disabled={!formData.fromLocationId}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Producto
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <p className="text-gray-600">No hay productos agregados</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Haz clic en "Buscar Producto" para agregar items
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg divide-y">
                  {items.map((item) => (
                    <div key={item.productId} className="p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{item.productName}</h4>
                          <p className="text-sm text-gray-600">SKU: {item.productSku}</p>
                          <p className="text-sm text-gray-600">
                            Stock disponible: {item.availableStock}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>
                            Cantidad <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            max={item.availableStock}
                            value={item.quantityRequested}
                            onChange={(e) =>
                              handleUpdateQuantity(
                                item.productId,
                                parseInt(e.target.value) || 0
                              )
                            }
                          />
                        </div>
                        <div>
                          <Label>Notas</Label>
                          <Input
                            value={item.notes || ''}
                            onChange={(e) =>
                              setItems(
                                items.map((i) =>
                                  i.productId === item.productId
                                    ? { ...i, notes: e.target.value }
                                    : i
                                )
                              )
                            }
                            placeholder="Opcional"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Información adicional sobre la transferencia"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="internalNotes">Notas Internas</Label>
              <Textarea
                id="internalNotes"
                value={formData.internalNotes}
                onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                placeholder="Notas visibles solo para el personal interno"
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createTransferMutation.isPending ||
                  !formData.fromLocationId ||
                  !formData.toLocationId ||
                  items.length === 0
                }
              >
                {createTransferMutation.isPending
                  ? 'Creando...'
                  : 'Crear Transferencia'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Product Search Dialog */}
      <ProductSearchDialog
        open={isProductSearchOpen}
        onOpenChange={setIsProductSearchOpen}
        onSelect={handleAddProduct}
      />
    </>
  );
}
