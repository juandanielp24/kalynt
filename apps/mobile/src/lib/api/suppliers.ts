import { apiClient } from './client';

export interface Supplier {
  id: string;
  name: string;
  code: string;
  taxId?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  paymentTerms?: string;
  currency: string;
  bankName?: string;
  bankAccount?: string;
  notes?: string;
  isActive: boolean;
  _count?: {
    purchaseOrders: number;
    products: number;
  };
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  supplier: Supplier;
  location?: any;
  items: any[];
  payments?: any[];
  subtotal: number;
  taxAmount: number;
  discount: number;
  shippingCost: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  internalNotes?: string;
  _count?: {
    items: number;
  };
}

export const suppliersApi = {
  // Suppliers
  getSuppliers: async (params?: { search?: string; includeInactive?: boolean }) => {
    return apiClient.get('/suppliers', { params });
  },

  getSupplier: async (id: string) => {
    return apiClient.get(`/suppliers/${id}`);
  },

  createSupplier: async (data: Partial<Supplier>) => {
    return apiClient.post('/suppliers', data);
  },

  updateSupplier: async (id: string, data: Partial<Supplier>) => {
    return apiClient.put(`/suppliers/${id}`, data);
  },

  deleteSupplier: async (id: string) => {
    return apiClient.delete(`/suppliers/${id}`);
  },

  getSupplierStats: async (id: string, months: number = 12) => {
    return apiClient.get(`/suppliers/${id}/stats`, { params: { months } });
  },

  // Purchase Orders
  getPurchaseOrders: async (params?: {
    status?: string;
    supplierId?: string;
    locationId?: string;
  }) => {
    return apiClient.get('/purchase-orders', { params });
  },

  getPurchaseOrder: async (id: string) => {
    return apiClient.get(`/purchase-orders/${id}`);
  },

  createPurchaseOrder: async (data: any) => {
    return apiClient.post('/purchase-orders', data);
  },

  updatePurchaseOrder: async (id: string, data: any) => {
    return apiClient.put(`/purchase-orders/${id}`, data);
  },

  deletePurchaseOrder: async (id: string) => {
    return apiClient.delete(`/purchase-orders/${id}`);
  },

  sendPurchaseOrder: async (id: string) => {
    return apiClient.put(`/purchase-orders/${id}/send`);
  },

  confirmPurchaseOrder: async (id: string) => {
    return apiClient.put(`/purchase-orders/${id}/confirm`);
  },

  receivePurchaseOrder: async (
    id: string,
    data: {
      items: Array<{ itemId: string; quantityReceived: number }>;
      receivedDate?: string;
    }
  ) => {
    return apiClient.put(`/purchase-orders/${id}/receive`, data);
  },

  cancelPurchaseOrder: async (id: string, reason: string) => {
    return apiClient.put(`/purchase-orders/${id}/cancel`, { reason });
  },

  getPurchaseOrderStats: async () => {
    return apiClient.get('/purchase-orders/stats');
  },

  getReorderSuggestions: async (locationId?: string) => {
    return apiClient.get('/purchase-orders/reorder-suggestions', {
      params: { locationId },
    });
  },

  // Payments
  createPayment: async (data: {
    purchaseOrderId: string;
    amount: number;
    paymentMethod: string;
    paymentDate?: string;
    reference?: string;
    notes?: string;
  }) => {
    return apiClient.post('/payments', data);
  },

  deletePayment: async (id: string) => {
    return apiClient.delete(`/payments/${id}`);
  },

  // Supplier Products
  getSupplierProducts: async (supplierId: string) => {
    return apiClient.get(`/suppliers/${supplierId}/products`);
  },

  addProductToSupplier: async (
    supplierId: string,
    data: {
      productId: string;
      supplierSku?: string;
      cost: number;
      minOrderQty?: number;
      leadTimeDays?: number;
      isPreferred?: boolean;
    }
  ) => {
    return apiClient.post(`/suppliers/${supplierId}/products`, data);
  },

  updateSupplierProduct: async (productId: string, data: any) => {
    return apiClient.put(`/suppliers/products/${productId}`, data);
  },

  removeProductFromSupplier: async (productId: string) => {
    return apiClient.delete(`/suppliers/products/${productId}`);
  },

  getPurchaseHistory: async (supplierId: string, params?: { limit?: number }) => {
    return apiClient.get(`/suppliers/${supplierId}/purchase-history`, { params });
  },
};
