import { apiClient } from '../api-client';

export enum PaymentMethod {
  CASH = 'CASH',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
  MERCADO_PAGO = 'MERCADO_PAGO',
  MODO = 'MODO',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum SaleStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPriceCents: number;
  taxRate: number;
  discountCents: number;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
}

export interface Sale {
  id: string;
  tenantId: string;
  userId: string;
  locationId: string;
  saleNumber: string;
  saleDate: string;
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: SaleStatus;
  customerName?: string;
  customerCuit?: string;
  customerEmail?: string;
  customerPhone?: string;
  invoiceType?: 'A' | 'B' | 'C';
  invoiceNumber?: string;
  cae?: string;
  caeExpiration?: string;
  notes?: any;
  items?: SaleItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSaleItemDto {
  productId: string;
  quantity: number;
  unitPriceCents: number;
  discountCents?: number;
}

export interface CreateSaleDto {
  locationId: string;
  items: CreateSaleItemDto[];
  paymentMethod: PaymentMethod;
  discountCents?: number;
  customerName?: string;
  customerCuit?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

export interface CompleteSaleDto {
  // Optional additional data when completing
}

export interface QuerySalesDto {
  page?: number;
  limit?: number;
  status?: SaleStatus;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  locationId?: string;
}

export interface PaginatedSalesResponse {
  data: Sale[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CompleteSaleResponse {
  success: boolean;
  sale: Sale;
  invoice: {
    cae?: string;
    cae_vencimiento?: string;
    numero_comprobante?: number;
    fecha_proceso?: string;
    qr_code?: string;
  };
}

export interface AFIPStatusResponse {
  appserver: string;
  dbserver: string;
  authserver: string;
  error?: string;
}

/**
 * Sales API client
 */
export const salesApi = {
  /**
   * List all sales with filters
   * GET /sales
   */
  async findAll(query?: QuerySalesDto): Promise<PaginatedSalesResponse> {
    return apiClient.get<PaginatedSalesResponse>('/sales', { params: query as any });
  },

  /**
   * Get a single sale by ID
   * GET /sales/:id
   */
  async findOne(id: string): Promise<Sale> {
    return apiClient.get<Sale>(`/sales/${id}`);
  },

  /**
   * Create a new sale (draft)
   * POST /sales
   */
  async create(dto: CreateSaleDto): Promise<Sale> {
    return apiClient.post<Sale>('/sales', dto);
  },

  /**
   * Complete a sale and generate AFIP invoice
   * POST /sales/:id/complete
   */
  async complete(id: string, dto?: CompleteSaleDto): Promise<CompleteSaleResponse> {
    return apiClient.post<CompleteSaleResponse>(`/sales/${id}/complete`, dto);
  },

  /**
   * Cancel a sale and restore stock
   * DELETE /sales/:id
   */
  async cancel(id: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/sales/${id}`);
  },

  /**
   * Get AFIP server status
   * GET /sales/afip/status
   */
  async getAFIPStatus(): Promise<AFIPStatusResponse> {
    return apiClient.get<AFIPStatusResponse>('/sales/afip/status');
  },
};
