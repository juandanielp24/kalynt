'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subscriptionsApi, SubscriptionStatus } from '@/lib/api/subscriptions';
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
  Badge,
} from '@retail/ui';
import {
  CreditCard,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Settings,
  BarChart3,
} from 'lucide-react';
import { SubscriptionsList } from '@/components/subscriptions/SubscriptionsList';
import { PlansManager } from '@/components/subscriptions/PlansManager';
import { SubscriptionForm } from '@/components/subscriptions/SubscriptionForm';
import { SubscriptionsAnalytics } from '@/components/subscriptions/SubscriptionsAnalytics';

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('subscriptions');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: subscriptionsData } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => subscriptionsApi.getSubscriptions(),
  });

  const { data: statsData } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: () => subscriptionsApi.getStatistics(),
  });

  const { data: billingStatsData } = useQuery({
    queryKey: ['billing-stats'],
    queryFn: () => subscriptionsApi.getBillingStatistics(),
  });

  const subscriptions = subscriptionsData?.data || [];
  const stats = statsData?.data;
  const billingStats = billingStatsData?.data;

  const activeSubscriptions = subscriptions.filter(
    (s: any) => s.status === SubscriptionStatus.ACTIVE
  ).length;

  const trialSubscriptions = subscriptions.filter(
    (s: any) => s.status === SubscriptionStatus.TRIAL
  ).length;

  const pastDueSubscriptions = subscriptions.filter(
    (s: any) => s.status === SubscriptionStatus.PAST_DUE
  ).length;

  return (
    <ProtectedRoute>
      <PermissionGuard resource="SALES" action="READ">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-purple-600" />
                Suscripciones
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona planes y suscripciones recurrentes
              </p>
            </div>

            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Suscripción
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Suscripciones Activas
                    </p>
                    <p className="text-2xl font-bold mt-1">{activeSubscriptions}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">MRR</p>
                    <p className="text-2xl font-bold mt-1">
                      ${stats?.monthlyRecurringRevenue?.toFixed(0) || 0}
                    </p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">En Prueba</p>
                    <p className="text-2xl font-bold mt-1">{trialSubscriptions}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Vencidas</p>
                    <p className="text-2xl font-bold mt-1">{pastDueSubscriptions}</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="subscriptions">
                <Users className="h-4 w-4 mr-2" />
                Suscripciones
              </TabsTrigger>
              <TabsTrigger value="plans">
                <Settings className="h-4 w-4 mr-2" />
                Planes
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="subscriptions" className="mt-6">
              <SubscriptionsList />
            </TabsContent>

            <TabsContent value="plans" className="mt-6">
              <PlansManager />
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <SubscriptionsAnalytics stats={stats} billingStats={billingStats} />
            </TabsContent>
          </Tabs>

          {/* Subscription Form Dialog */}
          {isFormOpen && (
            <SubscriptionForm onClose={() => setIsFormOpen(false)} />
          )}
        </div>
      </PermissionGuard>
    </ProtectedRoute>
  );
}
