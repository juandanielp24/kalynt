'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, Service } from '@/lib/api/appointments';
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
} from '@retail/ui';
import { Plus, Edit, Trash2, Power, Clock, DollarSign, Loader2 } from 'lucide-react';

export function ServicesManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    duration: '60',
    price: '',
    bufferBefore: '0',
    bufferAfter: '0',
    maxCapacity: '1',
    minAdvanceTime: '0',
    maxAdvanceTime: '',
    cancellationPolicy: '',
    cancellationDeadline: '24',
    category: '',
  });

  const { data: servicesData, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => appointmentsApi.getServices(),
  });

  const createMutation = useMutation({
    mutationFn: appointmentsApi.createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: 'Servicio creado correctamente' });
      handleCloseForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear el servicio',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      appointmentsApi.updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: 'Servicio actualizado correctamente' });
      handleCloseForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: appointmentsApi.deleteService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: 'Servicio eliminado correctamente' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message,
        variant: 'destructive',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: appointmentsApi.toggleServiceStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: 'Estado actualizado' });
    },
  });

  const services = servicesData?.data || [];

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || '',
      imageUrl: service.imageUrl || '',
      duration: service.duration.toString(),
      price: service.price.toString(),
      bufferBefore: service.bufferBefore.toString(),
      bufferAfter: service.bufferAfter.toString(),
      maxCapacity: service.maxCapacity.toString(),
      minAdvanceTime: service.minAdvanceTime.toString(),
      maxAdvanceTime: service.maxAdvanceTime?.toString() || '',
      cancellationPolicy: service.cancellationPolicy || '',
      cancellationDeadline: service.cancellationDeadline.toString(),
      category: service.category || '',
    });
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      duration: '60',
      price: '',
      bufferBefore: '0',
      bufferAfter: '0',
      maxCapacity: '1',
      minAdvanceTime: '0',
      maxAdvanceTime: '',
      cancellationPolicy: '',
      cancellationDeadline: '24',
      category: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      imageUrl: formData.imageUrl || undefined,
      duration: parseInt(formData.duration),
      price: parseFloat(formData.price),
      bufferBefore: parseInt(formData.bufferBefore),
      bufferAfter: parseInt(formData.bufferAfter),
      maxCapacity: parseInt(formData.maxCapacity),
      minAdvanceTime: parseInt(formData.minAdvanceTime),
      maxAdvanceTime: formData.maxAdvanceTime ? parseInt(formData.maxAdvanceTime) : undefined,
      cancellationPolicy: formData.cancellationPolicy || undefined,
      cancellationDeadline: parseInt(formData.cancellationDeadline),
      category: formData.category || undefined,
    };

    if (editingService) {
      updateMutation.mutate({ id: editingService.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este servicio?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Cargando servicios...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Servicios</h2>
          <p className="text-gray-600 text-sm">Configura los servicios reservables</p>
        </div>

        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Servicio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service: Service) => (
          <Card
            key={service.id}
            className={`hover:shadow-lg transition-shadow ${
              !service.isActive ? 'opacity-60' : ''
            }`}
          >
            <CardHeader className="pb-3">
              {service.imageUrl && (
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="w-full h-40 object-cover rounded-lg mb-3"
                />
              )}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{service.name}</CardTitle>
                  {service.category && (
                    <Badge variant="outline" className="mt-2">
                      {service.category}
                    </Badge>
                  )}
                </div>
                <Badge variant={service.isActive ? 'default' : 'secondary'}>
                  {service.isActive ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              {service.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Duración:
                  </span>
                  <span className="font-medium">{service.duration} min</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Precio:
                  </span>
                  <span className="font-semibold text-blue-600">${service.price}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Capacidad:</span>
                  <span className="font-medium">{service.maxCapacity}</span>
                </div>

                {service._count && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Citas:</span>
                    <span className="font-medium">{service._count.appointments}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleMutation.mutate(service.id)}
                  disabled={toggleMutation.isPending}
                  className="flex-1"
                >
                  <Power className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(service)}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(service.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Información Básica</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                    />
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

              {/* Duration & Pricing */}
              <div className="space-y-4">
                <h3 className="font-semibold">Duración y Precio</h3>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración (min) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Precio *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxCapacity">Capacidad Máx</Label>
                    <Input
                      id="maxCapacity"
                      type="number"
                      value={formData.maxCapacity}
                      onChange={(e) =>
                        setFormData({ ...formData, maxCapacity: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Buffers */}
              <div className="space-y-4">
                <h3 className="font-semibold">Buffers (minutos)</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bufferBefore">Buffer Antes</Label>
                    <Input
                      id="bufferBefore"
                      type="number"
                      value={formData.bufferBefore}
                      onChange={(e) =>
                        setFormData({ ...formData, bufferBefore: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bufferAfter">Buffer Después</Label>
                    <Input
                      id="bufferAfter"
                      type="number"
                      value={formData.bufferAfter}
                      onChange={(e) =>
                        setFormData({ ...formData, bufferAfter: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Advance Booking */}
              <div className="space-y-4">
                <h3 className="font-semibold">Reserva Anticipada (minutos)</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minAdvanceTime">Tiempo Mínimo</Label>
                    <Input
                      id="minAdvanceTime"
                      type="number"
                      value={formData.minAdvanceTime}
                      onChange={(e) =>
                        setFormData({ ...formData, minAdvanceTime: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxAdvanceTime">Tiempo Máximo</Label>
                    <Input
                      id="maxAdvanceTime"
                      type="number"
                      value={formData.maxAdvanceTime}
                      onChange={(e) =>
                        setFormData({ ...formData, maxAdvanceTime: e.target.value })
                      }
                      placeholder="Ilimitado"
                    />
                  </div>
                </div>
              </div>

              {/* Cancellation */}
              <div className="space-y-4">
                <h3 className="font-semibold">Política de Cancelación</h3>

                <div className="space-y-2">
                  <Label htmlFor="cancellationDeadline">
                    Plazo de Cancelación (horas)
                  </Label>
                  <Input
                    id="cancellationDeadline"
                    type="number"
                    value={formData.cancellationDeadline}
                    onChange={(e) =>
                      setFormData({ ...formData, cancellationDeadline: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cancellationPolicy">Texto de la Política</Label>
                  <Textarea
                    id="cancellationPolicy"
                    value={formData.cancellationPolicy}
                    onChange={(e) =>
                      setFormData({ ...formData, cancellationPolicy: e.target.value })
                    }
                    rows={3}
                    placeholder="Ej: Las cancelaciones deben realizarse con 24 horas de anticipación..."
                  />
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
                ) : editingService ? (
                  'Actualizar'
                ) : (
                  'Crear Servicio'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
