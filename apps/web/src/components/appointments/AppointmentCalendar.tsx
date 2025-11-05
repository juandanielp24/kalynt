'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@retail/ui';
import { appointmentsApi, Appointment, Service, Resource, APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from '@/lib/api/appointments';
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, User } from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'sonner';

interface AppointmentCalendarProps {
  appointments: Appointment[];
  services: Service[];
  resources: Resource[];
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function AppointmentCalendar({
  appointments,
  services,
  resources,
  selectedDate,
  onDateChange,
}: AppointmentCalendarProps) {
  const queryClient = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const currentDate = dayjs(selectedDate);
  const daysInMonth = currentDate.daysInMonth();
  const firstDayOfMonth = currentDate.startOf('month').day();
  const monthName = currentDate.format('MMMM YYYY');

  // Generate calendar days
  const calendarDays: (number | null)[] = [];

  // Add empty slots for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add actual days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // Get appointments for a specific day
  const getAppointmentsForDay = (day: number) => {
    const dayDate = currentDate.date(day).format('YYYY-MM-DD');
    return appointments.filter((apt) =>
      dayjs(apt.startTime).format('YYYY-MM-DD') === dayDate
    );
  };

  // Navigate months
  const goToPreviousMonth = () => {
    const newDate = currentDate.subtract(1, 'month').format('YYYY-MM-DD');
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = currentDate.add(1, 'month').format('YYYY-MM-DD');
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(dayjs().format('YYYY-MM-DD'));
  };

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

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">{monthName}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Hoy
              </Button>
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="p-2" />;
              }

              const dayAppointments = getAppointmentsForDay(day);
              const isToday = currentDate.date(day).isSame(dayjs(), 'day');
              const isSelected = currentDate.date(day).isSame(selectedDate, 'day');

              return (
                <div
                  key={day}
                  onClick={() => onDateChange(currentDate.date(day).format('YYYY-MM-DD'))}
                  className={`
                    min-h-[100px] p-2 border rounded-lg cursor-pointer transition-colors
                    ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                    ${isSelected ? 'ring-2 ring-blue-500' : ''}
                    hover:bg-gray-50
                  `}
                >
                  <div className="font-semibold text-sm mb-1">{day}</div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => (
                      <div
                        key={apt.id}
                        className={`text-xs p-1 rounded truncate ${APPOINTMENT_STATUS_COLORS[apt.status]}`}
                      >
                        {dayjs(apt.startTime).format('HH:mm')} - {apt.customerName || 'Sin nombre'}
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayAppointments.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Citas del {dayjs(selectedDate).format('DD/MM/YYYY')}
            </CardTitle>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cita
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay citas programadas para este día
            </div>
          ) : (
            <div className="space-y-3">
              {appointments
                .sort((a, b) => dayjs(a.startTime).unix() - dayjs(b.startTime).unix())
                .map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={APPOINTMENT_STATUS_COLORS[apt.status]}>
                          {APPOINTMENT_STATUS_LABELS[apt.status]}
                        </Badge>
                        <span className="font-semibold">{apt.customerName || 'Sin nombre'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {dayjs(apt.startTime).format('HH:mm')} - {dayjs(apt.endTime).format('HH:mm')}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {apt.service?.name}
                        </span>
                        {apt.resource && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {apt.resource.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {apt.status === 'PENDING' && (
                        <Button size="sm" variant="outline" onClick={() => handleConfirm(apt.id)}>
                          Confirmar
                        </Button>
                      )}
                      {apt.status === 'CONFIRMED' && (
                        <Button size="sm" variant="outline" onClick={() => handleCheckIn(apt.id)}>
                          Registrar
                        </Button>
                      )}
                      {apt.status === 'CHECKED_IN' && (
                        <Button size="sm" onClick={() => handleComplete(apt.id)}>
                          Completar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
