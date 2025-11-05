'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X } from 'lucide-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useToast,
} from '@retail/ui';
import {
  locationsApi,
  LocationType,
  LocationStatus,
  LOCATION_TYPE_LABELS,
  LOCATION_STATUS_LABELS,
} from '@/lib/api/locations';

const locationFormSchema = z.object({
  // Basic Info
  code: z.string().min(1, 'El código es requerido'),
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.nativeEnum(LocationType),
  status: z.nativeEnum(LocationStatus).optional(),
  isActive: z.boolean().default(true),

  // Address
  address: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),

  // Contact
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),

  // Configuration
  isWarehouse: z.boolean().default(false),
  maxCapacity: z.coerce.number().optional(),
  squareMeters: z.string().optional(),

  // Relations
  franchiseId: z.string().optional(),
  parentId: z.string().optional(),
  managerId: z.string().optional(),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

interface LocationFormProps {
  locationId?: string | null;
  onClose: () => void;
}

export function LocationForm({ locationId, onClose }: LocationFormProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const isEditing = !!locationId;

  // Fetch location data if editing
  const { data: location, isLoading: isLoadingLocation } = useQuery({
    queryKey: ['location', locationId],
    queryFn: () => locationsApi.getLocation(locationId!),
    enabled: isEditing,
  });

  // Fetch franchises for dropdown
  const { data: franchises = [] } = useQuery({
    queryKey: ['franchises'],
    queryFn: () => locationsApi.getFranchises(true),
  });

  // Fetch locations for parent dropdown
  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationsApi.getLocations(),
  });

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      code: '',
      name: '',
      type: LocationType.STORE,
      status: LocationStatus.PLANNING,
      isActive: true,
      isWarehouse: false,
    },
  });

  // Update form when location data loads
  useEffect(() => {
    if (location && isEditing) {
      form.reset({
        code: location.code,
        name: location.name,
        type: location.type,
        status: location.status,
        isActive: location.isActive,
        address: location.address || '',
        city: location.city || '',
        province: location.province || '',
        country: location.country || '',
        postalCode: location.postalCode || '',
        latitude: location.latitude || '',
        longitude: location.longitude || '',
        phone: location.phone || '',
        email: location.email || '',
        isWarehouse: location.isWarehouse || false,
        maxCapacity: location.maxCapacity,
        squareMeters: location.squareMeters || '',
        franchiseId: location.franchiseId || '',
        parentId: location.parentId || '',
        managerId: location.managerId || '',
      });
    }
  }, [location, isEditing, form]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: LocationFormValues) => locationsApi.createLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({
        title: 'Ubicación creada',
        description: 'La ubicación ha sido creada correctamente.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al crear la ubicación',
        variant: 'destructive',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: LocationFormValues) =>
      locationsApi.updateLocation(locationId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.invalidateQueries({ queryKey: ['location', locationId] });
      toast({
        title: 'Ubicación actualizada',
        description: 'La ubicación ha sido actualizada correctamente.',
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al actualizar la ubicación',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: LocationFormValues) => {
    // Clean empty strings
    const cleanedData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value === '') {
        return acc;
      }
      return { ...acc, [key]: value };
    }, {} as LocationFormValues);

    if (isEditing) {
      updateMutation.mutate(cleanedData);
    } else {
      createMutation.mutate(cleanedData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Ubicación' : 'Nueva Ubicación'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Actualiza la información de la ubicación.'
              : 'Completa el formulario para crear una nueva ubicación.'}
          </DialogDescription>
        </DialogHeader>

        {isLoadingLocation ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="address">Dirección</TabsTrigger>
                  <TabsTrigger value="contact">Contacto</TabsTrigger>
                  <TabsTrigger value="config">Configuración</TabsTrigger>
                  <TabsTrigger value="relations">Relaciones</TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value="basic" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código *</FormLabel>
                        <FormControl>
                          <Input placeholder="LOC-001" {...field} />
                        </FormControl>
                        <FormDescription>
                          Código único de identificación
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input placeholder="Tienda Centro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(LocationType).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {LOCATION_TYPE_LABELS[type]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecciona un estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(LocationStatus).map((status) => (
                                <SelectItem key={status} value={status}>
                                  {LOCATION_STATUS_LABELS[status]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Activa</FormLabel>
                          <FormDescription>
                            Ubicación operativa y disponible
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Address Tab */}
                <TabsContent value="address" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dirección</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Calle Principal 123"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciudad</FormLabel>
                          <FormControl>
                            <Input placeholder="Buenos Aires" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Provincia/Estado</FormLabel>
                          <FormControl>
                            <Input placeholder="CABA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>País</FormLabel>
                          <FormControl>
                            <Input placeholder="Argentina" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="postalCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Código Postal</FormLabel>
                          <FormControl>
                            <Input placeholder="C1000" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitud</FormLabel>
                          <FormControl>
                            <Input placeholder="-34.6037" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitud</FormLabel>
                          <FormControl>
                            <Input placeholder="-58.3816" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Contact Tab */}
                <TabsContent value="contact" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input placeholder="+54 11 1234-5678" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="tienda@ejemplo.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Configuration Tab */}
                <TabsContent value="config" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="isWarehouse"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Es Almacén
                          </FormLabel>
                          <FormDescription>
                            Ubicación utilizada como almacén
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="maxCapacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacidad Máxima</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="100"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Personas/Unidades
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="squareMeters"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Metros Cuadrados</FormLabel>
                          <FormControl>
                            <Input placeholder="150" {...field} />
                          </FormControl>
                          <FormDescription>m²</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Relations Tab */}
                <TabsContent value="relations" className="space-y-4">
                  <FormField
                    control={form.control}
                    name="franchiseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Franquicia</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sin franquicia" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Sin franquicia</SelectItem>
                            {franchises.map((franchise: any) => (
                              <SelectItem key={franchise.id} value={franchise.id}>
                                {franchise.name} ({franchise.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Asociar a una franquicia
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ubicación Padre</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sin ubicación padre" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Sin ubicación padre</SelectItem>
                            {locations
                              .filter((loc: any) => loc.id !== locationId)
                              .map((location: any) => (
                                <SelectItem key={location.id} value={location.id}>
                                  {location.name} ({location.code})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Para jerarquía de ubicaciones
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading
                    ? 'Guardando...'
                    : isEditing
                      ? 'Actualizar'
                      : 'Crear'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
