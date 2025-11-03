import type { UUID, Timestamp, Money } from './common.types';

export interface Product {
  id: UUID;
  tenantId: UUID;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  cost: Money;
  price: Money;
  tax: TaxInfo;
  stock: StockInfo;
  images: string[];
  attributes: Record<string, unknown>;
  status: ProductStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

export interface TaxInfo {
  taxable: boolean;
  taxRate: number; // e.g., 0.21 for 21% IVA
  taxIncluded: boolean; // Si el precio incluye impuestos
}

export interface StockInfo {
  quantity: number;
  minQuantity: number; // Stock mínimo para alertas
  maxQuantity?: number; // Stock máximo
  unit: StockUnit;
  trackInventory: boolean;
}

export enum StockUnit {
  UNIT = 'unit',
  KG = 'kg',
  G = 'g',
  L = 'l',
  ML = 'ml',
  M = 'm',
  CM = 'cm',
}

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
  DISCONTINUED = 'discontinued',
}

export interface ProductVariant {
  id: UUID;
  productId: UUID;
  name: string;
  sku: string;
  barcode?: string;
  price: Money;
  stock: StockInfo;
  attributes: Record<string, string>; // e.g., { color: 'red', size: 'M' }
}

export interface ProductCategory {
  id: UUID;
  tenantId: UUID;
  name: string;
  description?: string;
  parentId?: UUID;
  order: number;
}

export type CreateProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export type UpdateProductInput = Partial<Omit<Product, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export interface BulkPriceUpdate {
  productIds: UUID[];
  adjustmentType: 'percentage' | 'fixed';
  adjustmentValue: number;
}
