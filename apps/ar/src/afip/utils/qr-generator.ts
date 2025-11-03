/**
 * Utilidades para generar códigos QR de facturas electrónicas AFIP
 */

export interface InvoiceQRParams {
  ver: number; // Versión (siempre 1)
  fecha: string; // Fecha del comprobante (YYYY-MM-DD)
  cuit: string; // CUIT del emisor (11 dígitos)
  ptoVta: number; // Punto de venta
  tipoCmp: number; // Tipo de comprobante
  nroCmp: number; // Número de comprobante
  importe: number; // Importe total
  moneda: string; // Código de moneda
  ctz: number; // Cotización
  tipoDocRec: number; // Tipo documento receptor
  nroDocRec: string; // Número documento receptor
  tipoCodAut: string; // Tipo código autorización (siempre 'E' para CAE)
  codAut: string; // Código de autorización (CAE)
}

/**
 * Genera la URL del código QR para factura electrónica según especificación AFIP
 */
export class QRGenerator {
  private static readonly BASE_URL = 'https://www.afip.gob.ar/fe/qr/';

  /**
   * Genera los datos del QR para una factura electrónica
   */
  static generateInvoiceQRData(params: {
    cuit: string;
    pointOfSale: number;
    invoiceType: number;
    invoiceNumber: number;
    invoiceDate: string; // YYYYMMDD
    total: number;
    currency: string;
    exchangeRate: number;
    documentType: number;
    documentNumber: string;
    cae: string;
  }): string {
    // Convertir fecha de YYYYMMDD a YYYY-MM-DD
    const formattedDate = this.formatDateForQR(params.invoiceDate);

    // Construir objeto con parámetros del QR
    const qrParams: InvoiceQRParams = {
      ver: 1,
      fecha: formattedDate,
      cuit: params.cuit.replace(/[-\s]/g, ''), // Limpiar guiones
      ptoVta: params.pointOfSale,
      tipoCmp: params.invoiceType,
      nroCmp: params.invoiceNumber,
      importe: params.total,
      moneda: params.currency,
      ctz: params.exchangeRate,
      tipoDocRec: params.documentType,
      nroDocRec: params.documentNumber,
      tipoCodAut: 'E',
      codAut: params.cae,
    };

    // Generar URL con query string
    return this.buildQRURL(qrParams);
  }

  /**
   * Construye la URL completa del QR con todos los parámetros
   */
  private static buildQRURL(params: InvoiceQRParams): string {
    const queryParams = new URLSearchParams({
      ver: params.ver.toString(),
      fecha: params.fecha,
      cuit: params.cuit,
      ptoVta: params.ptoVta.toString(),
      tipoCmp: params.tipoCmp.toString(),
      nroCmp: params.nroCmp.toString(),
      importe: params.importe.toFixed(2),
      moneda: params.moneda,
      ctz: params.ctz.toFixed(2),
      tipoDocRec: params.tipoDocRec.toString(),
      nroDocRec: params.nroDocRec,
      tipoCodAut: params.tipoCodAut,
      codAut: params.codAut,
    });

    return `${this.BASE_URL}?${queryParams.toString()}`;
  }

  /**
   * Formatea fecha de YYYYMMDD a YYYY-MM-DD
   */
  private static formatDateForQR(afipDate: string): string {
    if (afipDate.length !== 8) {
      throw new Error('Invalid date format. Expected YYYYMMDD');
    }

    const year = afipDate.substring(0, 4);
    const month = afipDate.substring(4, 6);
    const day = afipDate.substring(6, 8);

    return `${year}-${month}-${day}`;
  }

  /**
   * Parsea una URL de QR y extrae los parámetros
   */
  static parseQRURL(url: string): InvoiceQRParams | null {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      return {
        ver: parseInt(params.get('ver') || '1'),
        fecha: params.get('fecha') || '',
        cuit: params.get('cuit') || '',
        ptoVta: parseInt(params.get('ptoVta') || '0'),
        tipoCmp: parseInt(params.get('tipoCmp') || '0'),
        nroCmp: parseInt(params.get('nroCmp') || '0'),
        importe: parseFloat(params.get('importe') || '0'),
        moneda: params.get('moneda') || 'PES',
        ctz: parseFloat(params.get('ctz') || '1'),
        tipoDocRec: parseInt(params.get('tipoDocRec') || '0'),
        nroDocRec: params.get('nroDocRec') || '',
        tipoCodAut: params.get('tipoCodAut') || 'E',
        codAut: params.get('codAut') || '',
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Valida que una URL de QR tenga el formato correcto
   */
  static validateQRURL(url: string): boolean {
    if (!url.startsWith(this.BASE_URL)) return false;

    const params = this.parseQRURL(url);
    if (!params) return false;

    // Validaciones básicas
    return (
      params.ver === 1 &&
      params.cuit.length === 11 &&
      params.ptoVta > 0 &&
      params.tipoCmp > 0 &&
      params.nroCmp > 0 &&
      params.codAut.length > 0
    );
  }

  /**
   * Genera datos base64 para QR code image
   * Nota: Requiere librería externa como qrcode o similar
   */
  static getQRDataForImage(qrUrl: string): string {
    // Esta función retorna la URL que debe ser convertida a imagen QR
    // por una librería externa como 'qrcode' o en el frontend
    return qrUrl;
  }
}
