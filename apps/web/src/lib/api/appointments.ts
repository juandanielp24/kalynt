import { apiClient } from './client';

// ==================== Types & Interfaces ====================

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  bufferBefore: number;
  bufferAfter: number;
  maxCapacity: number;
  minAdvanceTime: number;
  maxAdvanceTime?: number;
  cancellationPolicy?: string;
  cancellationDeadline: number;
  isActive: boolean;
  category?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  resources?: ServiceResource[];
  appointments?: Appointment[];
  _count?: {
    appointments: number;
    resources: number;
  };
}

export interface Resource {
  id: string;
  tenantId: string;
  name: string;
  type: ResourceType;
  description?: string;
  imageUrl?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  services?: ServiceResource[];
  availability?: ResourceAvailability[];
  appointments?: Appointment[];
  blackoutDates?: BlackoutDate[];
  _count?: {
    appointments: number;
    services: number;
  };
}

export interface ServiceResource {
  serviceId: string;
  resourceId: string;
  service?: Service;
  resource?: Resource;
}

export interface ResourceAvailability {
  id: string;
  resourceId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlackoutDate {
  id: string;
  tenantId: string;
  resourceId?: string;
  startDate: string;
  endDate: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
  resource?: Resource;
}

export interface Appointment {
  id: string;
  tenantId: string;
  serviceId: string;
  resourceId?: string;
  customerId?: string;
  locationId?: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  internalNotes?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  cancelledBy?: string;
  reminderSentAt?: string;
  noShow: boolean;
  createdAt: string;
  updatedAt: string;
  service?: Service;
  resource?: Resource;
  customer?: any;
  location?: any;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  resourceId?: string;
}

export interface BookingRequest {
  serviceId: string;
  date: string;
  timeSlot?: string;
  resourceId?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

export interface BookingResult {
  success: boolean;
  appointment?: Appointment;
  availableSlots?: TimeSlot[];
  message?: string;
}

export interface AppointmentStatistics {
  total: number;
  byStatus: Array<{ status: AppointmentStatus; _count: number }>;
  byService: Array<{ serviceId: string; _count: number }>;
  byResource: Array<{ resourceId: string; _count: number }>;
  noShowCount: number;
  noShowRate: number;
}

export interface OccupancyData {
  occupancyRate: number;
  totalHours: number;
  bookedHours: number;
  appointmentCount: number;
}

// ==================== Enums ====================

export enum ResourceType {
  STAFF = 'STAFF',
  ROOM = 'ROOM',
  EQUIPMENT = 'EQUIPMENT',
  OTHER = 'OTHER',
}

export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

// ==================== Labels ====================

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  STAFF: 'Personal',
  ROOM: 'Sala',
  EQUIPMENT: 'Equipo',
  OTHER: 'Otro',
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  CHECKED_IN: 'Registrado',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  NO_SHOW: 'No asistió',
};

export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  CHECKED_IN: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  NO_SHOW: 'bg-gray-100 text-gray-800',
};

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

// ==================== API Client ====================

