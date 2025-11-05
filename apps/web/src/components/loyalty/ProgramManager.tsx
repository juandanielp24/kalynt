'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loyaltyApi, LoyaltyProgram } from '@/lib/api/loyalty';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, useToast } from '@retail/ui';
import { Edit, Power, Settings } from 'lucide-react';

interface Props {
  program: LoyaltyProgram;
  onEdit: () => void;
}

export function ProgramManager({ program, onEdit }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: loyaltyApi.toggleProgramStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-programs'] });
      toast({ title: 'Estado actualizado' });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuración del Programa
            </CardTitle>
            <Badge variant={program.isActive ? 'default' : 'secondary'}>
              {program.isActive ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Información General</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nombre:</span>
                  <span className="font-medium">{program.name}</span>
                </div>
                {program.description && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Descripción:</span>
                    <span className="font-medium text-right max-w-xs">
                      {program.description}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <Badge variant={program.isActive ? 'default' : 'secondary'}>
                    {program.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Configuración de Puntos</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Puntos por $1:</span>
                  <span className="font-medium">{program.pointsPerAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor de 1 punto:</span>
                  <span className="font-medium">${program.pointsValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Compra mínima:</span>
                  <span className="font-medium">${program.minimumPurchase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mínimo para canjear:</span>
                  <span className="font-medium">{program.minimumRedemption} pts</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Bonificaciones</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bienvenida:</span>
                  <span className="font-medium">{program.welcomePoints} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cumpleaños:</span>
                  <span className="font-medium">{program.birthdayPoints} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Referido (referrer):</span>
                  <span className="font-medium">{program.referralPoints} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Referido (referee):</span>
                  <span className="font-medium">{program.refereePoints} pts</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Reglas de Canje</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mínimo para canjear:</span>
                  <span className="font-medium">{program.minimumRedemption} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expiración:</span>
                  <span className="font-medium">
                    {program.pointsExpireDays
                      ? `${program.pointsExpireDays} días`
                      : 'Sin expiración'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {program._count && (
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3">Estadísticas</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-gray-600 mb-1">Miembros</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {program._count.members}
                  </div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-gray-600 mb-1">Recompensas</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {program._count.rewards}
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-gray-600 mb-1">Niveles</div>
                  <div className="text-2xl font-bold text-green-600">
                    {program._count.tiers}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={onEdit} className="flex-1">
              <Edit className="mr-2 h-4 w-4" />
              Editar Programa
            </Button>
            <Button
              variant="outline"
              onClick={() => toggleMutation.mutate(program.id)}
              disabled={toggleMutation.isPending}
            >
              <Power className="mr-2 h-4 w-4" />
              {program.isActive ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
