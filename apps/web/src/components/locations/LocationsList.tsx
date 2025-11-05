'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  Package,
  Users,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Badge,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  useToast,
} from '@retail/ui';
import {
  locationsApi,
  Location,
  LocationType,
  LocationStatus,
  LOCATION_TYPE_LABELS,
  LOCATION_STATUS_LABELS,
} from '@/lib/api/locations';

interface LocationsListProps {
  onEdit: (id: string) => void;
}

export function LocationsList({ onEdit }: LocationsListProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch locations
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations', typeFilter, statusFilter],
    queryFn: () =>
      locationsApi.getLocations({
        type: typeFilter !== 'all' ? (typeFilter as LocationType) : undefined,
        status: statusFilter !== 'all' ? (statusFilter as LocationStatus) : undefined,
      }),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => locationsApi.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({
        title: 'Ubicación eliminada',
        description: 'La ubicación ha sido eliminada correctamente.',
      });
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al eliminar la ubicación',
        variant: 'destructive',
      });
    },
  });

  // Filter locations by search
  const filteredLocations = locations.filter((location) => {
    const searchLower = search.toLowerCase();
    return (
      location.name.toLowerCase().includes(searchLower) ||
      location.code.toLowerCase().includes(searchLower) ||
      location.city?.toLowerCase().includes(searchLower) ||
      location.address?.toLowerCase().includes(searchLower)
    );
  });

  const handleDelete = (location: Location) => {
    setLocationToDelete(location);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (locationToDelete) {
      deleteMutation.mutate(locationToDelete.id);
    }
  };

  const getStatusColor = (status?: LocationStatus) => {
    switch (status) {
      case LocationStatus.ACTIVE:
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20';
      case LocationStatus.TEMPORARILY_CLOSED:
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20';
      case LocationStatus.CLOSED:
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20';
      case LocationStatus.CONSTRUCTION:
        return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20';
      case LocationStatus.PLANNING:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20';
    }
  };

  const getTypeIcon = (type: LocationType) => {
    switch (type) {
      case LocationType.STORE:
      case LocationType.FRANCHISE:
        return <Building2 className="h-4 w-4" />;
      case LocationType.WAREHOUSE:
        return <Package className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded"></div>
                <div className="h-3 bg-muted rounded w-5/6"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ubicaciones..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {Object.values(LocationType).map((type) => (
                <SelectItem key={type} value={type}>
                  {LOCATION_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.values(LocationStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {LOCATION_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Locations Grid */}
      {filteredLocations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay ubicaciones</h3>
            <p className="text-sm text-muted-foreground text-center">
              {search || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No se encontraron ubicaciones con los filtros aplicados.'
                : 'Comienza creando tu primera ubicación.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLocations.map((location) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(location.type)}
                    <CardTitle className="text-base">{location.name}</CardTitle>
                  </div>
                  <p className="text-xs text-muted-foreground">{location.code}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onEdit(location.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(location)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">
                    {LOCATION_TYPE_LABELS[location.type]}
                  </Badge>
                  {location.status && (
                    <Badge className={getStatusColor(location.status)}>
                      {LOCATION_STATUS_LABELS[location.status]}
                    </Badge>
                  )}
                  {!location.isActive && (
                    <Badge variant="destructive">Inactiva</Badge>
                  )}
                </div>

                {location.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground line-clamp-2">
                      {location.address}
                      {location.city && `, ${location.city}`}
                    </span>
                  </div>
                )}

                {location.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{location.phone}</span>
                  </div>
                )}

                {location.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground truncate">
                      {location.email}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>{location._count?.inventory || 0} SKUs</span>
                    </div>
                    {location._count?.userLocations !== undefined && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{location._count.userLocations} usuarios</span>
                      </div>
                    )}
                  </div>
                </div>

                {location.manager && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <span className="font-medium">Gerente:</span> {location.manager.name}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la ubicación{' '}
              <span className="font-semibold">{locationToDelete?.name}</span>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
