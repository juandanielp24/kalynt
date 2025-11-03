/**
 * Mapper para convertir datos de ventas a formato AFIP
 */

import {
  AFIP_INVOICE_TYPES,
  AFIP_DOCUMENT_TYPES,
  AFIP_CONCEPT_TYPES,
  AFIP_IVA_CODES,
} from '../../constants/argentina.constants';
import { InvoiceRequest } from '../wsfev1/wsfev1.types';
import { DateFormatter } from './date-formatter';

export interface SaleData {
  saleId: string;
  tenantId: string;
  invoiceType: 'A' | 'B' | 'C' | 'E';
  concept?: 1 | 2 | 3; // 1: productos, 2: servicios, 3: mixto
  customerCuit?: string;
  customerName?: string;
  customerDocumentType?: number;
  customerDocumentNumber?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number; // En centavos
    taxRate: number; // 0, 10.5, 21, 27
    total: number; // En centavos
  }>;
  subtotal: number; // En centavos
  tax: number; // En centavos
  total: number; // En centavos
  serviceFrom?: string; // YYYYMMDD
  serviceTo?: string; // YYYYMMDD
  serviceDueDate?: string; // YYYYMMDD
  associatedInvoice?: {
    type: number;
    pointOfSale: number;
    number: number;
  };
}

/**
 * Helper para mapear ventas a formato AFIP
 */
export class InvoiceMapper {
  /**
   * Convierte datos de venta a InvoiceRequest de AFIP
   */
  static mapSaleToInvoiceRequest(
    sale: SaleData,
    salePoint: number,
    invoiceNumber: number
  ): InvoiceRequest {
    // Determinar tipo de comprobante
    const invoiceType = this.mapInvoiceType(sale.invoiceType);

    // Determinar concepto (productos, servicios, o mixto)
    const concept = sale.concept || AFIP_CONCEPT_TYPES.PRODUCTOS;

    // Obtener documento del cliente
    const { docType, docNum } = this.getCustomerDocument(
      sale.invoiceType,
      sale.customerCuit,
      sale.customerDocumentType,
      sale.customerDocumentNumber
    );

    // Calcular montos en pesos (convertir de centavos)
    const subtotal = sale.subtotal / 100;
    const tax = sale.tax / 100;
    const total = sale.total / 100;

    // Agrupar IVA por alícuota
    const ivaBreakdown = this.groupIVAByRate(sale.items);

    // Fecha actual
    const invoiceDate = DateFormatter.toAFIPFormat();

    // Construir request
    const request: InvoiceRequest = {
      concept,
      invoiceType,
      salePoint,
      invoiceNumber,
      invoiceDate,
      docType,
      docNum,
      totalAmount: total,
      netAmount: subtotal,
      exemptAmount: 0,
      taxAmount: tax,
      untaxedAmount: 0,
      currency: 'PES',
      exchangeRate: 1,
      iva: ivaBreakdown,
    };

    // Agregar fechas de servicio si es concepto 2 o 3
    if (concept !== AFIP_CONCEPT_TYPES.PRODUCTOS) {
      request.serviceFrom = sale.serviceFrom || invoiceDate;
      request.serviceTo = sale.serviceTo || invoiceDate;
      request.serviceDueDate = sale.serviceDueDate || invoiceDate;
    }

    // Agregar comprobante asociado si existe (para notas de crédito/débito)
    if (sale.associatedInvoice) {
      request.associatedInvoices = [
        {
          type: sale.associatedInvoice.type,
          salePoint: sale.associatedInvoice.pointOfSale,
          number: sale.associatedInvoice.number,
          cuit: '', // Se puede agregar si es necesario
        },
      ];
    }

    return request;
  }

  /**
   * Mapea tipo de factura simplificado a código AFIP
   */
  private static mapInvoiceType(type: 'A' | 'B' | 'C' | 'E'): number {
    const mapping: Record<string, number> = {
      A: AFIP_INVOICE_TYPES.FACTURA_A,
      B: AFIP_INVOICE_TYPES.FACTURA_B,
      C: AFIP_INVOICE_TYPES.FACTURA_C,
      E: AFIP_INVOICE_TYPES.FACTURA_E,
    };

    return mapping[type];
  }

