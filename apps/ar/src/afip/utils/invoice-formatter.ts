import { INVOICE_TYPES, IVA_RATES } from '../../constants/argentina.constants';

/**
 * Utilidades para formateo de facturas
 */
export class InvoiceFormatter {
  /**
   * Formatea el número de factura (XXXXX-XXXXXXXX)
   */
  static formatInvoiceNumber(salePoint: number, invoiceNumber: number): string {
    const paddedPoint = salePoint.toString().padStart(5, '0');
    const paddedNumber = invoiceNumber.toString().padStart(8, '0');
    return `${paddedPoint}-${paddedNumber}`;
  }

  /**
   * Calcula los montos de IVA según la alícuota
   */
  static calculateIVA(netAmount: number, ivaRate: number): {
    baseAmount: number;
    taxAmount: number;
    ivaId: number;
  } {
    const taxAmount = Math.round(netAmount * (ivaRate / 100));
    const ivaId = IVA_RATES[ivaRate as keyof typeof IVA_RATES];

    return {
      baseAmount: netAmount,
      taxAmount,
      ivaId,
    };
  }

  /**
   * Valida que los montos cuadren
   */
  static validateAmounts(data: {
    netAmount: number;
    taxAmount: number;
    exemptAmount: number;
    untaxedAmount: number;
    totalAmount: number;
  }): boolean {
    const calculatedTotal = 
      data.netAmount + 
      data.taxAmount + 
      data.exemptAmount + 
      data.untaxedAmount;

    // Permitir diferencia de 1 centavo por redondeo
    return Math.abs(calculatedTotal - data.totalAmount) <= 1;
  }

  /**
   * Obtiene el nombre del tipo de factura
   */
  static getInvoiceTypeName(type: number): string {
    const entry = Object.entries(INVOICE_TYPES).find(([_, value]) => value === type);
    return entry ? entry[0].replace(/_/g, ' ') : 'DESCONOCIDO';
  }

  /**
   * Parsea un número de factura formateado y extrae punto de venta y número
   */
  static parseInvoiceNumber(formatted: string): {
    salePoint: number;
    invoiceNumber: number;
  } {
    const parts = formatted.split('-');
    if (parts.length !== 2) {
      throw new Error('Invalid invoice number format. Expected: XXXXX-XXXXXXXX');
    }

    return {
      salePoint: parseInt(parts[0], 10),
      invoiceNumber: parseInt(parts[1], 10),
    };
  }

  /**
   * Valida el formato de un número de factura
   */
  static validateInvoiceNumber(formatted: string): boolean {
    const pattern = /^\d{5}-\d{8}$/;
    return pattern.test(formatted);
  }

  /**
   * Incrementa un número de factura
   */
  static incrementInvoiceNumber(formatted: string): string {
    const { salePoint, invoiceNumber } = this.parseInvoiceNumber(formatted);
    return this.formatInvoiceNumber(salePoint, invoiceNumber + 1);
  }
}
