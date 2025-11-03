/**
 * AFIP/ARCA Types for Electronic Invoicing
 * Argentina Tax Authority Integration
 *
 * Based on:
 * - AFIP Web Services Specification
 * - RG 5614/2024 (new IVA discrimination rules)
 */

export interface AFIPConfig {
  cuit: string;
  certPath: string;
  keyPath: string;
  production: boolean;
  puntoVenta: number; // Punto de venta electrónico
}

export interface AFIPAuthToken {
  token: string;
  sign: string;
  expiresAt: Date;
}

/**
 * Tipos de comprobante según AFIP
 * Ver: http://www.afip.gob.ar/fe/documentos/TABLADETALLE2WSFEV1.xls
 */
export enum AFIPInvoiceType {
  FACTURA_A = 1,
  NOTA_DEBITO_A = 2,
  NOTA_CREDITO_A = 3,
  FACTURA_B = 6,
  NOTA_DEBITO_B = 7,
  NOTA_CREDITO_B = 8,
  FACTURA_C = 11,
  NOTA_DEBITO_C = 12,
  NOTA_CREDITO_C = 13,
  FACTURA_E = 19,  // Factura de exportación
  NOTA_CREDITO_E = 20,
  NOTA_DEBITO_E = 21,
}

/**
 * Tipos de documento según AFIP
 */
export enum AFIPDocumentType {
  CUIT = 80,
  CUIL = 86,
  CDI = 87,  // Cédula de Identidad
  LE = 89,   // Libreta de Enrolamiento
  LC = 90,   // Libreta Cívica
  DNI = 96,
  PASAPORTE = 94,
  CI_EXTRANJERA = 91,
  SIN_IDENTIFICAR = 0,
  CONSUMIDOR_FINAL = 99,
}

/**
 * Concepto del comprobante
 */
export enum AFIPConceptType {
  PRODUCTOS = 1,
  SERVICIOS = 2,
  PRODUCTOS_Y_SERVICIOS = 3,
}

/**
 * Códigos de IVA según AFIP
 */
export enum AFIPIVACode {
  IVA_0 = 3,      // 0%
  IVA_10_5 = 4,   // 10.5%
  IVA_21 = 5,     // 21%
  IVA_27 = 6,     // 27%
  IVA_5 = 8,      // 5%
  IVA_2_5 = 9,    // 2.5%
  IVA_EXENTO = 2, // Exento
  IVA_NO_GRAVADO = 1, // No gravado
}

/**
 * Datos para generar comprobante AFIP
 * Según especificación WSFEV1
 */
export interface AFIPInvoiceData {
  // Tipo de comprobante
  tipo_comprobante: AFIPInvoiceType;
  punto_venta: number;
  numero_comprobante: number;
  fecha_comprobante: string; // YYYYMMDD
  concepto: AFIPConceptType;

  // Cliente
  tipo_documento: AFIPDocumentType;
  numero_documento: string;

  // Importes (todos en pesos, con 2 decimales)
  // RG 5614/2024: Discriminar IVA incluso en tipo B
  importe_total: number;
  importe_neto: number;
  importe_iva: number;
  importe_tributos: number;
  importe_operaciones_exentas: number;

  // IVA discriminado (obligatorio desde RG 5614/2024)
  iva?: Array<{
    codigo: AFIPIVACode;
    base_imponible: number;
    importe: number;
  }>;

  // Tributos adicionales (percepciones, retenciones)
  tributos?: Array<{
    codigo: number;
    descripcion: string;
    base_imponible: number;
    alicuota: number;
    importe: number;
  }>;

  // Opcional: items del comprobante (no obligatorio en WSFEV1)
  items?: Array<{
    codigo: string;
    descripcion: string;
    cantidad: number;
    unidad_medida: string;
    precio_unitario: number;
    importe_iva: number;
    importe_total: number;
  }>;

  // Moneda
  codigo_moneda: string; // 'PES' = Pesos argentinos, 'DOL' = Dólares
  cotizacion_moneda: number; // Cotización, 1 para pesos

  // Fechas para servicios (solo si concepto es 2 o 3)
  fecha_servicio_desde?: string; // YYYYMMDD
  fecha_servicio_hasta?: string; // YYYYMMDD
  fecha_vencimiento_pago?: string; // YYYYMMDD

  // Comprobantes asociados (para notas de crédito/débito)
  comprobantes_asociados?: Array<{
    tipo: AFIPInvoiceType;
    punto_venta: number;
    numero: number;
    cuit?: string;
  }>;

  // Opcional: CBU para pagos
  cbu?: string;

  // Opcional: alias del CBU
  alias_cbu?: string;
}

/**
 * Respuesta de AFIP al generar comprobante
 */
export interface AFIPInvoiceResponse {
  success: boolean;

  // Datos del comprobante aprobado
  cae?: string; // Código Autorización Electrónico
  cae_vencimiento?: string; // Fecha vencimiento CAE (YYYYMMDD)
  numero_comprobante?: number;
  fecha_proceso?: string; // Fecha de proceso AFIP
  resultado?: string; // 'A' = Aprobado, 'R' = Rechazado

  // Errores y observaciones
  errors?: Array<{
    code: number;
    message: string;
  }>;

  observations?: Array<{
    code: number;
    message: string;
  }>;

  // Eventos (informativos)
  events?: Array<{
    code: number;
    message: string;
  }>;

  // QR code para factura (opcional)
  qr_code?: string;
}

/**
 * Request para generar factura desde el sistema
 */
export interface InvoiceGenerationRequest {
  saleId: string;
  tenantId: string;
  invoiceType: 'A' | 'B' | 'C' | 'E'; // Tipo de factura simplificado

  // Datos del cliente
  customerCuit?: string;
  customerName?: string;
  customerDocumentType?: AFIPDocumentType;
  customerDocumentNumber?: string;

  // Items de la factura
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number; // En centavos
    taxRate: number; // 0.21 para IVA 21%
    total: number; // En centavos
  }>;

  // Totales en centavos
  subtotal: number;
  tax: number;
  total: number;

  // Opcional: comprobante asociado (para notas de crédito/débito)
  associatedInvoice?: {
    type: AFIPInvoiceType;
    pointOfSale: number;
    number: number;
  };
}

/**
 * Condición fiscal del contribuyente
 */
export enum FiscalCondition {
  RESPONSABLE_INSCRIPTO = 'RI',
  MONOTRIBUTISTA = 'MONO',
  EXENTO = 'EXENTO',
  CONSUMIDOR_FINAL = 'CF',
  RESPONSABLE_NO_INSCRIPTO = 'RNI',
}

/**
 * Estado del servidor AFIP
 */
export interface AFIPServerStatus {
  appserver: 'OK' | 'ERROR';
  dbserver: 'OK' | 'ERROR';
  authserver: 'OK' | 'ERROR';
}

/**
 * Información de punto de venta
 */
export interface SalesPoint {
  numero: number;
  bloqueado: boolean;
  fecha_baja?: string;
  tipo_emision: 'MANUAL' | 'ELECTRONICA' | 'ELECTRONICA_MIS_FACILIDADES';
}
