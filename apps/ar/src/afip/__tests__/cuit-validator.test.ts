import {
  validateCUIT,
  formatCUIT,
  cleanCUIT,
  getCUITType,
  extractDNIFromCUIT,
  generateCUITFromDNI,
} from '../utils/cuit-validator';

describe('CUIT Validator', () => {
  describe('validateCUIT', () => {
    it('should validate correct CUIT', () => {
      expect(validateCUIT('20-12345678-9')).toBe(true);
      expect(validateCUIT('20123456789')).toBe(true);
    });

    it('should reject invalid CUIT', () => {
      expect(validateCUIT('20-00000000-0')).toBe(false);
      expect(validateCUIT('12345678901')).toBe(false);
    });

    it('should reject invalid format', () => {
      expect(validateCUIT('123')).toBe(false);
      expect(validateCUIT('abc')).toBe(false);
    });
  });

  describe('formatCUIT', () => {
    it('should format CUIT with dashes', () => {
      expect(formatCUIT('20123456789')).toBe('20-12345678-9');
    });

    it('should keep already formatted CUIT', () => {
      expect(formatCUIT('20-12345678-9')).toBe('20-12345678-9');
    });

    it('should return invalid CUIT unchanged', () => {
      expect(formatCUIT('123')).toBe('123');
    });
  });

  describe('cleanCUIT', () => {
    it('should remove dashes and spaces', () => {
      expect(cleanCUIT('20-12345678-9')).toBe('20123456789');
      expect(cleanCUIT('20 12345678 9')).toBe('20123456789');
    });
  });

  describe('getCUITType', () => {
    it('should identify persona física', () => {
      expect(getCUITType('20-12345678-9')).toBe('PERSONA_FISICA');
      expect(getCUITType('23-12345678-9')).toBe('PERSONA_FISICA');
      expect(getCUITType('27-12345678-9')).toBe('PERSONA_FISICA');
    });

    it('should identify persona jurídica', () => {
      expect(getCUITType('30-12345678-9')).toBe('PERSONA_JURIDICA');
      expect(getCUITType('33-12345678-9')).toBe('PERSONA_JURIDICA');
    });

    it('should return UNKNOWN for invalid prefix', () => {
      expect(getCUITType('99-12345678-9')).toBe('UNKNOWN');
    });
  });

  describe('extractDNIFromCUIT', () => {
    it('should extract DNI from persona física CUIT', () => {
      expect(extractDNIFromCUIT('20-12345678-9')).toBe('12345678');
    });

    it('should return null for persona jurídica', () => {
      expect(extractDNIFromCUIT('30-12345678-9')).toBeNull();
    });
  });

  describe('generateCUITFromDNI', () => {
    it('should generate CUIT for male', () => {
      const cuit = generateCUITFromDNI('12345678', 'M');
      expect(cuit).toMatch(/^20\d{9}$/);
      expect(validateCUIT(cuit)).toBe(true);
    });

    it('should generate CUIT for female', () => {
      const cuit = generateCUITFromDNI('12345678', 'F');
      expect(cuit).toMatch(/^27\d{9}$/);
      expect(validateCUIT(cuit)).toBe(true);
    });

    it('should generate CUIT for empresa', () => {
      const cuit = generateCUITFromDNI('12345678', 'EMPRESA');
      expect(cuit).toMatch(/^30\d{9}$/);
      expect(validateCUIT(cuit)).toBe(true);
    });
  });
});
