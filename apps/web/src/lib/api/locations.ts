import { apiClient } from '../api-client';

export interface Location {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  type: LocationType;
  status?: LocationStatus;
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  latitude?: string;
  longitude?: string;
  isWarehouse?: boolean;
  openingHours?: any;
  maxCapacity?: number;
  squareMeters?: string;
  isActive: boolean;
  franchiseId?: string;
  parentId?: string;
  managerId?: string;
  createdAt: string;
  updatedAt: string;
  franchise?: Franchise;
  parent?: Location;
  children?: Location[];
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    stock: number;
    inventory: number;
    sales: number;
    transfersFrom: number;
    transfersTo: number;
    userLocations: number;
  };
}

export interface LocationInventory {
  id: string;
  tenantId: string;
  locationId: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  aisle?: string;
  shelf?: string;
  bin?: string;
  lastCountDate?: string;
  lastCountQuantity?: number;
  product?: any;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransfer {
  id: string;
  tenantId: string;
  transferNumber: string;
  fromLocationId: string;
  toLocationId: string;
  status: TransferStatus;
  requestedById: string;
  approvedById?: string;
  sentById?: string;
  receivedById?: string;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  sentAt?: string;
  receivedAt?: string;
  cancelledAt?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  estimatedArrival?: string;
  notes?: string;
  internalNotes?: string;
  fromLocation?: Location;
  toLocation?: Location;
  requestedBy?: {
    id: string;
    name: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  };
  sentBy?: {
    id: string;
    name: string;
    email: string;
  };
  receivedBy?: {
    id: string;
    name: string;
    email: string;
  };
  items?: StockTransferItem[];
  _count?: {
    items: number;
  };
}

export interface StockTransferItem {
  id: string;
  transferId: string;
  productId: string;
  quantityRequested: number;
  quantitySent?: number;
  quantityReceived?: number;
  productName: string;
  productSku: string;
  notes?: string;
  product?: any;
  createdAt: string;
  updatedAt: string;
}

export interface Franchise {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  initialFee: number;
  royaltyPercentage: number;
  marketingFee: number;
  contractYears: number;
  renewalTerms?: string;
  trainingIncluded: boolean;
  ongoingSupport: boolean;
  territory?: string;
  exclusiveTerritory: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    locations: number;
    franchisees: number;
    royalties: number;
  };
}

export interface Franchisee {
  id: string;
  tenantId: string;
  franchiseId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  taxId?: string;
  status: FranchiseeStatus;
  contractStartDate?: string;
  contractEndDate?: string;
  signedDate?: string;
  initialFeePaid: boolean;
  initialFeeAmount?: number;
  paymentDay?: number;
  contractDocumentUrl?: string;
  notes?: string;
  franchise?: Franchise;
  createdAt: string;
  updatedAt: string;
  _count?: {
    royalties: number;
  };
}

export interface FranchiseRoyalty {
  id: string;
  tenantId: string;
  franchiseId: string;
  franchiseeId: string;
  periodStart: string;
  periodEnd: string;
  grossSales: number;
  royaltyRate: number;
  royaltyAmount: number;
  marketingFee: number;
  totalDue: number;
  status: RoyaltyStatus;
  dueDate: string;
  paidDate?: string;
  paidAmount?: number;
  notes?: string;
  franchise?: Franchise;
  franchisee?: Franchisee;
  createdAt: string;
  updatedAt: string;
}

export enum LocationType {
  STORE = 'STORE',
  WAREHOUSE = 'WAREHOUSE',
  OFFICE = 'OFFICE',
  ONLINE = 'ONLINE',
  FRANCHISE = 'FRANCHISE',
  POP_UP = 'POP_UP',
  KIOSK = 'KIOSK',
}

export enum LocationStatus {
  PLANNING = 'PLANNING',
  CONSTRUCTION = 'CONSTRUCTION',
  ACTIVE = 'ACTIVE',
  TEMPORARILY_CLOSED = 'TEMPORARILY_CLOSED',
  CLOSED = 'CLOSED',
}

export enum TransferStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  IN_TRANSIT = 'IN_TRANSIT',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

export enum FranchiseeStatus {
  PROSPECT = 'PROSPECT',
  IN_PROCESS = 'IN_PROCESS',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TERMINATED = 'TERMINATED',
}

