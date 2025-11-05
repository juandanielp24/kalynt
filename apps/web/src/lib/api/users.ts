import { apiClient } from './client';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  roleId?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Users API client
 */
export const usersApi = {
  /**
   * Get all users in the tenant
   * GET /users
   */
  getUsers: async (params?: { includeInactive?: boolean }) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  /**
   * Get a single user by ID
   * GET /users/:id
   */
  getUser: async (id: string) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },
};
