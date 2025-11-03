/**
 * Utilidades para manejo de números de comprobante AFIP
 *
 * Formato: PPPP-NNNNNNNN
 * - PPPP: Punto de venta (4 dígitos)
 * - NNNNNNNN: Número de comprobante (8 dígitos)
 */

/**
 * Formatea un número de comprobante con el formato AFIP
 */
export function formatInvoiceNumber(pointOfSale: number, invoiceNumber: number): string {
  const pos = String(pointOfSale).padStart(4, '0');
  const num = String(invoiceNumber).padStart(8, '0');
  return `${pos}-${num}`;
}

/**
 * Parsea un número de comprobante formateado
 */
export function parseInvoiceNumber(formattedNumber: string): {
  pointOfSale: number;
  invoiceNumber: number;
} | null {
  const match = formattedNumber.match(/^(\d{4})-(\d{8})$/);

  if (!match) {
    return null;
  }

  return {
    pointOfSale: parseInt(match[1], 10),
    invoiceNumber: parseInt(match[2], 10),
  };
}

/**
 * Valida que un número de comprobante tenga el formato correcto
 */
export function validateInvoiceNumber(formattedNumber: string): boolean {
  return /^\d{4}-\d{8}$/.test(formattedNumber);
}

/**
 * Incrementa un número de comprobante
 */
export function incrementInvoiceNumber(currentNumber: number): number {
  return currentNumber + 1;
}

/**
 * Genera el código QR para factura según especificación AFIP
 * Ver: https://www.afip.gob.ar/fe/qr/especificaciones.asp
 */
export function generateInvoiceQRData(data: {
  cuit: string;
  pointOfSale: number;
  invoiceType: number;
  invoiceNumber: number;
  total: number;
  currency: string;
  cae: string;
  caeExpiration: string; // YYYYMMDD
  documentType: number;
  documentNumber: string;
}): string {
  const {
    cuit,
    pointOfSale,
    invoiceType,
    invoiceNumber,
    total,
    currency,
    cae,
    caeExpiration,
    documentType,
    documentNumber,
  } = data;

  // Formato JSON según especificación AFIP
  const qrData = {
    ver: 1, // Versión del QR
    fecha: caeExpiration,
    cuit: parseInt(cuit.replace(/[-]/g, ''), 10),
    ptoVta: pointOfSale,
    tipoCmp: invoiceType,
    nroCmp: invoiceNumber,
    importe: total,
    moneda: currency,
    ctz: 1, // Cotización (1 para pesos)
    tipoDocRec: documentType,
    nroDocRec: parseInt(documentNumber, 10),
    tipoCodAut: 'E', // E = CAE
    codAut: parseInt(cae, 10),
  };

  // URL base de AFIP para consulta de comprobantes
  const baseUrl = 'https://www.afip.gob.ar/fe/qr/?p=';
  const encodedData = Buffer.from(JSON.stringify(qrData)).toString('base64');

  return baseUrl + encodedData;
}
