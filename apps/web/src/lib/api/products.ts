import { apiClient } from '../api-client';

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  priceCents: number;
  costCents: number;
  taxRate: number;
  categoryId?: string;
  category?: {
    id: string;
    name: string;
  };
  stock?: Array<{
    locationId: string;
    quantity: number;
    minQuantity: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface QueryProductsDto {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  locationId?: string;
  inStock?: boolean;
}

export interface PaginatedProductsResponse {
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Products API client
 */
export const productsApi = {
  /**
   * List all products with filters
   * GET /products
   */
  async findAll(query?: QueryProductsDto): Promise<PaginatedProductsResponse> {
    return apiClient.get<PaginatedProductsResponse>('/products', { params: query as any });
  },

  /**
   * Get all products (alias for findAll)
   * GET /products
   */
  async getProducts(query?: QueryProductsDto): Promise<PaginatedProductsResponse> {
    return apiClient.get<PaginatedProductsResponse>('/products', { params: query as any });
  },

  /**
   * Get a single product by ID
   * GET /products/:id
   */
  async findOne(id: string): Promise<Product> {
    return apiClient.get<Product>(`/products/${id}`);
  },

  /**
   * Search products by barcode
   * GET /products/barcode/:barcode
   */
  async findByBarcode(barcode: string): Promise<Product> {
    return apiClient.get<Product>(`/products/barcode/${barcode}`);
  },
};
