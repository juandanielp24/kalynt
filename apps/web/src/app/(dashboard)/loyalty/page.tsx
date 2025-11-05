'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loyaltyApi } from '@/lib/api/loyalty';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import {
  Button,
  Card,
  CardContent,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@retail/ui';
import {
  Award,
  Plus,
  Users,
  Gift,
  TrendingUp,
  Trophy,
  BarChart3,
  Star,
} from 'lucide-react';
import { ProgramManager } from '@/components/loyalty/ProgramManager';
import { TiersManager } from '@/components/loyalty/TiersManager';
import { RewardsManager } from '@/components/loyalty/RewardsManager';
import { LoyaltyAnalytics } from '@/components/loyalty/LoyaltyAnalytics';
import { Leaderboard } from '@/components/loyalty/Leaderboard';
import { ProgramForm } from '@/components/loyalty/ProgramForm';

export default function LoyaltyPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any>(null);

  const { data: programsData } = useQuery({
    queryKey: ['loyalty-programs'],
    queryFn: () => loyaltyApi.getPrograms(true),
  });

  const programs = programsData?.data || [];
  const activeProgram = programs[0]; // Assuming single program per tenant

  const { data: statsData } = useQuery({
    queryKey: ['loyalty-stats', activeProgram?.id],
    queryFn: () => loyaltyApi.getProgramStatistics(activeProgram.id),
    enabled: !!activeProgram,
  });

  const stats = statsData?.data;

  const handleEdit = (program: any) => {
    setEditingProgram(program);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingProgram(null);
  };

  return (
    <ProtectedRoute>
      <PermissionGuard resource="SETTINGS" action="READ">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Award className="h-8 w-8 text-purple-600" />
                Programa de Fidelidad
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona puntos, niveles y recompensas
              </p>
            </div>

            {!activeProgram && (
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Programa
              </Button>
            )}
          </div>

          {!activeProgram ? (
            <Card>
              <CardContent className="text-center py-12">
                <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  No hay programa de fidelidad
                </h3>
                <p className="text-gray-600 mb-4">
                  Crea tu programa para comenzar a recompensar a tus clientes
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Programa
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Miembros Activos
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          {stats?.activeMembers || 0}
                        </p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-full">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Puntos Activos
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          {stats?.currentPoints?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="bg-purple-100 p-3 rounded-full">
                        <Star className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Canjes
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          {stats?.totalRedemptions || 0}
                        </p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-full">
                        <Gift className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Valor Puntos
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          ${stats?.pointsLiability?.toFixed(0) || 0}
                        </p>
                      </div>
                      <div className="bg-orange-100 p-3 rounded-full">
                        <TrendingUp className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="overview">General</TabsTrigger>
                  <TabsTrigger value="tiers">Niveles</TabsTrigger>
                  <TabsTrigger value="rewards">Recompensas</TabsTrigger>
                  <TabsTrigger value="leaderboard">
                    <Trophy className="h-4 w-4 mr-2" />
                    Top
                  </TabsTrigger>
                  <TabsTrigger value="analytics">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analytics
                  </TabsTrigger>
                  <TabsTrigger value="settings">Configuración</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Información del Programa
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Nombre:</span>
                            <span className="font-medium">{activeProgram.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Puntos por $1:</span>
                            <span className="font-medium">
                              {activeProgram.pointsPerAmount}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Valor de 1 punto:</span>
                            <span className="font-medium">
                              ${activeProgram.pointsValue}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Compra mínima:</span>
                            <span className="font-medium">
                              ${activeProgram.minimumPurchase}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Puntos de bienvenida:</span>
                            <span className="font-medium">
                              {activeProgram.welcomePoints}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Puntos cumpleaños:</span>
                            <span className="font-medium">
                              {activeProgram.birthdayPoints}
                            </span>
                          </div>
                        </div>
                        <Button
                          className="w-full mt-4"
                          variant="outline"
                          onClick={() => handleEdit(activeProgram)}
                        >
                          Editar Programa
                        </Button>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Estadísticas de Puntos
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-gray-600">
                                Puntos Ganados
                              </span>
                              <span className="font-semibold">
                                {stats?.pointsEarned?.toLocaleString() || 0}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{
                                  width: `${
                                    stats?.pointsEarned && stats?.pointsSpent
                                      ? (stats.pointsEarned /
                                          (stats.pointsEarned + stats.pointsSpent)) *
                                        100
                                      : 100
                                  }%`,
                                }}
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-sm text-gray-600">
                                Puntos Canjeados
                              </span>
                              <span className="font-semibold">
                                {stats?.pointsSpent?.toLocaleString() || 0}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{
                                  width: `${
                                    stats?.pointsEarned && stats?.pointsSpent
                                      ? (stats.pointsSpent /
                                          (stats.pointsEarned + stats.pointsSpent)) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="pt-4 border-t">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Puntos Activos:</span>
                              <span className="text-xl font-bold text-blue-600">
                                {stats?.currentPoints?.toLocaleString() || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="tiers" className="mt-6">
                  <TiersManager programId={activeProgram.id} />
                </TabsContent>

                <TabsContent value="rewards" className="mt-6">
                  <RewardsManager programId={activeProgram.id} />
                </TabsContent>

                <TabsContent value="leaderboard" className="mt-6">
                  <Leaderboard programId={activeProgram.id} />
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                  <LoyaltyAnalytics programId={activeProgram.id} stats={stats} />
                </TabsContent>

                <TabsContent value="settings" className="mt-6">
                  <ProgramManager
                    program={activeProgram}
                    onEdit={() => handleEdit(activeProgram)}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}

          {/* Program Form Dialog */}
          {isFormOpen && (
            <ProgramForm program={editingProgram} onClose={handleCloseForm} />
          )}
        </div>
      </PermissionGuard>
    </ProtectedRoute>
  );
}
