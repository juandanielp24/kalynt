// Tipos base reutilizables
export type UUID = string; // UUID v7

export type Timestamp = Date;

// Money type - SIEMPRE almacenar en centavos (integers)
export interface Money {
  amount: number; // en centavos (ej: 1250 = $12.50)
  currency: 'ARS' | 'USD' | 'CLP'; // soportar multi-moneda
}

export interface Address {
  street: string;
  number: string;
  floor?: string;
  apartment?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: Record<string, unknown>;
}
