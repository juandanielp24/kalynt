import { InvoiceFormatter } from './invoice-formatter';
import { IVA_RATES } from '../../constants/argentina.constants';

describe('InvoiceFormatter', () => {
  describe('formatInvoiceNumber', () => {
    it('should format invoice number with leading zeros', () => {
      const salePoint = 1;
      const invoiceNumber = 123;
      const formatted = InvoiceFormatter.formatInvoiceNumber(salePoint, invoiceNumber);

      expect(formatted).toBe('00001-00000123');
    });

    it('should handle large sale points', () => {
      const salePoint = 99999;
      const invoiceNumber = 1;
      const formatted = InvoiceFormatter.formatInvoiceNumber(salePoint, invoiceNumber);

      expect(formatted).toBe('99999-00000001');
    });

    it('should handle large invoice numbers', () => {
      const salePoint = 5;
      const invoiceNumber = 99999999;
      const formatted = InvoiceFormatter.formatInvoiceNumber(salePoint, invoiceNumber);

      expect(formatted).toBe('00005-99999999');
    });

    it('should always use dash separator', () => {
      const salePoint = 10;
      const invoiceNumber = 456;
      const formatted = InvoiceFormatter.formatInvoiceNumber(salePoint, invoiceNumber);

      expect(formatted).toContain('-');
      expect(formatted.split('-')).toHaveLength(2);
    });

    it('should pad sale point to 5 digits', () => {
      const salePoint = 1;
      const invoiceNumber = 1;
      const formatted = InvoiceFormatter.formatInvoiceNumber(salePoint, invoiceNumber);

      const [pointPart] = formatted.split('-');
      expect(pointPart.length).toBe(5);
    });

    it('should pad invoice number to 8 digits', () => {
      const salePoint = 1;
      const invoiceNumber = 1;
      const formatted = InvoiceFormatter.formatInvoiceNumber(salePoint, invoiceNumber);

      const [, numberPart] = formatted.split('-');
      expect(numberPart.length).toBe(8);
    });
  });

  describe('calculateIVA', () => {
    it('should calculate IVA at 21%', () => {
      const netAmount = 1000;
      const ivaRate = 21;
      const result = InvoiceFormatter.calculateIVA(netAmount, ivaRate);

      expect(result.baseAmount).toBe(1000);
      expect(result.taxAmount).toBe(210); // 1000 * 0.21
      expect(result.ivaId).toBe(IVA_RATES[21]);
    });

    it('should calculate IVA at 10.5%', () => {
      const netAmount = 1000;
      const ivaRate = 10.5;
      const result = InvoiceFormatter.calculateIVA(netAmount, ivaRate);

      expect(result.baseAmount).toBe(1000);
      expect(result.taxAmount).toBe(105); // 1000 * 0.105
      expect(result.ivaId).toBe(IVA_RATES[10.5]);
    });

    it('should calculate IVA at 27%', () => {
      const netAmount = 1000;
      const ivaRate = 27;
      const result = InvoiceFormatter.calculateIVA(netAmount, ivaRate);

      expect(result.baseAmount).toBe(1000);
      expect(result.taxAmount).toBe(270); // 1000 * 0.27
      expect(result.ivaId).toBe(IVA_RATES[27]);
    });

    it('should handle zero IVA', () => {
      const netAmount = 1000;
      const ivaRate = 0;
      const result = InvoiceFormatter.calculateIVA(netAmount, ivaRate);

      expect(result.baseAmount).toBe(1000);
      expect(result.taxAmount).toBe(0);
      expect(result.ivaId).toBe(IVA_RATES[0]);
    });

    it('should round tax amount', () => {
      const netAmount = 1234.56;
      const ivaRate = 21;
      const result = InvoiceFormatter.calculateIVA(netAmount, ivaRate);

      expect(result.taxAmount).toBe(259); // Round of 259.2576
      expect(Number.isInteger(result.taxAmount)).toBe(true);
    });
  });

  describe('validateAmounts', () => {
    it('should validate correct amounts', () => {
      const data = {
        netAmount: 1000,
        taxAmount: 210,
        exemptAmount: 0,
        untaxedAmount: 0,
        totalAmount: 1210,
      };

      const isValid = InvoiceFormatter.validateAmounts(data);
      expect(isValid).toBe(true);
    });

    it('should accept 1 cent difference for rounding', () => {
      const data = {
        netAmount: 1000,
        taxAmount: 210,
        exemptAmount: 0,
        untaxedAmount: 0,
        totalAmount: 1211, // 1 cent more
      };

      const isValid = InvoiceFormatter.validateAmounts(data);
      expect(isValid).toBe(true);
    });

    it('should reject amounts with more than 1 cent difference', () => {
      const data = {
        netAmount: 1000,
        taxAmount: 210,
        exemptAmount: 0,
        untaxedAmount: 0,
        totalAmount: 1212, // 2 cents more
      };

      const isValid = InvoiceFormatter.validateAmounts(data);
      expect(isValid).toBe(false);
    });

    it('should validate with exempt amount', () => {
      const data = {
        netAmount: 1000,
        taxAmount: 210,
        exemptAmount: 500,
        untaxedAmount: 0,
        totalAmount: 1710, // 1000 + 210 + 500
      };

      const isValid = InvoiceFormatter.validateAmounts(data);
      expect(isValid).toBe(true);
    });

    it('should validate with untaxed amount', () => {
      const data = {
        netAmount: 1000,
        taxAmount: 210,
        exemptAmount: 0,
        untaxedAmount: 300,
        totalAmount: 1510, // 1000 + 210 + 300
      };

      const isValid = InvoiceFormatter.validateAmounts(data);
      expect(isValid).toBe(true);
    });

    it('should validate complex invoice with all components', () => {
      const data = {
        netAmount: 1000,
        taxAmount: 210,
        exemptAmount: 500,
        untaxedAmount: 300,
        totalAmount: 2010, // 1000 + 210 + 500 + 300
      };

      const isValid = InvoiceFormatter.validateAmounts(data);
      expect(isValid).toBe(true);
    });

    it('should reject negative difference', () => {
      const data = {
        netAmount: 1000,
        taxAmount: 210,
        exemptAmount: 0,
        untaxedAmount: 0,
        totalAmount: 1208, // 2 cents less
      };

      const isValid = InvoiceFormatter.validateAmounts(data);
      expect(isValid).toBe(false);
    });
  });

  describe('getInvoiceTypeName', () => {
    it('should return name for Factura A', () => {
      const name = InvoiceFormatter.getInvoiceTypeName(1);
      expect(name).toContain('FACTURA');
      expect(name).toContain('A');
    });

    it('should return name for Factura B', () => {
      const name = InvoiceFormatter.getInvoiceTypeName(6);
      expect(name).toContain('FACTURA');
      expect(name).toContain('B');
    });

    it('should return name for Factura C', () => {
      const name = InvoiceFormatter.getInvoiceTypeName(11);
      expect(name).toContain('FACTURA');
      expect(name).toContain('C');
    });

    it('should return DESCONOCIDO for invalid type', () => {
      const name = InvoiceFormatter.getInvoiceTypeName(999);
      expect(name).toBe('DESCONOCIDO');
    });

    it('should replace underscores with spaces', () => {
      const name = InvoiceFormatter.getInvoiceTypeName(1);
      expect(name).not.toContain('_');
    });
  });
});
