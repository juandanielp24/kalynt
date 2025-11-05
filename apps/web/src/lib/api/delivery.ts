import { apiClient } from './client';

export interface DeliveryZone {
  id: string;
  name: string;
  description?: string;
  postalCodes?: string[];
  neighborhoods?: string[];
  baseCost: number;
  costPerKm: number;
  freeDeliveryMin?: number;
  estimatedMinutes: number;
  maxDeliveryTime: number;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  documentType?: string;
  documentNumber?: string;
  vehicleType: VehicleType;
  vehiclePlate?: string;
  vehicleModel?: string;
  status: DriverStatus;
  isActive: boolean;
  currentLat?: number;
  currentLng?: number;
  lastLocationUpdate?: string;
  rating?: number;
  totalDeliveries: number;
  createdAt: string;
  updatedAt: string;
}

export interface Delivery {
  id: string;
  deliveryNumber: string;
  saleId: string;
  driverId?: string;
  zoneId?: string;
  address: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode?: string;
  contactName: string;
  contactPhone: string;
  deliveryNotes?: string;
  deliveryCost: number;
  distance?: number;
  status: DeliveryStatus;
  scheduledFor?: string;
  estimatedArrival?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  sale?: any;
  driver?: Driver;
  zone?: DeliveryZone;
  statusHistory?: DeliveryStatusHistory[];
}

export interface DeliveryStatusHistory {
  id: string;
  fromStatus?: DeliveryStatus;
  toStatus: DeliveryStatus;
  notes?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export enum VehicleType {
  MOTORCYCLE = 'MOTORCYCLE',
  CAR = 'CAR',
  BICYCLE = 'BICYCLE',
  VAN = 'VAN',
  TRUCK = 'TRUCK',
  WALKING = 'WALKING',
}

export enum DriverStatus {
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
  BREAK = 'BREAK',
}

export enum DeliveryStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  RETURNED = 'RETURNED',
}

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  MOTORCYCLE: 'Motocicleta',
  CAR: 'Auto',
  BICYCLE: 'Bicicleta',
  VAN: 'Van',
  TRUCK: 'Camión',
  WALKING: 'A pie',
};

export const DRIVER_STATUS_LABELS: Record<DriverStatus, string> = {
  AVAILABLE: 'Disponible',
  BUSY: 'Ocupado',
  OFFLINE: 'Desconectado',
  BREAK: 'En descanso',
};

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  PENDING: 'Pendiente',
  ASSIGNED: 'Asignado',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En camino',
  ARRIVED: 'Llegó',
  DELIVERED: 'Entregado',
  FAILED: 'Fallido',
  CANCELLED: 'Cancelado',
  RETURNED: 'Devuelto',
};

export const deliveryApi = {
  // Deliveries
  getDeliveries: async (params?: {
    status?: DeliveryStatus;
    driverId?: string;
    zoneId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await apiClient.get('/delivery', { params });
    return response.data;
  },

  getDelivery: async (id: string) => {
    const response = await apiClient.get(`/delivery/${id}`);
    return response.data;
  },

  createDelivery: async (data: any) => {
    const response = await apiClient.post('/delivery', data);
    return response.data;
  },

  assignDriver: async (deliveryId: string, driverId: string) => {
    const response = await apiClient.put(`/delivery/${deliveryId}/assign`, { driverId });
    return response.data;
  },

  autoAssignDelivery: async (deliveryId: string) => {
    const response = await apiClient.put(`/delivery/${deliveryId}/auto-assign`);
    return response.data;
  },

  updateStatus: async (deliveryId: string, data: any) => {
    const response = await apiClient.put(`/delivery/${deliveryId}/status`, data);
    return response.data;
  },

  getStatistics: async (days?: number) => {
    const response = await apiClient.get('/delivery/stats', {
      params: { days },
    });
    return response.data;
  },

  // Zones
  getZones: async (includeInactive?: boolean) => {
    const response = await apiClient.get('/delivery/zones/all', {
      params: { includeInactive },
    });
    return response.data;
  },

  getZone: async (id: string) => {
    const response = await apiClient.get(`/delivery/zones/${id}`);
    return response.data;
  },

  createZone: async (data: Partial<DeliveryZone>) => {
    const response = await apiClient.post('/delivery/zones', data);
    return response.data;
  },

  updateZone: async (id: string, data: Partial<DeliveryZone>) => {
    const response = await apiClient.put(`/delivery/zones/${id}`, data);
    return response.data;
  },

  deleteZone: async (id: string) => {
    const response = await apiClient.delete(`/delivery/zones/${id}`);
    return response.data;
  },

  calculateDeliveryCost: async (data: {
    zoneId: string;
    orderTotal: number;
    distance?: number;
  }) => {
    const response = await apiClient.post('/delivery/zones/calculate-cost', data);
    return response.data;
  },

  // Drivers
  getDrivers: async (params?: { status?: DriverStatus; isActive?: boolean }) => {
    const response = await apiClient.get('/delivery/drivers/all', { params });
    return response.data;
  },

  getAvailableDrivers: async () => {
    const response = await apiClient.get('/delivery/drivers/available');
    return response.data;
  },

  getDriver: async (id: string) => {
    const response = await apiClient.get(`/delivery/drivers/${id}`);
    return response.data;
  },

  getDriverStatistics: async (id: string, days?: number) => {
    const response = await apiClient.get(`/delivery/drivers/${id}/stats`, {
      params: { days },
    });
    return response.data;
  },

  createDriver: async (data: Partial<Driver>) => {
    const response = await apiClient.post('/delivery/drivers', data);
    return response.data;
  },

  updateDriver: async (id: string, data: Partial<Driver>) => {
    const response = await apiClient.put(`/delivery/drivers/${id}`, data);
    return response.data;
  },

  updateDriverStatus: async (id: string, status: DriverStatus) => {
    const response = await apiClient.put(`/delivery/drivers/${id}/status`, { status });
    return response.data;
  },

  updateDriverLocation: async (id: string, latitude: number, longitude: number) => {
    const response = await apiClient.put(`/delivery/drivers/${id}/location`, {
      latitude,
      longitude,
    });
    return response.data;
  },

  deleteDriver: async (id: string) => {
    const response = await apiClient.delete(`/delivery/drivers/${id}`);
    return response.data;
  },

  // Settings
  getSettings: async () => {
    const response = await apiClient.get('/delivery/settings');
    return response.data;
  },

  updateSettings: async (data: any) => {
    const response = await apiClient.put('/delivery/settings', data);
    return response.data;
  },

  checkWorkingHours: async () => {
    const response = await apiClient.get('/delivery/settings/working-hours-check');
    return response.data;
  },
};