export enum RoyaltyStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  WAIVED = 'WAIVED',
}

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  STORE: 'Tienda',
  WAREHOUSE: 'Almacén',
  OFFICE: 'Oficina',
  ONLINE: 'Online',
  FRANCHISE: 'Franquicia',
  POP_UP: 'Pop-up',
  KIOSK: 'Kiosko',
};

export const LOCATION_STATUS_LABELS: Record<LocationStatus, string> = {
  PLANNING: 'Planificación',
  CONSTRUCTION: 'En Construcción',
  ACTIVE: 'Activa',
  TEMPORARILY_CLOSED: 'Cerrada Temporalmente',
  CLOSED: 'Cerrada',
};

export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobada',
  IN_TRANSIT: 'En Tránsito',
  RECEIVED: 'Recibida',
  CANCELLED: 'Cancelada',
  REJECTED: 'Rechazada',
};

export const FRANCHISEE_STATUS_LABELS: Record<FranchiseeStatus, string> = {
  PROSPECT: 'Prospecto',
  IN_PROCESS: 'En Proceso',
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  TERMINATED: 'Terminado',
};

export const ROYALTY_STATUS_LABELS: Record<RoyaltyStatus, string> = {
  PENDING: 'Pendiente',
  PAID: 'Pagado',
  OVERDUE: 'Vencido',
  WAIVED: 'Exonerado',
};

