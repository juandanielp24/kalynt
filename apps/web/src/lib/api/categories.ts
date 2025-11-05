import { apiClient } from '../api-client';

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export const categoriesApi = {
  getCategories: async () => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  getCategory: async (id: string) => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },
};
