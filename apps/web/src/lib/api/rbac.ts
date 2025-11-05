import { apiClient } from './client';

export interface Permission {
  id: string;
  resource: string;
  action: string;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: Array<{
    permission: Permission;
  }>;
  _count?: {
    users: number;
  };
}

export const rbacApi = {
  // Roles
  getRoles: async () => {
    const response = await apiClient.get('/roles');
    return response.data;
  },

  createRole: async (data: {
    name: string;
    description?: string;
    permissionIds: string[];
  }) => {
    const response = await apiClient.post('/roles', data);
    return response.data;
  },

  updateRolePermissions: async (roleId: string, permissionIds: string[]) => {
    const response = await apiClient.put(`/roles/${roleId}/permissions`, {
      permissionIds,
    });
    return response.data;
  },

  deleteRole: async (roleId: string) => {
    const response = await apiClient.delete(`/roles/${roleId}`);
    return response.data;
  },

  assignRole: async (roleId: string, userId: string) => {
    const response = await apiClient.post(`/roles/${roleId}/assign`, { userId });
    return response.data;
  },

  // Permissions
  getPermissions: async () => {
    const response = await apiClient.get('/roles/permissions');
    return response.data;
  },

  getMyPermissions: async () => {
    const response = await apiClient.get('/roles/my-permissions');
    return response.data;
  },
};