export const locationsApi = {
  // ==================== Locations ====================

  getLocations: async (params?: {
    type?: LocationType;
    status?: LocationStatus;
  }) => {
    const response = await apiClient.get('/locations', { params });
    return response.data;
  },

  getMyLocations: async () => {
    const response = await apiClient.get('/locations/my-locations');
    return response.data;
  },

  getLocation: async (id: string) => {
    const response = await apiClient.get(`/locations/${id}`);
    return response.data;
  },

  createLocation: async (data: Partial<Location>) => {
    const response = await apiClient.post('/locations', data);
    return response.data;
  },

  updateLocation: async (id: string, data: Partial<Location>) => {
    const response = await apiClient.put(`/locations/${id}`, data);
    return response.data;
  },

  deleteLocation: async (id: string) => {
    const response = await apiClient.delete(`/locations/${id}`);
    return response.data;
  },

  changeStatus: async (id: string, status: LocationStatus) => {
    const response = await apiClient.put(`/locations/${id}/status`, { status });
    return response.data;
  },

  getStatistics: async (id: string) => {
    const response = await apiClient.get(`/locations/${id}/statistics`);
    return response.data;
  },

  assignUser: async (locationId: string, userId: string, isManager?: boolean) => {
    const response = await apiClient.post(`/locations/${locationId}/users`, {
      userId,
      isManager,
    });
    return response.data;
  },

  removeUser: async (locationId: string, userId: string) => {
    const response = await apiClient.delete(
      `/locations/${locationId}/users/${userId}`,
    );
    return response.data;
  },

  // ==================== Inventory ====================

  getLocationInventory: async (
    locationId: string,
    params?: {
      productId?: string;
      lowStock?: boolean;
      search?: string;
    },
  ) => {
    const response = await apiClient.get(`/locations/${locationId}/inventory`, {
      params,
    });
    return response.data;
  },

  getInventoryValuation: async (locationId: string) => {
    const response = await apiClient.get(
      `/locations/${locationId}/inventory/valuation`,
    );
    return response.data;
  },

  updateInventory: async (
    locationId: string,
    productId: string,
    data: Partial<LocationInventory>,
  ) => {
    const response = await apiClient.put(
      `/locations/${locationId}/inventory/${productId}`,
      data,
    );
    return response.data;
  },

  adjustInventory: async (
    locationId: string,
    productId: string,
    data: { adjustment: number; reason: string },
  ) => {
    const response = await apiClient.post(
      `/locations/${locationId}/inventory/${productId}/adjust`,
      data,
    );
    return response.data;
  },

  syncProduct: async (
    locationId: string,
    productId: string,
    initialQuantity?: number,
  ) => {
    const response = await apiClient.post(
      `/locations/${locationId}/inventory/sync-product`,
      { productId, initialQuantity },
    );
    return response.data;
  },

  getRestockSuggestions: async (locationId: string) => {
    const response = await apiClient.get(
      `/locations/${locationId}/inventory/restock-suggestions`,
    );
    return response.data;
  },

  // ==================== Stock Transfers ====================

  getTransfers: async (params?: {
    status?: TransferStatus;
    fromLocationId?: string;
    toLocationId?: string;
  }) => {
    const response = await apiClient.get('/locations/transfers/all', { params });
    return response.data;
  },

  getTransfer: async (id: string) => {
    const response = await apiClient.get(`/locations/transfers/${id}`);
    return response.data;
  },

  createTransfer: async (data: {
    fromLocationId: string;
    toLocationId: string;
    items: Array<{
      productId: string;
      quantityRequested: number;
      notes?: string;
    }>;
    notes?: string;
    internalNotes?: string;
    shippingMethod?: string;
    estimatedArrival?: Date;
  }) => {
    const response = await apiClient.post('/locations/transfers', data);
    return response.data;
  },

  approveTransfer: async (id: string) => {
    const response = await apiClient.put(`/locations/transfers/${id}/approve`);
    return response.data;
  },

  rejectTransfer: async (id: string, reason: string) => {
    const response = await apiClient.put(`/locations/transfers/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  shipTransfer: async (id: string, data?: any) => {
    const response = await apiClient.put(`/locations/transfers/${id}/ship`, data);
    return response.data;
  },

  receiveTransfer: async (id: string, data: any) => {
    const response = await apiClient.put(
      `/locations/transfers/${id}/receive`,
      data,
    );
    return response.data;
  },

  completeTransfer: async (id: string) => {
    const response = await apiClient.put(`/locations/transfers/${id}/complete`);
    return response.data;
  },

  cancelTransfer: async (id: string, reason: string) => {
    const response = await apiClient.put(`/locations/transfers/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  getTransferStatistics: async (params?: {
    locationId?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await apiClient.get('/locations/transfers/statistics', {
      params,
    });
    return response.data;
  },

  // ==================== Franchises ====================

  getFranchises: async (isActive?: boolean) => {
    const response = await apiClient.get('/locations/franchises/all', {
      params: { isActive },
    });
    return response.data;
  },

  getFranchise: async (id: string) => {
    const response = await apiClient.get(`/locations/franchises/${id}`);
    return response.data;
  },

  createFranchise: async (data: Partial<Franchise>) => {
    const response = await apiClient.post('/locations/franchises', data);
    return response.data;
  },

  updateFranchise: async (id: string, data: Partial<Franchise>) => {
    const response = await apiClient.put(`/locations/franchises/${id}`, data);
    return response.data;
  },

  deleteFranchise: async (id: string) => {
    const response = await apiClient.delete(`/locations/franchises/${id}`);
    return response.data;
  },

  getFranchiseStatistics: async (id: string) => {
    const response = await apiClient.get(
      `/locations/franchises/${id}/statistics`,
    );
    return response.data;
  },

  // ==================== Franchisees ====================

  getFranchisees: async (params?: {
    franchiseId?: string;
    status?: FranchiseeStatus;
  }) => {
    const response = await apiClient.get('/locations/franchisees/all', {
      params,
    });
    return response.data;
  },

  getFranchisee: async (id: string) => {
    const response = await apiClient.get(`/locations/franchisees/${id}`);
    return response.data;
  },

  createFranchisee: async (data: Partial<Franchisee>) => {
    const response = await apiClient.post('/locations/franchisees', data);
    return response.data;
  },

  updateFranchisee: async (id: string, data: Partial<Franchisee>) => {
    const response = await apiClient.put(`/locations/franchisees/${id}`, data);
    return response.data;
  },

  calculateRoyalties: async (
    franchiseeId: string,
    periodStart: string,
    periodEnd: string,
  ) => {
    const response = await apiClient.post(
      `/locations/franchisees/${franchiseeId}/calculate-royalties`,
      { periodStart, periodEnd },
    );
    return response.data;
  },

  markRoyaltyPaid: async (
    royaltyId: string,
    data: { paymentMethod: string; transactionId?: string },
  ) => {
    const response = await apiClient.put(
      `/locations/royalties/${royaltyId}/mark-paid`,
      data,
    );
    return response.data;
  },
};
