'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@retail/ui';
import {
  appointmentsApi,
  Appointment,
  Service,
  Resource,
  AppointmentStatus,
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUS_COLORS,
} from '@/lib/api/appointments';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Edit,
  MoreVertical,
} from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'sonner';

interface AppointmentsListProps {
  appointments: Appointment[];
  services: Service[];
  resources: Resource[];
  isLoading: boolean;
}

export function AppointmentsList({
  appointments,
  services,
  resources,
  isLoading,
}: AppointmentsListProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'ALL'>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [resourceFilter, setResourceFilter] = useState<string>('ALL');

  // Filter appointments
  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      searchTerm === '' ||
      apt.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.customerPhone?.includes(searchTerm);

    const matchesStatus = statusFilter === 'ALL' || apt.status === statusFilter;
    const matchesService = serviceFilter === 'ALL' || apt.serviceId === serviceFilter;
    const matchesResource = resourceFilter === 'ALL' || apt.resourceId === resourceFilter;

    return matchesSearch && matchesStatus && matchesService && matchesResource;
  });

  // Handle appointment actions
  const handleConfirm = async (id: string) => {
    try {
      await appointmentsApi.confirmAppointment(id);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita confirmada');
    } catch (error) {
      toast.error('Error al confirmar la cita');
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      await appointmentsApi.checkInAppointment(id);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cliente registrado');
    } catch (error) {
      toast.error('Error al registrar el cliente');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await appointmentsApi.completeAppointment(id);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita completada');
    } catch (error) {
      toast.error('Error al completar la cita');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const reason = prompt('Razón de cancelación (opcional):');
      await appointmentsApi.cancelAppointment(id, reason || undefined);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita cancelada');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cancelar la cita');
    }
  };

  const handleNoShow = async (id: string) => {
    try {
      await appointmentsApi.markNoShow(id);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Cita marcada como no asistió');
    } catch (error) {
      toast.error('Error al marcar como no asistió');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Lista de Citas</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {filteredAppointments.length} citas
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AppointmentStatus | 'ALL')}>
            <SelectTrigger>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              {Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Service Filter */}
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Servicio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los servicios</SelectItem>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Resource Filter */}
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Recurso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los recursos</SelectItem>
              {resources.map((resource) => (
                <SelectItem key={resource.id} value={resource.id}>
                  {resource.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Appointments Table */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No se encontraron citas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments
                  .sort((a, b) => dayjs(b.startTime).unix() - dayjs(a.startTime).unix())
                  .map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell>
                        <Badge className={APPOINTMENT_STATUS_COLORS[apt.status]}>
                          {APPOINTMENT_STATUS_LABELS[apt.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {apt.customerName || 'Sin nombre'}
                            </div>
                            {apt.customer && (
                              <div className="text-sm text-gray-500">
                                ID: {apt.customer.id.slice(0, 8)}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{apt.service?.name}</div>
                            <div className="text-sm text-gray-500">
                              {apt.service?.duration} min - ${apt.service?.price}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {apt.resource ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            {apt.resource.name}
                          </div>
                        ) : (
                          <span className="text-gray-400">No asignado</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {dayjs(apt.startTime).format('DD/MM/YYYY')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {dayjs(apt.startTime).format('HH:mm')} -{' '}
                              {dayjs(apt.endTime).format('HH:mm')}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {apt.customerEmail && (
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {apt.customerEmail}
                            </div>
                          )}
                          {apt.customerPhone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {apt.customerPhone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {apt.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConfirm(apt.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancel(apt.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {apt.status === 'CONFIRMED' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleCheckIn(apt.id)}
                              >
                                Registrar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancel(apt.id)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {apt.status === 'CHECKED_IN' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleComplete(apt.id)}
                              >
                                Completar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleNoShow(apt.id)}
                              >
                                No asistió
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
