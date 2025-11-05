'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { appointmentsApi } from '@/lib/api/appointments';
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
  Calendar,
  List,
  Settings,
  Users,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { AppointmentCalendar } from '@/components/appointments/AppointmentCalendar';
import { AppointmentsList } from '@/components/appointments/AppointmentsList';
import { ServicesManager } from '@/components/appointments/ServicesManager';
import { ResourcesManager } from '@/components/appointments/ResourcesManager';
import dayjs from 'dayjs';

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  // Get appointments for today
  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['appointments', selectedDate],
    queryFn: () =>
      appointmentsApi.getAppointments({
        startDate: dayjs(selectedDate).startOf('day').toISOString(),
        endDate: dayjs(selectedDate).endOf('day').toISOString(),
      }),
  });

  const appointments = appointmentsData?.data || [];

  // Get statistics for the current month
  const { data: statsData } = useQuery({
    queryKey: ['appointments-stats', dayjs().format('YYYY-MM')],
    queryFn: () =>
      appointmentsApi.getStatistics(
        dayjs().startOf('month').toISOString(),
        dayjs().endOf('month').toISOString()
      ),
  });

  const stats = statsData?.data;

  // Get services and resources
  const { data: servicesData } = useQuery({
    queryKey: ['services', { isActive: true }],
    queryFn: () => appointmentsApi.getServices({ isActive: true }),
  });

  const { data: resourcesData } = useQuery({
    queryKey: ['resources', { isActive: true }],
    queryFn: () => appointmentsApi.getResources({ isActive: true }),
  });

  const services = servicesData?.data || [];
  const resources = resourcesData?.data || [];

  // Calculate today's stats
  const todayStats = {
    total: appointments.length,
    confirmed: appointments.filter((a: any) => a.status === 'CONFIRMED').length,
    checkedIn: appointments.filter((a: any) => a.status === 'CHECKED_IN').length,
    completed: appointments.filter((a: any) => a.status === 'COMPLETED').length,
  };

  return (
    <ProtectedRoute>
      <PermissionGuard resource="SALES" action="READ">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Calendar className="h-8 w-8 text-blue-600" />
                Citas y Reservas
              </h1>
              <p className="text-gray-600 mt-1">
                Gestiona citas, servicios y recursos
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveTab('services')}>
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Button>
              <Button onClick={() => setActiveTab('calendar')}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cita
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Citas Hoy</p>
                    <p className="text-2xl font-bold">{todayStats.total}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Confirmadas</p>
                    <p className="text-2xl font-bold">{todayStats.confirmed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">En Progreso</p>
                    <p className="text-2xl font-bold">{todayStats.checkedIn}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completadas</p>
                    <p className="text-2xl font-bold">{todayStats.completed}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="calendar" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Calendario
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Servicios
              </TabsTrigger>
              <TabsTrigger value="resources" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Recursos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-6">
              <AppointmentCalendar
                appointments={appointments}
                services={services}
                resources={resources}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </TabsContent>

            <TabsContent value="list" className="mt-6">
              <AppointmentsList
                appointments={appointments}
                services={services}
                resources={resources}
                isLoading={isLoading}
              />
            </TabsContent>

            <TabsContent value="services" className="mt-6">
              <ServicesManager />
            </TabsContent>

            <TabsContent value="resources" className="mt-6">
              <ResourcesManager />
            </TabsContent>
          </Tabs>

          {/* Monthly Statistics */}
          {stats && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Estadísticas del Mes
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Citas</p>
                    <p className="text-xl font-bold">{stats.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completadas</p>
                    <p className="text-xl font-bold text-green-600">
                      {stats.byStatus?.find((s: any) => s.status === 'COMPLETED')?._count || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">No Asistió</p>
                    <p className="text-xl font-bold text-red-600">
                      {stats.noShowCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tasa No Show</p>
                    <p className="text-xl font-bold text-orange-600">
                      {stats.noShowRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PermissionGuard>
    </ProtectedRoute>
  );
}
