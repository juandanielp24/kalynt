import { apiClient } from './client';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export const customersApi = {
  getCustomers: async (params?: { search?: string; limit?: number }) => {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },

  getCustomer: async (id: string) => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  createCustomer: async (data: Partial<Customer>) => {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },

  updateCustomer: async (id: string, data: Partial<Customer>) => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  },
};
