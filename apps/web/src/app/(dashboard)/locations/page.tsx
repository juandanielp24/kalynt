'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Store, Package, TrendingUp, Truck } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@retail/ui';
import { locationsApi, TransferStatus } from '@/lib/api/locations';
import { LocationsList } from '@/components/locations/LocationsList';
import { LocationForm } from '@/components/locations/LocationForm';
import { StockTransfersList } from '@/components/locations/StockTransfersList';
import { StockTransferForm } from '@/components/locations/StockTransferForm';
import { LocationInventoryView } from '@/components/locations/LocationInventoryView';
import { FranchiseManager } from '@/components/locations/FranchiseManager';

export default function LocationsPage() {
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Fetch locations for stats
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.getLocations(),
  });

  // Fetch transfers for stats
  const { data: transfers = [] } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => locationsApi.getTransfers(),
  });

  // Calculate stats
  const activeLocations = locations.filter((loc) => loc.isActive).length;

  const { data: totalInventoryValue = 0 } = useQuery({
    queryKey: ['inventory-valuation-total'],
    queryFn: async () => {
      const values = await Promise.all(
        locations.map(async (loc) => {
          try {
            const valuation = await locationsApi.getInventoryValuation(loc.id);
            return valuation?.totalValue || 0;
          } catch {
            return 0;
          }
        })
      );
      return values.reduce((sum, val) => sum + val, 0);
    },
    enabled: locations.length > 0,
  });

  const totalSKUs = locations.reduce((sum, loc) => sum + (loc._count?.inventory || 0), 0);
  const pendingTransfers = transfers.filter(
    (t) => t.status === TransferStatus.PENDING
  ).length;

  const handleEditLocation = (id: string) => {
    setSelectedLocationId(id);
    setShowLocationForm(true);
  };

  const handleCloseForm = () => {
    setShowLocationForm(false);
    setSelectedLocationId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ubicaciones</h1>
          <p className="text-muted-foreground">
            Gestiona tiendas, almacenes, franquicias y transferencias de stock
          </p>
        </div>
        <Button onClick={() => setShowLocationForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Ubicación
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ubicaciones Activas
            </CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLocations}</div>
            <p className="text-xs text-muted-foreground">
              {locations.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total Inventario
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalInventoryValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              En todas las ubicaciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              SKUs Totales
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSKUs}</div>
            <p className="text-xs text-muted-foreground">
              Registros de inventario
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transferencias Pendientes
            </CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTransfers}</div>
            <p className="text-xs text-muted-foreground">
              {transfers.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="locations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="locations">Ubicaciones</TabsTrigger>
          <TabsTrigger value="transfers">Transferencias</TabsTrigger>
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="franchises">Franquicias</TabsTrigger>
        </TabsList>

        <TabsContent value="locations" className="space-y-4">
          <LocationsList onEdit={handleEditLocation} />
        </TabsContent>

        <TabsContent value="transfers" className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold">Transferencias de Stock</h2>
              <p className="text-sm text-gray-600">
                Gestiona transferencias entre ubicaciones
              </p>
            </div>
            <Button onClick={() => setShowTransferForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Transferencia
            </Button>
          </div>
          <StockTransfersList />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <LocationInventoryView />
        </TabsContent>

        <TabsContent value="franchises" className="space-y-4">
          <FranchiseManager />
        </TabsContent>
      </Tabs>

      {/* Location Form Dialog */}
      {showLocationForm && (
        <LocationForm
          locationId={selectedLocationId}
          onClose={handleCloseForm}
        />
      )}

      {/* Stock Transfer Form Dialog */}
      {showTransferForm && (
        <StockTransferForm onClose={() => setShowTransferForm(false)} />
      )}
    </div>
  );
}
