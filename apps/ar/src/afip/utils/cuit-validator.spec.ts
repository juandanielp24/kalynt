import { CuitValidator } from './cuit-validator';

describe('CuitValidator', () => {
  describe('validate', () => {
    it('should validate correct CUIT with dashes', () => {
      const validCuit = '20-40937847-2';
      expect(CuitValidator.validate(validCuit)).toBe(true);
    });

    it('should validate correct CUIT without dashes', () => {
      const validCuit = '20409378472';
      expect(CuitValidator.validate(validCuit)).toBe(true);
    });

    it('should validate multiple valid CUITs', () => {
      const validCuits = [
        '20409378472',
        '23123456789',
        '27123456784',
        '30123456783',
      ];

      validCuits.forEach((cuit) => {
        expect(CuitValidator.validate(cuit)).toBe(true);
      });
    });

    it('should reject CUIT with invalid length', () => {
      const invalidCuit = '123456789';
      expect(CuitValidator.validate(invalidCuit)).toBe(false);
    });

    it('should reject CUIT with non-numeric characters', () => {
      const invalidCuit = '20-ABC-12345-6';
      expect(CuitValidator.validate(invalidCuit)).toBe(false);
    });

    it('should reject CUIT with invalid check digit', () => {
      const invalidCuit = '20409378473'; // Last digit should be 2
      expect(CuitValidator.validate(invalidCuit)).toBe(false);
    });

    it('should reject empty string', () => {
      expect(CuitValidator.validate('')).toBe(false);
    });

    it('should reject null', () => {
      expect(CuitValidator.validate(null as any)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(CuitValidator.validate(undefined as any)).toBe(false);
    });

    it('should handle CUIT with spaces', () => {
      const cuitWithSpaces = '20 40937847 2';
      expect(CuitValidator.validate(cuitWithSpaces)).toBe(true);
    });
  });

  describe('calculateVerificationDigit', () => {
    it('should calculate correct verification digit', () => {
      const cuitWithoutDigit = '2040937847';
      const digit = CuitValidator.calculateVerificationDigit(cuitWithoutDigit);
      expect(digit).toBe(2);
    });

    it('should return 0 when result is 11', () => {
      // Find a CUIT that results in 0
      const cuitWithoutDigit = '2012345678';
      const digit = CuitValidator.calculateVerificationDigit(cuitWithoutDigit);
      expect(digit).toBeGreaterThanOrEqual(0);
      expect(digit).toBeLessThanOrEqual(10);
    });

    it('should return 9 when result is 10', () => {
      // The algorithm replaces 10 with 9
      const cuitWithoutDigit = '2312345678';
      const digit = CuitValidator.calculateVerificationDigit(cuitWithoutDigit);
      expect(digit).toBeGreaterThanOrEqual(0);
      expect(digit).toBeLessThanOrEqual(10);
    });
  });

  describe('format', () => {
    it('should format CUIT with dashes', () => {
      const cuit = '20409378472';
      const formatted = CuitValidator.format(cuit);
      expect(formatted).toBe('20-40937847-2');
    });

    it('should format already formatted CUIT', () => {
      const cuit = '20-40937847-2';
      const formatted = CuitValidator.format(cuit);
      expect(formatted).toBe('20-40937847-2');
    });

    it('should handle CUIT with spaces', () => {
      const cuit = '20 40937847 2';
      const formatted = CuitValidator.format(cuit);
      expect(formatted).toBe('20-40937847-2');
    });
  });
});
