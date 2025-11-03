/**
 * Report Types and Enums
 * Defines all report-related types for the system
 */

export enum ReportType {
  SALES = 'sales',
  INVENTORY = 'inventory',
  FINANCIAL = 'financial',
  PRODUCTS = 'products',
  CUSTOMERS = 'customers',
  TAX = 'tax',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  CSV = 'csv',
}

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  locationId?: string;
  categoryId?: string;
  productId?: string;
  userId?: string;
  status?: string;
}

export interface ReportMetadata {
  title: string;
  description: string;
  generatedAt: Date;
  generatedBy: string;
  tenantName: string;
  filters: ReportFilters;
  totals?: Record<string, any>;
}

export interface ReportOptions {
  type: ReportType;
  format: ReportFormat;
  filters: ReportFilters;
  tenantId: string;
  userId: string;
  tenantName?: string;
}

// Sales Report Data
export interface SalesReportData {
  sales: Array<{
    saleNumber: string;
    date: Date;
    customerName?: string;
    items: number;
    subtotalCents: number;
    taxCents: number;
    totalCents: number;
    paymentMethod: string;
    location: string;
    status: string;
  }>;
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalTax: number;
    averageTicket: number;
    topProducts: Array<{ name: string; quantity: number; revenue: number }>;
  };
}

// Inventory Report Data
export interface InventoryReportData {
  products: Array<{
    sku: string;
    name: string;
    category: string;
    stock: number;
    minStock: number;
    maxStock: number;
    costCents: number;
    priceCents: number;
    totalValueCents: number;
    status: 'normal' | 'low' | 'out' | 'excess';
  }>;
  summary: {
    totalProducts: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    excessStockItems: number;
  };
}

// Financial Report Data
export interface FinancialReportData {
  revenue: {
    cash: number;
    card: number;
    transfer: number;
    mercadoPago: number;
    total: number;
  };
  expenses: {
    purchases: number;
    salaries: number;
    rent: number;
    utilities: number;
    other: number;
    total: number;
  };
  profit: {
    gross: number;
    net: number;
    margin: number;
  };
  taxes: {
    collected: number;
    paid: number;
    pending: number;
  };
}

// Product Performance Report Data
export interface ProductsReportData {
  products: Array<{
    name: string;
    sku: string;
    category: string;
    unitsSold: number;
    revenue: number;
    profit: number;
    margin: number;
  }>;
  summary: {
    topPerformers: Array<{ name: string; revenue: number }>;
    underperformers: Array<{ name: string; revenue: number }>;
    totalRevenue: number;
    totalProfit: number;
  };
}

// Customer Report Data
export interface CustomersReportData {
  customers: Array<{
    name: string;
    email: string;
    phone?: string;
    totalPurchases: number;
    totalSpent: number;
    averageTicket: number;
    lastPurchase: Date;
  }>;
  summary: {
    totalCustomers: number;
    newCustomers: number;
    repeatCustomers: number;
    totalRevenue: number;
    averageSpendPerCustomer: number;
  };
}

// Tax Report Data (AFIP-specific)
export interface TaxReportData {
  period: {
    startDate: Date;
    endDate: Date;
  };
  invoices: Array<{
    number: string;
    type: string;
    date: Date;
    customerCuit?: string;
    customerName?: string;
    netAmount: number;
    taxAmount: number;
    totalAmount: number;
    cae: string;
    status: string;
  }>;
  summary: {
    totalInvoices: number;
    totalNetAmount: number;
    totalTaxAmount: number;
    totalAmount: number;
    byInvoiceType: Record<string, { count: number; amount: number }>;
  };
}

export type ReportData =
  | SalesReportData
  | InventoryReportData
  | FinancialReportData
  | ProductsReportData
  | CustomersReportData
  | TaxReportData;