  /**
   * Determina tipo y número de documento del cliente
   */
  private static getCustomerDocument(
    invoiceType: 'A' | 'B' | 'C' | 'E',
    customerCuit?: string,
    customerDocumentType?: number,
    customerDocumentNumber?: string
  ): { docType: number; docNum: number } {
    // Para factura A, siempre debe ser CUIT
    if (invoiceType === 'A') {
      if (!customerCuit) {
        throw new Error('CUIT is required for invoice type A');
      }
      return {
        docType: AFIP_DOCUMENT_TYPES.CUIT,
        docNum: parseInt(customerCuit.replace(/[-\s]/g, '')),
      };
    }

    // Para factura B/C, puede ser DNI, CUIT o consumidor final
    if (customerCuit) {
      return {
        docType: AFIP_DOCUMENT_TYPES.CUIT,
        docNum: parseInt(customerCuit.replace(/[-\s]/g, '')),
      };
    }

    if (customerDocumentType && customerDocumentNumber) {
      return {
        docType: customerDocumentType,
        docNum: parseInt(customerDocumentNumber),
      };
    }

    // Por defecto, consumidor final
    return {
      docType: AFIP_DOCUMENT_TYPES.CONSUMIDOR_FINAL,
      docNum: 0,
    };
  }

  /**
   * Agrupa items por alícuota de IVA
   */
  private static groupIVAByRate(
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      taxRate: number;
      total: number;
    }>
  ): Array<{ id: number; baseAmount: number; taxAmount: number }> {
    const ivaMap = new Map<number, { base: number; tax: number }>();

    for (const item of items) {
      const itemSubtotal = (item.quantity * item.unitPrice) / 100;
      const itemTax = (item.total - item.quantity * item.unitPrice) / 100;

      const ivaCode = this.getIVACode(item.taxRate);

      const existing = ivaMap.get(ivaCode) || { base: 0, tax: 0 };
      ivaMap.set(ivaCode, {
        base: existing.base + itemSubtotal,
        tax: existing.tax + itemTax,
      });
    }

    return Array.from(ivaMap.entries()).map(([code, amounts]) => ({
      id: code,
      baseAmount: Math.round(amounts.base * 100) / 100,
      taxAmount: Math.round(amounts.tax * 100) / 100,
    }));
  }

  /**
   * Obtiene el código de IVA según la alícuota
   */
  private static getIVACode(rate: number): number {
    const mapping: Record<number, number> = {
      0: AFIP_IVA_CODES.IVA_0,
      2.5: AFIP_IVA_CODES.IVA_2_5,
      5: AFIP_IVA_CODES.IVA_5,
      10.5: AFIP_IVA_CODES.IVA_10_5,
      21: AFIP_IVA_CODES.IVA_21,
      27: AFIP_IVA_CODES.IVA_27,
    };

    return mapping[rate] || AFIP_IVA_CODES.IVA_21;
  }

  /**
   * Calcula el IVA según la alícuota
   */
  static calculateIVA(netAmount: number, rate: number): number {
    return Math.round(netAmount * (rate / 100) * 100) / 100;
  }

  /**
   * Calcula el neto desde el total (incluyendo IVA)
   */
  static calculateNetFromGross(grossAmount: number, rate: number): number {
    return Math.round((grossAmount / (1 + rate / 100)) * 100) / 100;
  }

  /**
   * Extrae el IVA del total
   */
  static extractIVAFromGross(grossAmount: number, rate: number): number {
    const net = this.calculateNetFromGross(grossAmount, rate);
    return grossAmount - net;
  }

  /**
   * Valida que los montos de una factura sean correctos
   */
  static validateAmounts(data: {
    subtotal: number;
    tax: number;
    total: number;
  }): { valid: boolean; error?: string } {
    const calculatedTotal = data.subtotal + data.tax;
    const difference = Math.abs(calculatedTotal - data.total);

    // Permitir diferencia de 1 centavo por redondeo
    if (difference > 0.01) {
      return {
        valid: false,
        error: `Total mismatch. Expected ${calculatedTotal.toFixed(2)}, got ${data.total.toFixed(2)}`,
      };
    }

    return { valid: true };
  }

  /**
   * Formatea montos para mostrar (centavos a pesos)
   */
  static formatAmount(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  /**
   * Parsea montos de string a centavos
   */
  static parseAmount(amount: string): number {
    return Math.round(parseFloat(amount) * 100);
  }
}
