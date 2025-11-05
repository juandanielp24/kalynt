'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  appointmentsApi,
  Resource,
  ResourceType,
  RESOURCE_TYPE_LABELS,
  DAY_OF_WEEK_LABELS,
} from '@/lib/api/appointments';
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
} from '@retail/ui';
import { Plus, Edit, Trash2, Power, Clock, Loader2 } from 'lucide-react';

export function ResourcesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    type: ResourceType.STAFF,
    description: '',
    imageUrl: '',
    email: '',
    phone: '',
  });

  const { data: resourcesData, isLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: () => appointmentsApi.getResources(),
  });

  const createMutation = useMutation({
    mutationFn: appointmentsApi.createResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast({ title: 'Recurso creado correctamente' });
      handleCloseForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      appointmentsApi.updateResource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast({ title: 'Recurso actualizado correctamente' });
      handleCloseForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: appointmentsApi.deleteResource,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast({ title: 'Recurso eliminado correctamente' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: appointmentsApi.toggleResourceStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      toast({ title: 'Estado actualizado' });
    },
  });

  const resources = resourcesData?.data || [];

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      type: resource.type,
      description: resource.description || '',
      imageUrl: resource.imageUrl || '',
      email: resource.email || '',
      phone: resource.phone || '',
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingResource(null);
    setFormData({
      name: '',
      type: ResourceType.STAFF,
      description: '',
      imageUrl: '',
      email: '',
      phone: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      ...formData,
      description: formData.description || undefined,
      imageUrl: formData.imageUrl || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
    };

    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este recurso?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleManageAvailability = (resource: Resource) => {
    setSelectedResource(resource);
    setAvailabilityDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando recursos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Recursos</h2>
          <p className="text-gray-600 text-sm">
            Personal, salas y equipamiento reservable
          </p>
        </div>

        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Recurso
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource: Resource) => (
          <Card
            key={resource.id}
            className={`hover:shadow-lg transition-shadow ${
              !resource.isActive ? 'opacity-60' : ''
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{resource.name}</CardTitle>
                  <Badge variant="outline" className="mt-2">
                    {RESOURCE_TYPE_LABELS[resource.type]}
                  </Badge>
                </div>
                <Badge variant={resource.isActive ? 'default' : 'secondary'}>
                  {resource.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {resource.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {resource.description}
                </p>
              )}

              <div className="space-y-2 mb-4 text-sm">
                {resource.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium truncate ml-2">{resource.email}</span>
                  </div>
                )}

                {resource.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Teléfono:</span>
                    <span className="font-medium">{resource.phone}</span>
                  </div>
                )}

                {resource.availability && resource.availability.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horarios:</span>
                    <Badge variant="secondary">{resource.availability.length} días</Badge>
                  </div>
                )}

                {resource._count && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Citas:</span>
                    <span className="font-medium">{resource._count.appointments}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManageAvailability(resource)}
                  className="flex-1"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  Horarios
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMutation.mutate(resource.id)}
                  disabled={toggleMutation.isPending}
                >
                  <Power className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(resource)}
                >
                  <Edit className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(resource.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resource Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? 'Editar Recurso' : 'Nuevo Recurso'}
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
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Tipo *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: ResourceType) =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">URL de Imagen</Label>
                <Input
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                />
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
                ) : editingResource ? (
                  'Actualizar'
                ) : (
                  'Crear Recurso'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Availability Dialog */}
      {selectedResource && (
        <AvailabilityDialog
          resource={selectedResource}
          open={availabilityDialogOpen}
          onClose={() => {
            setAvailabilityDialogOpen(false);
            setSelectedResource(null);
          }}
        />
      )}
    </div>
  );
}

// Availability Dialog Component
function AvailabilityDialog({
  resource,
  open,
  onClose,
}: {
  resource: Resource;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [availability, setAvailability] = useState<
    Array<{ dayOfWeek: number; startTime: string; endTime: string }>
  >([]);

  const { data: availabilityData } = useQuery({
    queryKey: ['resource-availability', resource.id],
    queryFn: () => appointmentsApi.getResourceAvailability(resource.id),
    enabled: open,
  });

  useEffect(() => {
    if (availabilityData?.data) {
      setAvailability(
        availabilityData.data.map((av: any) => ({
          dayOfWeek: av.dayOfWeek,
          startTime: av.startTime,
          endTime: av.endTime,
        }))
      );
    }
  }, [availabilityData]);

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      appointmentsApi.setResourceAvailability(resource.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resource-availability'] });
      toast({ title: 'Disponibilidad actualizada correctamente' });
      onClose();
    },
  });

  const toggleDay = (dayOfWeek: number) => {
    const existing = availability.find((av) => av.dayOfWeek === dayOfWeek);
    if (existing) {
      setAvailability(availability.filter((av) => av.dayOfWeek !== dayOfWeek));
    } else {
      setAvailability([
        ...availability,
        { dayOfWeek, startTime: '09:00', endTime: '18:00' },
      ]);
    }
  };

  const updateTime = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(
      availability.map((av) =>
        av.dayOfWeek === dayOfWeek ? { ...av, [field]: value } : av
      )
    );
  };

  const handleSave = () => {
    saveMutation.mutate(availability);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Horarios de Disponibilidad - {resource.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
            const dayAvailability = availability.find((av) => av.dayOfWeek === dayOfWeek);
            const isActive = !!dayAvailability;

            return (
              <div key={dayOfWeek} className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex items-center gap-2 w-32">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => toggleDay(dayOfWeek)}
                    className="h-4 w-4"
                  />
                  <span className="font-medium">{DAY_OF_WEEK_LABELS[dayOfWeek]}</span>
                </div>

                {isActive && dayAvailability && (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={dayAvailability.startTime}
                      onChange={(e) =>
                        updateTime(dayOfWeek, 'startTime', e.target.value)
                      }
                      className="w-32"
                    />
                    <span>-</span>
                    <Input
                      type="time"
                      value={dayAvailability.endTime}
                      onChange={(e) => updateTime(dayOfWeek, 'endTime', e.target.value)}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Horarios'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
