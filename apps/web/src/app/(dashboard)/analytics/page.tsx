'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@retail/ui';
import {
  BarChart3,
  TrendingUp,
  Users,
  Package,
  Download,
  Calendar,
  DollarSign,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react';
import { DashboardOverview } from '@/components/analytics/DashboardOverview';
import { SalesTrends } from '@/components/analytics/SalesTrends';
import { CustomerSegments } from '@/components/analytics/CustomerSegments';
import { ProductPerformance } from '@/components/analytics/ProductPerformance';
import { HourlyPatterns } from '@/components/analytics/HourlyPatterns';

const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: '60d', label: 'Últimos 60 días' },
  { value: '90d', label: 'Últimos 90 días' },
  { value: 'week', label: 'Esta semana' },
  { value: 'month', label: 'Este mes' },
  { value: 'year', label: 'Este año' },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['analytics-dashboard', period],
    queryFn: () => analyticsApi.getDashboard(period),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const handleExport = async (type: 'dashboard' | 'products' | 'customers', format: 'xlsx' | 'csv' | 'pdf' = 'xlsx') => {
    try {
      const blob = await analyticsApi.exportData(type, period, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const dashboard = dashboardData?.data;

  return (
    <ProtectedRoute>
      <PermissionGuard resource="SALES" action="READ">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Business Intelligence y análisis avanzado de datos
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-48">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => handleExport('dashboard')}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {!isLoading && dashboard && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    Ventas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboard.sales.current.totalSales}
                  </div>
                  <p className={`text-sm mt-1 flex items-center gap-1 ${
                    dashboard.sales.growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="h-3 w-3" />
                    {dashboard.sales.growth >= 0 ? '+' : ''}
                    {dashboard.sales.growth.toFixed(1)}% vs anterior
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Ingresos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${dashboard.sales.current.totalRevenue.toLocaleString('es-AR')}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Ganancia: ${dashboard.sales.current.totalProfit.toLocaleString('es-AR')}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Margen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboard.sales.current.profitMargin.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Ticket: ${dashboard.sales.current.averageTicket.toFixed(2)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {dashboard.customers.customersWithPurchases}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {dashboard.customers.repeatRate.toFixed(1)}% repiten
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Insights */}
          {!isLoading && dashboard && dashboard.insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dashboard.insights.slice(0, 4).map((insight: any, index: number) => (
                <Card
                  key={index}
                  className={`border-l-4 ${
                    insight.type === 'success'
                      ? 'border-green-500 bg-green-50'
                      : insight.type === 'warning'
                      ? 'border-yellow-500 bg-yellow-50'
                      : insight.type === 'error'
                      ? 'border-red-500 bg-red-50'
                      : 'border-blue-500 bg-blue-50'
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className={`h-5 w-5 mt-0.5 ${
                          insight.type === 'success'
                            ? 'text-green-600'
                            : insight.type === 'warning'
                            ? 'text-yellow-600'
                            : insight.type === 'error'
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`}
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">
                          {insight.title}
                        </h4>
                        <p className="text-sm text-gray-700">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="trends">
                <TrendingUp className="h-4 w-4 mr-2" />
                Tendencias
              </TabsTrigger>
              <TabsTrigger value="customers">
                <Users className="h-4 w-4 mr-2" />
                Clientes
              </TabsTrigger>
              <TabsTrigger value="products">
                <Package className="h-4 w-4 mr-2" />
                Productos
              </TabsTrigger>
              <TabsTrigger value="patterns">
                <Calendar className="h-4 w-4 mr-2" />
                Patrones
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              {isLoading ? (
                <div className="text-center py-12">Cargando datos...</div>
              ) : dashboard ? (
                <DashboardOverview data={dashboard} period={period} />
              ) : null}
            </TabsContent>

            <TabsContent value="trends" className="mt-6">
              <SalesTrends />
            </TabsContent>

            <TabsContent value="customers" className="mt-6">
              <CustomerSegments onExport={() => handleExport('customers')} />
            </TabsContent>

            <TabsContent value="products" className="mt-6">
              <ProductPerformance
                period={period}
                onExport={() => handleExport('products')}
              />
            </TabsContent>

            <TabsContent value="patterns" className="mt-6">
              <HourlyPatterns />
            </TabsContent>
          </Tabs>
        </div>
      </PermissionGuard>
    </ProtectedRoute>
  );
}
