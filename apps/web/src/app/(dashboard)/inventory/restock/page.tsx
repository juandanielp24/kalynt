'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '@/lib/api/locations';
import { useLocation } from '@/contexts/LocationContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
  Checkbox,
} from '@retail/ui';
import { AlertTriangle, Package, TrendingUp, Plus } from 'lucide-react';

export default function RestockPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentLocation, locations } = useLocation();
  const [selectedLocation, setSelectedLocation] = useState<string>(currentLocation?.id || '');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const { data: suggestionsData, isLoading } = useQuery({
    queryKey: ['restock-suggestions', selectedLocation],
    queryFn: () => locationsApi.getRestockSuggestions(selectedLocation),
    enabled: !!selectedLocation,
  });

  const createTransferMutation = useMutation({
    mutationFn: (data: any) => locationsApi.createTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      toast({
        title: 'Transferencias creadas',
        description: 'Las transferencias de reposición han sido creadas correctamente',
      });
      setSelectedProducts(new Set());
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudieron crear las transferencias',
        variant: 'destructive',
      });
    },
  });

  const suggestions = suggestionsData?.data || [];

  const handleToggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleCreateTransfers = () => {
    if (selectedProducts.size === 0) {
      toast({
        title: 'Error',
        description: 'Selecciona al menos un producto para crear transferencias',
        variant: 'destructive',
      });
      return;
    }

    // Group suggestions by source location
    const transfersBySource = new Map<string, any[]>();

    suggestions
      .filter((s: any) => selectedProducts.has(s.product.id))
      .forEach((suggestion: any) => {
        // Use the location with most stock as source
        const bestSource = suggestion.availableFrom[0];
        if (!bestSource) return;

        const sourceId = bestSource.location.id;
        if (!transfersBySource.has(sourceId)) {
          transfersBySource.set(sourceId, []);
        }

        transfersBySource.get(sourceId)!.push({
          productId: suggestion.product.id,
          quantityRequested: Math.min(suggestion.neededQuantity, bestSource.quantity),
          notes: `Reposición automática - Stock bajo`,
        });
      });

    // Create transfers for each source
    const promises = Array.from(transfersBySource.entries()).map(
      ([sourceId, items]) => {
        return createTransferMutation.mutateAsync({
          fromLocationId: sourceId,
          toLocationId: selectedLocation,
          items,
          notes: 'Transferencia generada automáticamente desde sugerencias de reposición',
          internalNotes: 'Reposición de stock bajo',
        });
      }
    );

    Promise.all(promises);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === suggestions.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(suggestions.map((s: any) => s.product.id)));
    }
  };

  return (
    <ProtectedRoute>
      <PermissionGuard resource="STOCK" action="READ">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Sugerencias de Reposición</h1>
              <p className="text-gray-600 mt-1">
                Productos con stock bajo que necesitan reposición
              </p>
            </div>

            {selectedProducts.size > 0 && (
              <PermissionGuard resource="STOCK_MOVEMENTS" action="CREATE">
                <Button onClick={handleCreateTransfers} disabled={createTransferMutation.isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Transferencias ({selectedProducts.size})
                </Button>
              </PermissionGuard>
            )}
          </div>

          {/* Location Selector */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Sucursal a Reabastecer
                  </label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sucursal" />
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
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          {!isLoading && suggestions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Productos con Stock Bajo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {suggestions.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Unidades Necesarias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {suggestions.reduce((sum: number, s: any) => sum + s.neededQuantity, 0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    Seleccionados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedProducts.size}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Suggestions List */}
          {isLoading ? (
            <div className="text-center py-12">Cargando sugerencias...</div>
          ) : suggestions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  ¡Todo en orden!
                </h3>
                <p className="text-gray-600">
                  No hay productos con stock bajo en esta sucursal
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Productos con Stock Bajo ({suggestions.length})
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                    {selectedProducts.size === suggestions.length
                      ? 'Deseleccionar todos'
                      : 'Seleccionar todos'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suggestions.map((suggestion: any) => (
                    <div
                      key={suggestion.product.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <PermissionGuard resource="STOCK_MOVEMENTS" action="CREATE">
                          <Checkbox
                            checked={selectedProducts.has(suggestion.product.id)}
                            onCheckedChange={() =>
                              handleToggleProduct(suggestion.product.id)
                            }
                            className="mt-1"
                          />
                        </PermissionGuard>

                        {/* Product Image */}
                        {suggestion.product.imageUrl && (
                          <img
                            src={suggestion.product.imageUrl}
                            alt={suggestion.product.name}
                            className="w-16 h-16 rounded object-cover"
                          />
                        )}

                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-semibold text-lg">
                                {suggestion.product.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                SKU: {suggestion.product.sku}
                              </p>
                            </div>
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Stock Bajo
                            </Badge>
                          </div>

                          {/* Stock Info */}
                          <div className="grid grid-cols-3 gap-4 mt-3">
                            <div>
                              <div className="text-xs text-gray-600">Stock Actual</div>
                              <div className="text-lg font-bold text-red-600">
                                {suggestion.currentStock}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Stock Mínimo</div>
                              <div className="text-lg font-bold">
                                {suggestion.minStock}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Cantidad Necesaria</div>
                              <div className="text-lg font-bold text-orange-600">
                                {suggestion.neededQuantity}
                              </div>
                            </div>
                          </div>

                          {/* Available Sources */}
                          {suggestion.availableFrom && suggestion.availableFrom.length > 0 && (
                            <div className="mt-4">
                              <div className="text-sm font-medium mb-2">
                                Disponible en:
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {suggestion.availableFrom.map((source: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2"
                                  >
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                    <span className="font-medium">
                                      {source.location.name}
                                    </span>
                                    <Badge variant="secondary">
                                      {source.quantity} unidades
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PermissionGuard>
    </ProtectedRoute>
  );
}
