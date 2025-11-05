'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi, Franchise, Franchisee } from '@/lib/api/locations';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  useToast,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@retail/ui';
import { Plus, Store, Users, DollarSign, TrendingUp, Edit, Trash2 } from 'lucide-react';

export function FranchiseManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('franchises');

  const { data: franchisesData, isLoading: loadingFranchises } = useQuery({
    queryKey: ['franchises'],
    queryFn: () => locationsApi.getFranchises(),
  });

  const { data: franchiseesData, isLoading: loadingFranchisees } = useQuery({
    queryKey: ['franchisees'],
    queryFn: () => locationsApi.getFranchisees(),
  });

  const deleteFranchiseMutation = useMutation({
    mutationFn: locationsApi.deleteFranchise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchises'] });
      toast({ title: 'Franquicia eliminada' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Error al eliminar',
        variant: 'destructive',
      });
    },
  });

  const franchises = franchisesData || [];
  const franchisees = franchiseesData || [];

  if (loadingFranchises || loadingFranchisees) {
    return <div className="text-center py-12">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Gestión de Franquicias</h2>
          <p className="text-sm text-gray-600">
            Administra marcas de franquicia y franquiciados
          </p>
        </div>

        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Franquicia
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="franchises">
            <Store className="h-4 w-4 mr-2" />
            Franquicias ({franchises.length})
          </TabsTrigger>
          <TabsTrigger value="franchisees">
            <Users className="h-4 w-4 mr-2" />
            Franquiciados ({franchisees.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="franchises" className="mt-6">
          {franchises.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Store className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay franquicias</h3>
                <p className="text-gray-600">Crea tu primera marca de franquicia</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {franchises.map((franchise: Franchise) => (
                <Card key={franchise.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {franchise.name}
                          {!franchise.isActive && (
                            <Badge variant="secondary">Inactiva</Badge>
                          )}
                        </CardTitle>
                        {franchise.description && (
                          <p className="text-sm text-gray-600 mt-2">
                            {franchise.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Financial Terms */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cuota Inicial:</span>
                        <span className="font-semibold">
                          ${franchise.initialFee.toLocaleString()}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Regalías:</span>
                        <span className="font-semibold">
                          {franchise.royaltyPercentage}%
                        </span>
                      </div>

                      {franchise.marketingFee && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Marketing:</span>
                          <span className="font-semibold">
                            {franchise.marketingFee}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Contract Terms */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-900">
                        <div className="font-semibold mb-1">Términos de Contrato</div>
                        <div>{franchise.contractYears} años</div>
                        {franchise.trainingIncluded && (
                          <div className="text-xs mt-1">✓ Incluye capacitación</div>
                        )}
                        {franchise.ongoingSupport && (
                          <div className="text-xs">✓ Soporte continuo</div>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                          <Store className="h-4 w-4" />
                          <span className="text-xs">Ubicaciones</span>
                        </div>
                        <div className="font-semibold">
                          {franchise._count?.locations || 0}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-gray-600 mb-1">
                          <Users className="h-4 w-4" />
                          <span className="text-xs">Franquiciados</span>
                        </div>
                        <div className="font-semibold">
                          {franchise._count?.franchisees || 0}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFranchiseMutation.mutate(franchise.id)}
                        disabled={deleteFranchiseMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="franchisees" className="mt-6">
          {franchisees.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay franquiciados</h3>
                <p className="text-gray-600">Agrega tu primer franquiciado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {franchisees.map((franchisee: Franchisee) => (
                <Card key={franchisee.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{franchisee.name}</h3>
                          <Badge
                            className={
                              franchisee.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }
                          >
                            {franchisee.status}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600 mb-1">Franquicia:</div>
                            <div className="font-medium">
                              {franchisee.franchise?.name}
                            </div>
                          </div>

                          {franchisee.company && (
                            <div>
                              <div className="text-gray-600 mb-1">Empresa:</div>
                              <div className="font-medium">{franchisee.company}</div>
                            </div>
                          )}

                          <div>
                            <div className="text-gray-600 mb-1">Email:</div>
                            <div className="font-medium">{franchisee.email}</div>
                          </div>

                          {franchisee.phone && (
                            <div>
                              <div className="text-gray-600 mb-1">Teléfono:</div>
                              <div className="font-medium">{franchisee.phone}</div>
                            </div>
                          )}
                        </div>

                        {/* Contract Info */}
                        {franchisee.contractStartDate && (
                          <div className="mt-3 pt-3 border-t text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Inicio contrato:
                              </span>
                              <span className="font-medium">
                                {new Date(franchisee.contractStartDate).toLocaleDateString()}
                              </span>
                            </div>
                            {franchisee.contractEndDate && (
                              <div className="flex justify-between mt-1">
                                <span className="text-gray-600">
                                  Fin contrato:
                                </span>
                                <span className="font-medium">
                                  {new Date(franchisee.contractEndDate).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Payment Info */}
                        {franchisee.initialFeePaid && (
                          <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                            <span className="text-green-800">
                              ✓ Cuota inicial pagada
                              {franchisee.initialFeeAmount && (
                                <span className="ml-2 font-semibold">
                                  ${franchisee.initialFeeAmount.toLocaleString()}
                                </span>
                              )}
                            </span>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t">
                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">Regalías</div>
                            <div className="font-semibold">
                              {franchisee._count?.royalties || 0}
                            </div>
                          </div>

                          <div className="text-center">
                            <div className="text-xs text-gray-600 mb-1">Ubicaciones</div>
                            <div className="font-semibold">
                              {/* This would need to be added to the query */}
                              0
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
