import { apiClient } from '../api-client';

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  filters?: any;
  fileUrl?: string;
  fileSize?: number;
  generatedAt?: string;
  generatedBy?: {
    id: string;
    name: string;
    email: string;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ReportType {
  SALES_SUMMARY = 'SALES_SUMMARY',
  SALES_DETAIL = 'SALES_DETAIL',
  INVENTORY_STOCK = 'INVENTORY_STOCK',
  INVENTORY_MOVEMENTS = 'INVENTORY_MOVEMENTS',
  PRODUCTS_PERFORMANCE = 'PRODUCTS_PERFORMANCE',
  PURCHASE_ORDERS = 'PURCHASE_ORDERS',
  SUPPLIERS_SUMMARY = 'SUPPLIERS_SUMMARY',
  FINANCIAL_SUMMARY = 'FINANCIAL_SUMMARY',
  CASH_FLOW = 'CASH_FLOW',
  LOCATION_COMPARISON = 'LOCATION_COMPARISON',
}

export enum ReportFormat {
  PDF = 'PDF',
  EXCEL = 'EXCEL',
  CSV = 'CSV',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  SALES_SUMMARY: 'Resumen de Ventas',
  SALES_DETAIL: 'Detalle de Ventas',
  INVENTORY_STOCK: 'Estado de Inventario',
  INVENTORY_MOVEMENTS: 'Movimientos de Stock',
  PRODUCTS_PERFORMANCE: 'Performance de Productos',
  PURCHASE_ORDERS: 'Órdenes de Compra',
  SUPPLIERS_SUMMARY: 'Resumen por Proveedor',
  FINANCIAL_SUMMARY: 'Resumen Financiero',
  CASH_FLOW: 'Flujo de Caja',
  LOCATION_COMPARISON: 'Comparación entre Ubicaciones',
};

export interface ReportsResponse {
  data: {
    reports: Report[];
    total: number;
    page: number;
    totalPages: number;
  };
}

export interface CreateReportDto {
  name: string;
  type: ReportType;
  format: ReportFormat;
  filters?: any;
}

/**
 * Reports API client
 */
export const reportsApi = {
  /**
   * Get all reports with filters
   * GET /reports
   */
  async getReports(params?: {
    type?: ReportType;
    status?: ReportStatus;
    limit?: number;
    offset?: number;
  }): Promise<ReportsResponse> {
    const response = await apiClient.get<ReportsResponse>('/reports', { params: params as any });
    return response.data;
  },

  /**
   * Get a single report by ID
   * GET /reports/:id
   */
  async getReport(id: string): Promise<Report> {
    const response = await apiClient.get<Report>(`/reports/${id}`);
    return response.data;
  },

  /**
   * Create a new report
   * POST /reports
   */
  async createReport(data: CreateReportDto): Promise<Report> {
    const response = await apiClient.post<Report>('/reports', data);
    return response.data;
  },

  /**
   * Download report file
   * GET /reports/:id/download
   */
  async downloadReport(id: string): Promise<Blob> {
    const response = await apiClient.get(`/reports/${id}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Delete a report
   * DELETE /reports/:id
   */
  async deleteReport(id: string): Promise<{ success: boolean }> {
    const response = await apiClient.delete<{ success: boolean }>(`/reports/${id}`);
    return response.data;
  },
};
