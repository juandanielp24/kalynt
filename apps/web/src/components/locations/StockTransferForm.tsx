'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { locationsApi, LocationStatus } from '@/lib/api/locations';
import { productsApi } from '@/lib/api/products';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  useToast,
  Input,
} from '@retail/ui';
import { Loader2, Plus, Trash2, Search } from 'lucide-react';

interface Props {
  onClose: () => void;
}

interface TransferItem {
  productId: string;
  variantId?: string;
  quantityRequested: number;
  notes?: string;
  productName?: string;
}

export function StockTransferForm({ onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1); // 1: Locations, 2: Items, 3: Review
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.getLocations({ status: LocationStatus.ACTIVE }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: () => productsApi.getProducts({ search: searchTerm }),
    enabled: step === 2 && searchTerm.length > 2,
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['location-inventory', fromLocationId],
    queryFn: () =>
      fromLocationId ? locationsApi.getLocationInventory(fromLocationId) : null,
    enabled: step === 2 && !!fromLocationId,
  });

  const createMutation = useMutation({
    mutationFn: locationsApi.createTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({ title: 'Transferencia creada correctamente' });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear',
        variant: 'destructive',
      });
    },
  });

  const locations = locationsData || [];
  const products = productsData?.data || [];
  const inventory = inventoryData || [];

  const handleAddItem = (product: any, variantId?: string) => {
    const existingItem = items.find(
      (item) => item.productId === product.id && item.variantId === variantId
    );

    if (existingItem) {
      toast({
        title: 'Item ya agregado',
        description: 'Este producto ya está en la lista',
        variant: 'destructive',
      });
      return;
    }

    // Check available inventory
    const inventoryItem = inventory.find(
      (inv: any) =>
        inv.productId === product.id &&
        (variantId ? inv.variantId === variantId : !inv.variantId)
    );

    if (!inventoryItem || inventoryItem.availableQuantity === 0) {
      toast({
        title: 'Sin stock disponible',
        description: 'Este producto no tiene stock disponible',
        variant: 'destructive',
      });
      return;
    }

    const newItem: TransferItem = {
      productId: product.id,
      variantId,
      quantityRequested: 1,
      productName: product.name,
    };

    setItems([...items, newItem]);
    setSearchTerm('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, quantity: number) => {
    const updatedItems = [...items];
    updatedItems[index].quantityRequested = quantity;
    setItems(updatedItems);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!fromLocationId || !toLocationId) {
        toast({
          title: 'Selecciona ubicaciones',
          variant: 'destructive',
        });
        return;
      }
      if (fromLocationId === toLocationId) {
        toast({
          title: 'Las ubicaciones deben ser diferentes',
          variant: 'destructive',
        });
        return;
      }
    }

    if (step === 2 && items.length === 0) {
      toast({
        title: 'Agrega al menos un producto',
        variant: 'destructive',
      });
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      fromLocationId,
      toLocationId,
      items: items.map((item) => ({
        productId: item.productId,
        quantityRequested: item.quantityRequested,
        notes: item.notes,
      })),
      notes,
    };

    createMutation.mutate(data);
  };

  const fromLocation = locations.find((l: any) => l.id === fromLocationId);
  const toLocation = locations.find((l: any) => l.id === toLocationId);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Transferencia de Stock</DialogTitle>
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded ${
                  s <= step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Select Locations */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Selecciona Ubicaciones</h3>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Ubicación Origen *</Label>
                    <Select value={fromLocationId} onValueChange={setFromLocationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar origen" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location: any) => (
                          <SelectItem
                            key={location.id}
                            value={location.id}
                            disabled={location.id === toLocationId}
                          >
                            {location.name} ({location.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ubicación Destino *</Label>
                    <Select value={toLocationId} onValueChange={setToLocationId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar destino" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location: any) => (
                          <SelectItem
                            key={location.id}
                            value={location.id}
                            disabled={location.id === fromLocationId}
                          >
                            {location.name} ({location.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {fromLocation && toLocation && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-900">
                      📦 Transferencia desde{' '}
                      <strong>{fromLocation.name}</strong> hacia{' '}
                      <strong>{toLocation.name}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select Items */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Agregar Productos</h3>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar productos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Search Results */}
                {searchTerm.length > 2 && products.length > 0 && (
                  <div className="mb-4 max-h-48 overflow-y-auto border rounded-lg">
                    {products.map((product: any) => {
                      const inventoryItem = inventory.find(
                        (inv: any) => inv.productId === product.id
                      );

                      return (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => handleAddItem(product)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-600">
                                SKU: {product.sku}
                              </div>
                            </div>
                            <div className="text-sm">
                              <span
                                className={
                                  inventoryItem?.availableQuantity > 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }
                              >
                                Stock: {inventoryItem?.availableQuantity || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected Items */}
                <div className="space-y-3">
                  <Label>Productos Seleccionados ({items.length})</Label>

                  {items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No hay productos seleccionados
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item, index) => {
                        const inventoryItem = inventory.find(
                          (inv: any) =>
                            inv.productId === item.productId &&
                            (item.variantId
                              ? inv.variantId === item.variantId
                              : !inv.variantId)
                        );

                        return (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{item.productName}</div>
                              <div className="text-sm text-gray-600">
                                Disponible: {inventoryItem?.availableQuantity || 0}
                              </div>
                            </div>

                            <Input
                              type="number"
                              min="1"
                              max={inventoryItem?.availableQuantity || 0}
                              value={item.quantityRequested}
                              onChange={(e) =>
                                handleUpdateQuantity(
                                  index,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-24"
                            />

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Revisar Transferencia</h3>

                {/* Locations */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 mb-1">Desde:</div>
                      <div className="font-semibold">{fromLocation?.name}</div>
                      <div className="text-gray-600">{fromLocation?.code}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 mb-1">Hacia:</div>
                      <div className="font-semibold">{toLocation?.name}</div>
                      <div className="text-gray-600">{toLocation?.code}</div>
                    </div>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="mb-6">
                  <Label className="mb-3 block">
                    Productos a Transferir ({items.length})
                  </Label>
                  <div className="border rounded-lg divide-y">
                    {items.map((item, index) => (
                      <div key={index} className="p-3 flex justify-between">
                        <div>
                          <div className="font-medium">{item.productName}</div>
                        </div>
                        <div className="font-semibold">
                          x{item.quantityRequested}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas (opcional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Agregar notas sobre esta transferencia..."
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Atrás
              </Button>
            )}

            {step < 3 ? (
              <Button type="button" onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Transferencia'
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
