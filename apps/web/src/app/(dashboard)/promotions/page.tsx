'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { promotionsApi, PromotionType } from '@/lib/api/promotions';
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
  Tag,
  Plus,
  Percent,
  Gift,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { PromotionsList } from '@/components/promotions/PromotionsList';
import { PromotionForm } from '@/components/promotions/PromotionForm';
import { PromotionsAnalytics } from '@/components/promotions/PromotionsAnalytics';

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);

  const { data: promotionsData } = useQuery({
    queryKey: ['promotions', activeTab],
    queryFn: () =>
      promotionsApi.getPromotions({
        isActive: activeTab === 'active' ? true : activeTab === 'inactive' ? false : undefined,
        includeExpired: activeTab === 'expired',
      }),
  });

  const promotions = promotionsData?.data || [];

  const activePromotions = promotions.filter((p: any) => p.isActive).length;
  const totalCoupons = promotions.reduce(
    (sum: number, p: any) => sum + (p._count?.coupons || 0),
    0
  );
  const totalUsage = promotions.reduce(
    (sum: number, p: any) => sum + (p.currentUses || 0),
    0
  );

  const handleEdit = (promotion: any) => {
    setEditingPromotion(promotion);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPromotion(null);
  };

  return (
    <ProtectedRoute>
      <PermissionGuard resource="PROMOTIONS" action="READ">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Tag className="h-8 w-8 text-blue-600" />
                Promociones y Cupones
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona promociones, descuentos y cupones
              </p>
            </div>

            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Promoción
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Promociones Activas
                    </p>
                    <p className="text-2xl font-bold mt-1">{activePromotions}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Percent className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Promociones</p>
                    <p className="text-2xl font-bold mt-1">{promotions.length}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Tag className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Cupones Generados</p>
                    <p className="text-2xl font-bold mt-1">{totalCoupons}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Gift className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Usos Totales</p>
                    <p className="text-2xl font-bold mt-1">{totalUsage}</p>
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">Activas</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="inactive">Inactivas</TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="mt-6">
              <PromotionsList
                promotions={promotions.filter((p: any) => p.isActive)}
                onEdit={handleEdit}
              />
            </TabsContent>

            <TabsContent value="all" className="mt-6">
              <PromotionsList promotions={promotions} onEdit={handleEdit} />
            </TabsContent>

            <TabsContent value="inactive" className="mt-6">
              <PromotionsList
                promotions={promotions.filter((p: any) => !p.isActive)}
                onEdit={handleEdit}
              />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <PromotionsAnalytics promotions={promotions} />
            </TabsContent>
          </Tabs>

          {/* Promotion Form Dialog */}
          {isFormOpen && (
            <PromotionForm
              promotion={editingPromotion}
              onClose={handleCloseForm}
            />
          )}
        </div>
      </PermissionGuard>
    </ProtectedRoute>
  );
}
