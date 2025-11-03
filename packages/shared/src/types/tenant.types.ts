import type { UUID, Timestamp, Address } from './common.types';

export interface Tenant {
  id: UUID;
  name: string;
  businessName: string;
  cuit: string;
  taxCategory: TaxCategory;
  address: Address;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  status: TenantStatus;
  settings: TenantSettings;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

export enum TaxCategory {
  RESPONSABLE_INSCRIPTO = 'responsable_inscripto',
  MONOTRIBUTO = 'monotributo',
  EXENTO = 'exento',
  CONSUMIDOR_FINAL = 'consumidor_final',
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
  CANCELLED = 'cancelled',
}

export interface TenantSettings {
  timezone: string; // e.g., 'America/Argentina/Buenos_Aires'
  currency: 'ARS' | 'USD' | 'CLP';
  locale: string; // e.g., 'es-AR'
  fiscalPeriodStart: string; // MM-DD format, e.g., '01-01'
  invoicePrefix?: string; // e.g., 'A-0001'
  pointOfSale?: string; // Punto de venta AFIP
  features: TenantFeatures;
}

export interface TenantFeatures {
  inventory: boolean;
  multiStore: boolean;
  loyaltyProgram: boolean;
  electronicInvoicing: boolean;
  advancedReports: boolean;
}

export type CreateTenantInput = Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'status'>;

export type UpdateTenantInput = Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;