export const appointmentsApi = {
  // ==================== Services ====================

  getServices: async (params?: { isActive?: boolean; category?: string }) => {
    const response = await apiClient.get('/appointments/services', { params });
    return response.data;
  },

  getService: async (id: string) => {
    const response = await apiClient.get(`/appointments/services/${id}`);
    return response.data;
  },

  createService: async (data: Partial<Service> & { resourceIds?: string[] }) => {
    const response = await apiClient.post('/appointments/services', data);
    return response.data;
  },

  updateService: async (id: string, data: Partial<Service> & { resourceIds?: string[] }) => {
    const response = await apiClient.put(`/appointments/services/${id}`, data);
    return response.data;
  },

  deleteService: async (id: string) => {
    const response = await apiClient.delete(`/appointments/services/${id}`);
    return response.data;
  },

  toggleServiceStatus: async (id: string) => {
    const response = await apiClient.put(`/appointments/services/${id}/toggle`);
    return response.data;
  },

  getServiceCategories: async () => {
    const response = await apiClient.get('/appointments/services/categories/list');
    return response.data;
  },

  // ==================== Resources ====================

  getResources: async (params?: { isActive?: boolean; type?: ResourceType }) => {
    const response = await apiClient.get('/appointments/resources', { params });
    return response.data;
  },

  getResource: async (id: string) => {
    const response = await apiClient.get(`/appointments/resources/${id}`);
    return response.data;
  },

  createResource: async (data: Partial<Resource>) => {
    const response = await apiClient.post('/appointments/resources', data);
    return response.data;
  },

  updateResource: async (id: string, data: Partial<Resource>) => {
    const response = await apiClient.put(`/appointments/resources/${id}`, data);
    return response.data;
  },

  deleteResource: async (id: string) => {
    const response = await apiClient.delete(`/appointments/resources/${id}`);
    return response.data;
  },

  toggleResourceStatus: async (id: string) => {
    const response = await apiClient.put(`/appointments/resources/${id}/toggle`);
    return response.data;
  },

  setResourceAvailability: async (id: string, availability: Array<Partial<ResourceAvailability>>) => {
    const response = await apiClient.post(`/appointments/resources/${id}/availability`, {
      availability,
    });
    return response.data;
  },

  getResourceAvailability: async (id: string) => {
    const response = await apiClient.get(`/appointments/resources/${id}/availability`);
    return response.data;
  },

  getResourceOccupancy: async (resourceId: string, startDate: string, endDate: string) => {
    const response = await apiClient.get(`/appointments/resources/${resourceId}/occupancy`, {
      params: { startDate, endDate },
    });
    return response.data;
  },

  // ==================== Blackout Dates ====================

  getBlackoutDates: async (resourceId?: string) => {
    const response = await apiClient.get('/appointments/blackout-dates', {
      params: { resourceId },
    });
    return response.data;
  },

  addBlackoutDate: async (data: Partial<BlackoutDate>) => {
    const response = await apiClient.post('/appointments/blackout-dates', data);
    return response.data;
  },

  deleteBlackoutDate: async (id: string) => {
    const response = await apiClient.delete(`/appointments/blackout-dates/${id}`);
    return response.data;
  },

  // ==================== Appointments ====================

  getAppointments: async (params?: {
    status?: AppointmentStatus;
    serviceId?: string;
    resourceId?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await apiClient.get('/appointments', { params });
    return response.data;
  },

  getAppointment: async (id: string) => {
    const response = await apiClient.get(`/appointments/${id}`);
    return response.data;
  },

  createAppointment: async (data: Partial<Appointment>) => {
    const response = await apiClient.post('/appointments', data);
    return response.data;
  },

  updateAppointment: async (id: string, data: Partial<Appointment>) => {
    const response = await apiClient.put(`/appointments/${id}`, data);
    return response.data;
  },

  confirmAppointment: async (id: string) => {
    const response = await apiClient.put(`/appointments/${id}/confirm`);
    return response.data;
  },

  checkInAppointment: async (id: string) => {
    const response = await apiClient.put(`/appointments/${id}/checkin`);
    return response.data;
  },

  completeAppointment: async (id: string) => {
    const response = await apiClient.put(`/appointments/${id}/complete`);
    return response.data;
  },

  cancelAppointment: async (id: string, reason?: string) => {
    const response = await apiClient.put(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },

  markNoShow: async (id: string) => {
    const response = await apiClient.put(`/appointments/${id}/no-show`);
    return response.data;
  },

  // ==================== Availability & Booking ====================

  getAvailableSlots: async (serviceId: string, date: string, resourceId?: string) => {
    const response = await apiClient.get(`/appointments/services/${serviceId}/availability`, {
      params: { date, resourceId },
    });
    return response.data;
  },

  book: async (data: BookingRequest) => {
    const response = await apiClient.post('/appointments/book', data);
    return response.data;
  },

  getStatistics: async (startDate?: string, endDate?: string) => {
    const response = await apiClient.get('/appointments/statistics', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};
