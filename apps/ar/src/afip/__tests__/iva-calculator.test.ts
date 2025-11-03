import {
  calculateIVA,
  calculateNetFromGross,
  extractIVAFromGross,
  getIVACodeFromRate,
  validateIVAAmounts,
} from '../utils/iva-calculator';
import { AFIPIVACode } from '../afip.types';

describe('IVA Calculator', () => {
  describe('calculateIVA', () => {
    it('should calculate IVA 21%', () => {
      const netAmount = 100;
      const iva = calculateIVA(netAmount, AFIPIVACode.IVA_21);
      expect(iva).toBe(21);
    });

    it('should calculate IVA 10.5%', () => {
      const netAmount = 100;
      const iva = calculateIVA(netAmount, AFIPIVACode.IVA_10_5);
      expect(iva).toBe(10.5);
    });

    it('should calculate IVA 0%', () => {
      const netAmount = 100;
      const iva = calculateIVA(netAmount, AFIPIVACode.IVA_0);
      expect(iva).toBe(0);
    });

    it('should round to 2 decimals', () => {
      const netAmount = 10.33;
      const iva = calculateIVA(netAmount, AFIPIVACode.IVA_21);
      expect(iva).toBe(2.17); // 10.33 * 0.21 = 2.1693, rounded to 2.17
    });
  });

  describe('calculateNetFromGross', () => {
    it('should calculate net amount from gross with IVA 21%', () => {
      const grossAmount = 121;
      const netAmount = calculateNetFromGross(grossAmount, AFIPIVACode.IVA_21);
      expect(netAmount).toBe(100);
    });

    it('should calculate net amount from gross with IVA 10.5%', () => {
      const grossAmount = 110.5;
      const netAmount = calculateNetFromGross(grossAmount, AFIPIVACode.IVA_10_5);
      expect(netAmount).toBe(100);
    });
  });

  describe('extractIVAFromGross', () => {
    it('should extract IVA from gross amount', () => {
      const grossAmount = 121;
      const iva = extractIVAFromGross(grossAmount, AFIPIVACode.IVA_21);
      expect(iva).toBe(21);
    });
  });

  describe('getIVACodeFromRate', () => {
    it('should get IVA code from decimal rate', () => {
      expect(getIVACodeFromRate(0.21)).toBe(AFIPIVACode.IVA_21);
      expect(getIVACodeFromRate(0.105)).toBe(AFIPIVACode.IVA_10_5);
      expect(getIVACodeFromRate(0)).toBe(AFIPIVACode.IVA_0);
    });

    it('should get IVA code from percentage rate', () => {
      expect(getIVACodeFromRate(21)).toBe(AFIPIVACode.IVA_21);
      expect(getIVACodeFromRate(10.5)).toBe(AFIPIVACode.IVA_10_5);
    });

    it('should default to IVA 21% for unknown rates', () => {
      expect(getIVACodeFromRate(15)).toBe(AFIPIVACode.IVA_21);
    });
  });

  describe('validateIVAAmounts', () => {
    it('should validate correct IVA amounts', () => {
      expect(validateIVAAmounts(100, 21, AFIPIVACode.IVA_21)).toBe(true);
      expect(validateIVAAmounts(100, 10.5, AFIPIVACode.IVA_10_5)).toBe(true);
    });

    it('should reject incorrect IVA amounts', () => {
      expect(validateIVAAmounts(100, 20, AFIPIVACode.IVA_21)).toBe(false);
      expect(validateIVAAmounts(100, 15, AFIPIVACode.IVA_10_5)).toBe(false);
    });

    it('should allow tolerance', () => {
      // 21.005 is within 0.01 tolerance of 21
      expect(validateIVAAmounts(100, 21.005, AFIPIVACode.IVA_21, 0.01)).toBe(true);
    });
  });
});
