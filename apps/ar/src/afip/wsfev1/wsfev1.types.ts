/**
 * Tipos para WSFEv1 (Web Service de Facturación Electrónica versión 1)
 */

export interface InvoiceRequest {
  // Datos del comprobante
  invoiceType: number; // Tipo de comprobante (1=A, 6=B, 11=C, etc.)
  salePoint: number; // Punto de venta
  invoiceNumber: number; // Número de comprobante
  invoiceDate: string; // Fecha de comprobante (YYYYMMDD)
  
  // Concepto
  concept: number; // 1=Productos, 2=Servicios, 3=Productos y Servicios
  
  // Datos del cliente
  docType: number; // Tipo de documento
  docNum: string; // Número de documento
  
  // Importes
  totalAmount: number; // Importe total
  netAmount: number; // Importe neto gravado
  exemptAmount: number; // Importe exento
  taxAmount: number; // Importe de IVA
  untaxedAmount: number; // Importe no gravado
  
  // Moneda
  currency: string; // Código de moneda (PES, DOL, EUR)
  exchangeRate: number; // Cotización de moneda
  
  // Fechas para servicios
  serviceFrom?: string; // Fecha desde servicio (YYYYMMDD)
  serviceTo?: string; // Fecha hasta servicio (YYYYMMDD)
  serviceDueDate?: string; // Fecha vencimiento pago (YYYYMMDD)
  
  // IVA
  iva?: Array<{
    id: number; // Código de alícuota
    baseAmount: number; // Base imponible
    taxAmount: number; // Importe de IVA
  }>;
  
  // Tributos opcionales
  tributes?: Array<{
    id: number;
    description: string;
    baseAmount: number;
    rate: number;
    taxAmount: number;
  }>;
  
  // Comprobantes asociados (para notas de crédito/débito)
  associatedInvoices?: Array<{
    type: number;
    salePoint: number;
    number: number;
    cuit: string;
  }>;
  
  // Opcionales
  optional?: Array<{
    id: number;
    value: string;
  }>;
}

export interface InvoiceResponse {
  // Datos del comprobante autorizado
  invoiceType: number;
  salePoint: number;
  invoiceNumber: number;
  invoiceDate: string;
  
  // Autorización
  cae: string; // Código de Autorización Electrónico
  caeExpirationDate: string; // Fecha de vencimiento del CAE
  
  // Resultado
  result: 'A' | 'R' | 'P'; // A=Aprobado, R=Rechazado, P=Parcial
  
  // Observaciones/Errores
  observations?: Array<{
    code: number;
    message: string;
  }>;
  
  errors?: Array<{
    code: number;
    message: string;
  }>;
  
  events?: Array<{
    code: number;
    message: string;
  }>;
}

export interface LastInvoiceResponse {
  invoiceType: number;
  salePoint: number;
  lastInvoiceNumber: number;
}

export interface InvoiceQuery {
  invoiceType: number;
  salePoint: number;
  invoiceNumber: number;
}

export interface InvoiceInfo {
  invoiceType: number;
  salePoint: number;
  invoiceNumber: number;
  invoiceDate: string;
  totalAmount: number;
  cae: string;
  caeExpirationDate: string;
  emissionDate: string;
  processedDate: string;
}

export interface AFIPServerStatus {
  appServer: 'OK' | 'ERROR';
  dbServer: 'OK' | 'ERROR';
  authServer: 'OK' | 'ERROR';
}
