'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { locationsApi } from '@/lib/api/locations';
import { productsApi } from '@/lib/api/products';
import {
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Badge,
} from '@retail/ui';
import { Package, AlertCircle, TrendingDown } from 'lucide-react';

export function LocationInventoryView() {
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.getLocations({ status: 'ACTIVE' }),
  });

  const { data: inventoryData, isLoading } = useQuery({
    queryKey: ['location-inventory', selectedLocationId, searchTerm],
    queryFn: () =>
      selectedLocationId
        ? locationsApi.getLocationInventory(selectedLocationId, { search: searchTerm })
        : null,
    enabled: !!selectedLocationId,
  });

  const locations = locationsData || [];
  const inventory = inventoryData || [];

  const lowStockItems = inventory.filter(
    (item: any) => item.reorderPoint && item.quantity <= item.reorderPoint
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Inventario por Ubicación</h2>
        <p className="text-sm text-gray-600">
          Consulta el stock disponible en cada tienda
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ubicación</label>
              <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location: any) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} ({location.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar producto</label>
              <Input
                placeholder="Nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedLocationId ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Selecciona una ubicación</h3>
            <p className="text-gray-600">Elige una ubicación para ver su inventario</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="text-center py-12">Cargando inventario...</div>
      ) : (
        <>
          {/* Stats */}
          {lowStockItems > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                  <div>
                    <div className="font-semibold text-orange-900">
                      {lowStockItems} productos con stock bajo
                    </div>
                    <div className="text-sm text-orange-800">
                      Considera reabastecer o transferir stock
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory List */}
          {inventory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sin inventario</h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? 'No se encontraron productos'
                    : 'No hay productos en esta ubicación'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {inventory.map((item: any) => {
                const isLowStock =
                  item.reorderPoint && item.quantity <= item.reorderPoint;

                return (
                  <Card
                    key={item.id}
                    className={`hover:shadow-md transition-shadow ${
                      isLowStock ? 'border-orange-300' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{item.product?.name}</h3>
                            {isLowStock && (
                              <Badge className="bg-orange-100 text-orange-800">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                Stock Bajo
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-gray-600 mb-1">SKU:</div>
                              <div className="font-medium font-mono">
                                {item.product?.sku}
                              </div>
                            </div>

                            <div>
                              <div className="text-gray-600 mb-1">Cantidad:</div>
                              <div className="font-semibold text-lg">{item.quantity}</div>
                            </div>

                            <div>
                              <div className="text-gray-600 mb-1">Reservado:</div>
                              <div className="font-medium">{item.reservedQuantity}</div>
                            </div>

                            <div>
                              <div className="text-gray-600 mb-1">Disponible:</div>
                              <div className="font-semibold text-green-600">
                                {item.availableQuantity}
                              </div>
                            </div>
                          </div>

                          {item.aisle && (
                            <div className="mt-2 text-sm text-gray-600">
                              📍 Ubicación física:{' '}
                              <strong>
                                {item.aisle}
                                {item.shelf && `-${item.shelf}`}
                                {item.bin && `-${item.bin}`}
                              </strong>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
