import { apiClient } from '../api-client';

export interface Location {
  id: string;
  tenantId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QueryLocationsDto {
  page?: number;
  limit?: number;
  isActive?: boolean;
  search?: string;
}

export interface PaginatedLocationsResponse {
  data: Location[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Locations API client
 */
export const locationsApi = {
  /**
   * List all locations with filters
   * GET /locations
   */
  async findAll(query?: QueryLocationsDto): Promise<PaginatedLocationsResponse> {
    return apiClient.get<PaginatedLocationsResponse>('/locations', { params: query as any });
  },

  /**
   * Get a single location by ID
   * GET /locations/:id
   */
  async findOne(id: string): Promise<Location> {
    return apiClient.get<Location>(`/locations/${id}`);
  },
};
