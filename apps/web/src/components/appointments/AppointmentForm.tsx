'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, Appointment } from '@/lib/api/appointments';
import { customersApi } from '@/lib/api/customers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@retail/ui';
import { Loader2, Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  appointment?: Appointment | null;
  onClose: () => void;
  defaultDate?: Date;
  defaultServiceId?: string;
}

export function AppointmentForm({ appointment, onClose, defaultDate, defaultServiceId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1); // 1: Service, 2: DateTime, 3: Customer
  const [selectedService, setSelectedService] = useState(defaultServiceId || '');
  const [selectedDate, setSelectedDate] = useState(
    defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [selectedSlot, setSelectedSlot] = useState('');
  const [customerType, setCustomerType] = useState<'existing' | 'new'>('existing');

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: '',
    internalNotes: '',
  });

  useEffect(() => {
    if (appointment) {
      setSelectedService(appointment.serviceId);
      setSelectedDate(format(new Date(appointment.startTime), 'yyyy-MM-dd'));
      setSelectedSlot(appointment.startTime);
      setFormData({
        customerId: appointment.customerId || '',
        customerName: appointment.customerName || '',
        customerEmail: appointment.customerEmail || '',
        customerPhone: appointment.customerPhone || '',
        notes: appointment.notes || '',
        internalNotes: appointment.internalNotes || '',
      });
      setCustomerType(appointment.customerId ? 'existing' : 'new');
      setStep(3); // Go to final step for editing
    }
  }, [appointment]);

  // Queries
  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => appointmentsApi.getServices({ isActive: true }),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers(),
    enabled: customerType === 'existing',
  });

  const { data: slotsData, isLoading: loadingSlots } = useQuery({
    queryKey: ['available-slots', selectedService, selectedDate],
    queryFn: () => appointmentsApi.getAvailableSlots(selectedService, selectedDate),
    enabled: !!selectedService && !!selectedDate && step === 2,
  });

  const createMutation = useMutation({
    mutationFn: appointmentsApi.createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'Cita creada correctamente' });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear la cita',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      appointmentsApi.updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast({ title: 'Cita actualizada correctamente' });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar la cita',
        variant: 'destructive',
      });
    },
  });

  const services = servicesData?.data || [];
  const customers = customersData?.data || [];
  const slots = slotsData?.data || [];

  const selectedServiceData = services.find((s: any) => s.id === selectedService);
  const availableSlots = slots.filter((slot: any) => slot.available);

  const handleNext = () => {
    if (step === 1 && !selectedService) {
      toast({ title: 'Selecciona un servicio', variant: 'destructive' });
      return;
    }
    if (step === 2 && !selectedSlot) {
      toast({ title: 'Selecciona un horario', variant: 'destructive' });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (customerType === 'existing' && !formData.customerId) {
      toast({ title: 'Selecciona un cliente', variant: 'destructive' });
      return;
    }

    if (customerType === 'new' && !formData.customerName) {
      toast({ title: 'Ingresa el nombre del cliente', variant: 'destructive' });
      return;
    }

    const data = {
      serviceId: selectedService,
      startTime: new Date(selectedSlot),
      customerId: customerType === 'existing' ? formData.customerId : undefined,
      customerName: customerType === 'new' ? formData.customerName : undefined,
      customerEmail: customerType === 'new' ? formData.customerEmail : undefined,
      customerPhone: customerType === 'new' ? formData.customerPhone : undefined,
      notes: formData.notes || undefined,
      internalNotes: formData.internalNotes || undefined,
      autoConfirm: true,
    };

    if (appointment) {
      updateMutation.mutate({ id: appointment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {appointment ? 'Editar Cita' : 'Nueva Cita'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Service Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Selecciona un servicio
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {services.map((service: any) => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service.id)}
                      className={`
                        p-4 border rounded-lg cursor-pointer transition-all
                        ${
                          selectedService === service.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{service.name}</h4>
                          {service.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {service.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {service.duration} min
                            </span>
                            <span className="font-semibold text-blue-600">
                              ${service.price}
                            </span>
                          </div>
                        </div>
                        {service.imageUrl && (
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Date & Time Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Selecciona fecha y hora
                </h3>

                {selectedServiceData && (
                  <div className="bg-blue-50 p-3 rounded-lg mb-4">
                    <div className="font-semibold">{selectedServiceData.name}</div>
                    <div className="text-sm text-gray-600">
                      Duración: {selectedServiceData.duration} min - Precio: $
                      {selectedServiceData.price}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Fecha</Label>
                    <Input
                      id="date"
                      type="date"
                      value={selectedDate}
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedSlot(''); // Reset slot when date changes
                      }}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>

                  {loadingSlots ? (
                    <div className="text-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                      <p className="text-sm text-gray-600 mt-2">
                        Cargando horarios disponibles...
                      </p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-600">
                        No hay horarios disponibles para esta fecha
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Prueba con otra fecha
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Label>Horarios disponibles</Label>
                      <div className="grid grid-cols-3 gap-2 mt-2 max-h-64 overflow-y-auto">
                        {availableSlots.map((slot: any) => (
                          <button
                            key={slot.startTime}
                            type="button"
                            onClick={() => setSelectedSlot(slot.startTime)}
                            className={`
                              p-3 text-sm font-medium rounded-lg border transition-all
                              ${
                                selectedSlot === slot.startTime
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                              }
                            `}
                          >
                            {format(new Date(slot.startTime), 'HH:mm')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Customer Information */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Información del cliente
                </h3>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={customerType === 'existing' ? 'default' : 'outline'}
                      onClick={() => setCustomerType('existing')}
                      className="flex-1"
                    >
                      Cliente Existente
                    </Button>
                    <Button
                      type="button"
                      variant={customerType === 'new' ? 'default' : 'outline'}
                      onClick={() => setCustomerType('new')}
                      className="flex-1"
                    >
                      Nuevo Cliente
                    </Button>
                  </div>

                  {customerType === 'existing' ? (
                    <div className="space-y-2">
                      <Label htmlFor="customerId">Buscar Cliente *</Label>
                      <Select
                        value={formData.customerId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, customerId: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} - {customer.email || customer.phone}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="customerName">Nombre *</Label>
                        <Input
                          id="customerName"
                          value={formData.customerName}
                          onChange={(e) =>
                            setFormData({ ...formData, customerName: e.target.value })
                          }
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="customerEmail">Email</Label>
                          <Input
                            id="customerEmail"
                            type="email"
                            value={formData.customerEmail}
                            onChange={(e) =>
                              setFormData({ ...formData, customerEmail: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="customerPhone">Teléfono</Label>
                          <Input
                            id="customerPhone"
                            value={formData.customerPhone}
                            onChange={(e) =>
                              setFormData({ ...formData, customerPhone: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas del Cliente</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows={2}
                      placeholder="Observaciones, preferencias, alergias..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="internalNotes">Notas Internas</Label>
                    <Textarea
                      id="internalNotes"
                      value={formData.internalNotes}
                      onChange={(e) =>
                        setFormData({ ...formData, internalNotes: e.target.value })
                      }
                      rows={2}
                      placeholder="Notas solo visibles para el personal..."
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Resumen de la cita</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Servicio:</span>
                    <span className="font-medium">{selectedServiceData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium">
                      {format(new Date(selectedDate), "d 'de' MMMM, yyyy", {
                        locale: es,
                      })}
                    </span>
                  </div>
                  {selectedSlot && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Hora:</span>
                      <span className="font-medium">
                        {format(new Date(selectedSlot), 'HH:mm')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duración:</span>
                    <span className="font-medium">
                      {selectedServiceData?.duration} minutos
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600">Precio:</span>
                    <span className="font-bold text-blue-600">
                      ${selectedServiceData?.price}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Atrás
              </Button>
            )}

            {step < 3 ? (
              <Button type="button" onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : appointment ? (
                  'Actualizar Cita'
                ) : (
                  'Confirmar Cita'
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
