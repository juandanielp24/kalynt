/**
 * Tipos para integración con AFIP
 */

/**
 * Configuración de AFIP
 */
export interface AFIPConfig {
  cuit: string;
  certPath: string;
  keyPath: string;
  production: boolean;
  puntoVenta: number;
}

/**
 * Ticket de autenticación de WSAA
 */
export interface AFIPAuthTicket {
  token: string;
  sign: string;
  expiresAt: Date;
}

/**
 * Request de factura para AFIP
 */
export interface AFIPInvoiceRequest {
  tipo_comprobante: number;
  punto_venta: number;
  concepto: number;
  tipo_documento: number;
  numero_documento: string;
  fecha_comprobante: string; // YYYYMMDD
  fecha_vencimiento_pago?: string; // YYYYMMDD (solo para servicios)
  fecha_servicio_desde?: string; // YYYYMMDD (solo para servicios)
  fecha_servicio_hasta?: string; // YYYYMMDD (solo para servicios)
  importe_total: number;
  importe_neto: number;
  importe_iva: number;
  importe_tributos: number;
  importe_operaciones_exentas: number;
  codigo_moneda: string; // 'PES', 'DOL', etc.
  cotizacion_moneda: number; // 1 para pesos
  iva?: Array<{
    codigo: number;
    base_imponible: number;
    importe: number;
  }>;
  tributos?: Array<{
    codigo: number;
    descripcion: string;
    base_imponible: number;
    alicuota: number;
    importe: number;
  }>;
}

/**
 * Respuesta de generación de factura de AFIP
 */
export interface AFIPInvoiceResponse {
  success: boolean;
  cae?: string;
  cae_vencimiento?: string;
  numero_comprobante?: number;
  fecha_proceso?: string;
  resultado?: string;
  errors?: Array<{
    code: number;
    message: string;
  }>;
  observaciones?: Array<{
    code: number;
    message: string;
  }>;
  qr_code?: string;
}

/**
 * Request simplificado para generar factura desde una venta
 */
export interface GenerateInvoiceRequest {
  saleId: string;
  tenantId: string;
  invoiceType: 'A' | 'B' | 'C' | 'E';
  customerCuit?: string;
  customerName?: string;
  customerDocumentType?: number;
  customerDocumentNumber?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number; // En centavos
    taxRate: number;
    total: number; // En centavos
  }>;
  subtotal: number; // En centavos
  tax: number; // En centavos
  total: number; // En centavos
  associatedInvoice?: {
    type: number;
    pointOfSale: number;
    number: number;
  };
}

/**
 * Estado del servidor AFIP
 */
export interface AFIPServerStatus {
  appserver: string;
  dbserver: string;
  authserver: string;
}

/**
 * Punto de venta
 */
export interface SalesPoint {
  numero: number;
  bloqueado: boolean;
  fecha_baja?: string;
  tipo_emision: string;
}

/**
 * Condiciones fiscales
 */
export type FiscalCondition =
  | 'RESPONSABLE_INSCRIPTO'
  | 'RESPONSABLE_MONOTRIBUTO'
  | 'EXENTO'
  | 'CONSUMIDOR_FINAL'
  | 'RESPONSABLE_NO_INSCRIPTO';

/**
 * Datos para generar QR de factura
 */
export interface InvoiceQRData {
  cuit: string;
  pointOfSale: number;
  invoiceType: number;
  invoiceNumber: number;
  total: number;
  currency: string;
  cae: string;
  caeExpiration: string;
  documentType: number;
  documentNumber: string;
}

/**
 * Información completa de factura consultada
 */
export interface AFIPInvoiceData {
  tipo_comprobante: number;
  punto_venta: number;
  numero_comprobante: number;
  fecha_comprobante: string;
  concepto: number;
  tipo_documento: number;
  numero_documento: string;
  importe_total: number;
  importe_neto: number;
  importe_iva: number;
  importe_tributos: number;
  importe_operaciones_exentas: number;
  iva: Array<{
    codigo: number;
    base_imponible: number;
    importe: number;
  }>;
  items?: Array<{
    codigo: string;
    descripcion: string;
    cantidad: number;
    unidad_medida: string;
    precio_unitario: number;
    importe_iva: number;
    importe_total: number;
  }>;
  codigo_moneda: string;
  cotizacion_moneda: number;
  comprobantes_asociados?: Array<{
    tipo: number;
    punto_venta: number;
    numero: number;
  }>;
}
