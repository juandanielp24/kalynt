'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { locationsApi, LocationType } from '@/lib/api/locations';
import { usersApi } from '@/lib/api/users';
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
  useToast,
  Checkbox,
} from '@retail/ui';

interface CreateLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LOCATION_TYPES = [
  { value: 'STORE', label: 'Tienda' },
  { value: 'WAREHOUSE', label: 'Depósito' },
  { value: 'OFFICE', label: 'Oficina' },
  { value: 'ONLINE', label: 'Online' },
];

export function CreateLocationDialog({
  open,
  onOpenChange,
}: CreateLocationDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'STORE',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Argentina',
    phone: '',
    email: '',
    managerId: '',
    isWarehouse: false,
  });

  // Fetch users for manager dropdown
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.getUsers(),
    enabled: open,
  });

  const users = usersData?.data || [];

  const createLocationMutation = useMutation({
    mutationFn: locationsApi.createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      toast({
        title: 'Sucursal creada',
        description: 'La sucursal ha sido creada correctamente',
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.message || 'No se pudo crear la sucursal',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'STORE',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'Argentina',
      phone: '',
      email: '',
      managerId: '',
      isWarehouse: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.code.trim()) {
      toast({
        title: 'Error',
        description: 'El nombre y el código son obligatorios',
        variant: 'destructive',
      });
      return;
    }

    createLocationMutation.mutate({
      ...formData,
      type: formData.type as LocationType,
      managerId: formData.managerId || undefined,
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Sucursal</DialogTitle>
          <DialogDescription>
            Crea una nueva sucursal o ubicación para tu negocio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nombre <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Ej: Sucursal Centro"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">
                Código <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                placeholder="Ej: SUC-001"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager">Encargado</Label>
              <Select
                value={formData.managerId}
                onValueChange={(value) => handleChange('managerId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar encargado" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user: any) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Ej: Av. Corrientes 1234"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Ciudad</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Ej: Buenos Aires"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="province">Provincia</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => handleChange('province', e.target.value)}
                placeholder="Ej: CABA"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Código Postal</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                placeholder="Ej: 1043"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="Ej: +54 11 1234-5678"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Ej: sucursal@empresa.com"
              />
            </div>
          </div>

          {/* Additional Settings */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isWarehouse"
              checked={formData.isWarehouse}
              onCheckedChange={(checked) =>
                handleChange('isWarehouse', checked)
              }
            />
            <Label
              htmlFor="isWarehouse"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Esta ubicación es un depósito
            </Label>
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
            <Button type="submit" disabled={createLocationMutation.isPending}>
              {createLocationMutation.isPending ? 'Creando...' : 'Crear Sucursal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
