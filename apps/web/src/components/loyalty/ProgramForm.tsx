'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loyaltyApi, LoyaltyProgram } from '@/lib/api/loyalty';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  useToast,
} from '@retail/ui';
import { Loader2 } from 'lucide-react';

interface Props {
  program?: LoyaltyProgram | null;
  onClose: () => void;
}

export function ProgramForm({ program, onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsPerAmount: '1',
    minimumPurchase: '0',
    pointsExpireDays: '',
    pointsValue: '0.01',
    minimumRedemption: '100',
    welcomePoints: '100',
    birthdayPoints: '50',
    referralPoints: '100',
    refereePoints: '50',
  });

  useEffect(() => {
    if (program) {
      setFormData({
        name: program.name,
        description: program.description || '',
        pointsPerAmount: program.pointsPerAmount.toString(),
        minimumPurchase: program.minimumPurchase.toString(),
        pointsExpireDays: program.pointsExpireDays?.toString() || '',
        pointsValue: program.pointsValue.toString(),
        minimumRedemption: program.minimumRedemption.toString(),
        welcomePoints: program.welcomePoints.toString(),
        birthdayPoints: program.birthdayPoints.toString(),
        referralPoints: program.referralPoints.toString(),
        refereePoints: program.refereePoints.toString(),
      });
    }
  }, [program]);

  const createMutation = useMutation({
    mutationFn: loyaltyApi.createProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] });
      toast({ title: 'Programa creado correctamente' });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear el programa',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      loyaltyApi.updateProgram(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] });
      toast({ title: 'Programa actualizado correctamente' });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar el programa',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      pointsPerAmount: parseFloat(formData.pointsPerAmount),
      minimumPurchase: parseFloat(formData.minimumPurchase),
      pointsExpireDays: formData.pointsExpireDays
        ? parseInt(formData.pointsExpireDays)
        : undefined,
      pointsValue: parseFloat(formData.pointsValue),
      minimumRedemption: parseInt(formData.minimumRedemption),
      welcomePoints: parseInt(formData.welcomePoints),
      birthdayPoints: parseInt(formData.birthdayPoints),
      referralPoints: parseInt(formData.referralPoints),
      refereePoints: parseInt(formData.refereePoints),
    };

    if (program) {
      updateMutation.mutate({ id: program.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {program ? 'Editar Programa' : 'Nuevo Programa de Fidelidad'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Información Básica</h3>

              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Programa *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Programa VIP"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Describe tu programa de fidelidad..."
                  rows={3}
                />
              </div>
            </div>

            {/* Points Configuration */}
            <div className="space-y-4">
              <h3 className="font-semibold">Configuración de Puntos</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pointsPerAmount">Puntos por $1 gastado *</Label>
                  <Input
                    id="pointsPerAmount"
                    type="number"
                    step="0.1"
                    value={formData.pointsPerAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, pointsPerAmount: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pointsValue">Valor de 1 punto ($) *</Label>
                  <Input
                    id="pointsValue"
                    type="number"
                    step="0.001"
                    value={formData.pointsValue}
                    onChange={(e) =>
                      setFormData({ ...formData, pointsValue: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minimumPurchase">Compra mínima para ganar ($)</Label>
                  <Input
                    id="minimumPurchase"
                    type="number"
                    step="0.01"
                    value={formData.minimumPurchase}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumPurchase: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumRedemption">Puntos mínimos para canjear</Label>
                  <Input
                    id="minimumRedemption"
                    type="number"
                    value={formData.minimumRedemption}
                    onChange={(e) =>
                      setFormData({ ...formData, minimumRedemption: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pointsExpireDays">
                  Expiración de puntos (días, opcional)
                </Label>
                <Input
                  id="pointsExpireDays"
                  type="number"
                  value={formData.pointsExpireDays}
                  onChange={(e) =>
                    setFormData({ ...formData, pointsExpireDays: e.target.value })
                  }
                  placeholder="Dejar vacío = sin expiración"
                />
              </div>
            </div>

            {/* Bonuses */}
            <div className="space-y-4">
              <h3 className="font-semibold">Bonificaciones</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="welcomePoints">Puntos de Bienvenida</Label>
                  <Input
                    id="welcomePoints"
                    type="number"
                    value={formData.welcomePoints}
                    onChange={(e) =>
                      setFormData({ ...formData, welcomePoints: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthdayPoints">Puntos de Cumpleaños</Label>
                  <Input
                    id="birthdayPoints"
                    type="number"
                    value={formData.birthdayPoints}
                    onChange={(e) =>
                      setFormData({ ...formData, birthdayPoints: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referralPoints">
                    Puntos por Referir (quien refiere)
                  </Label>
                  <Input
                    id="referralPoints"
                    type="number"
                    value={formData.referralPoints}
                    onChange={(e) =>
                      setFormData({ ...formData, referralPoints: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refereePoints">
                    Puntos al Referido (quien es referido)
                  </Label>
                  <Input
                    id="refereePoints"
                    type="number"
                    value={formData.refereePoints}
                    onChange={(e) =>
                      setFormData({ ...formData, refereePoints: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
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
              ) : program ? (
                'Actualizar'
              ) : (
                'Crear Programa'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
