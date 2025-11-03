'use client';

import { useState } from 'react';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { SalesChart } from '@/components/dashboard/SalesChart';
import { TopProductsChart } from '@/components/dashboard/TopProductsChart';
import { RecentSales } from '@/components/dashboard/RecentSales';
import { LowStockAlerts } from '@/components/dashboard/LowStockAlerts';
import { LoadingSpinner } from '@retail/ui';
import { Button } from '@retail/ui';
import { Calendar, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>();
  const { data, isLoading, refetch, isRefetching } = useDashboardData(dateRange);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return <div>Error loading dashboard data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Resumen de tu negocio en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Período
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`}
            />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards data={data.overview} />

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <SalesChart data={data.salesChart} />
        <TopProductsChart data={data.topProducts} />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <RecentSales data={data.recentSales} />
        <LowStockAlerts data={data.lowStockProducts} />
      </div>
    </div>
  );
}
