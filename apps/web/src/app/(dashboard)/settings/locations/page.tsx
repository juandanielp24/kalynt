'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from '@/lib/api/locations';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  useToast,
} from '@retail/ui';
import { Plus, MapPin, Warehouse, Edit, Trash2, TrendingUp, Package } from 'lucide-react';
import { CreateLocationDialog } from '@/components/locations/CreateLocationDialog';
import { EditLocationDialog } from '@/components/locations/EditLocationDialog';

const LOCATION_TYPE_LABELS = {
  STORE: 'Tienda',
  WAREHOUSE: 'Depósito',
  OFFICE: 'Oficina',
  ONLINE: 'Online',
};

export default function LocationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: locationsData, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsApi.getLocations,
  });

  const deleteLocationMutation = useMutation({
    mutationFn: locationsApi.deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({
        title: 'Sucursal eliminada',
        description: 'La sucursal ha sido eliminada correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo eliminar la sucursal',
        variant: 'destructive',
      });
    },
  });

  const locations = locationsData?.data || [];

  const handleDelete = async (locationId: string) => {
    if (confirm('¿Estás seguro de eliminar esta sucursal?')) {
      await deleteLocationMutation.mutateAsync(locationId);
    }
  };

  const handleEdit = (location: any) => {
    setSelectedLocation(location);
    setIsEditOpen(true);
  };

  return (
    <ProtectedRoute>
      <PermissionGuard resource="LOCATIONS" action="READ">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Sucursales</h1>
              <p className="text-gray-600 mt-1">
                Gestiona las ubicaciones de tu negocio
              </p>
            </div>

            <PermissionGuard resource="LOCATIONS" action="CREATE">
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Sucursal
              </Button>
            </PermissionGuard>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Sucursales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {locations.filter((l: any) => l.isActive).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Tiendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {locations.filter((l: any) => l.type === 'STORE' && l.isActive).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Depósitos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {locations.filter((l: any) => l.isWarehouse && l.isActive).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Inactivas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {locations.filter((l: any) => !l.isActive).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Locations Grid */}
          {isLoading ? (
            <div className="text-center py-12">Cargando sucursales...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map((location: any) => (
                <Card key={location.id} className={!location.isActive ? 'opacity-60' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {location.isWarehouse ? (
                          <Warehouse className="h-5 w-5 text-primary" />
                        ) : (
                          <MapPin className="h-5 w-5 text-primary" />
                        )}
                        <div>
                          <CardTitle>{location.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1">
                            {location.code}
                          </Badge>
                        </div>
                      </div>
                      {!location.isActive && (
                        <Badge variant="destructive">Inactiva</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {LOCATION_TYPE_LABELS[location.type as keyof typeof LOCATION_TYPE_LABELS]}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      {/* Address */}
                      {location.address && (
                        <div className="text-sm text-gray-600">
                          <div>{location.address}</div>
                          <div>
                            {location.city}
                            {location.province && `, ${location.province}`}
                            {location.postalCode && ` ${location.postalCode}`}
                          </div>
                        </div>
                      )}

                      {/* Contact */}
                      {(location.phone || location.email) && (
                        <div className="text-sm text-gray-600">
                          {location.phone && <div>📞 {location.phone}</div>}
                          {location.email && <div>✉️ {location.email}</div>}
                        </div>
                      )}

                      {/* Manager */}
                      {location.manager && (
                        <div className="text-sm">
                          <span className="text-gray-600">Encargado: </span>
                          <span className="font-medium">{location.manager.name}</span>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 pt-2 border-t">
                        <div className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          <span>{location._count?.stock || 0} productos</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>{location._count?.sales || 0} ventas</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <PermissionGuard resource="LOCATIONS" action="UPDATE">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(location)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </PermissionGuard>

                        <PermissionGuard resource="LOCATIONS" action="DELETE">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(location.id)}
                            disabled={deleteLocationMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </PermissionGuard>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Create Dialog */}
          <CreateLocationDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
          />

          {/* Edit Dialog */}
          {selectedLocation && (
            <EditLocationDialog
              location={selectedLocation}
              open={isEditOpen}
              onOpenChange={setIsEditOpen}
            />
          )}
        </div>
      </PermissionGuard>
    </ProtectedRoute>
  );
}
