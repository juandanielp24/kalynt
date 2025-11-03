import { describe, it, expect } from 'vitest';
import { validateCUIT, formatCUIT, validateEmail } from '../../src/utils/validation';

describe('validation utils', () => {
  describe('validateCUIT', () => {
    it('valida CUIT válido', () => {
      expect(validateCUIT('20-12345678-6')).toBe(true);
    });

    it('valida CUIT sin formato', () => {
      expect(validateCUIT('20123456786')).toBe(true);
    });

    it('rechaza CUIT con longitud incorrecta', () => {
      expect(validateCUIT('12345')).toBe(false);
    });

    it('rechaza CUIT con caracteres no numéricos', () => {
      expect(validateCUIT('20-1234567A-9')).toBe(false);
    });

    it('rechaza CUIT con dígito verificador incorrecto', () => {
      expect(validateCUIT('20-12345678-0')).toBe(false);
    });
  });

  describe('formatCUIT', () => {
    it('formatea CUIT correctamente', () => {
      expect(formatCUIT('20123456786')).toBe('20-12345678-6');
    });

    it('lanza error con longitud incorrecta', () => {
      expect(() => formatCUIT('12345')).toThrow('Invalid CUIT length');
    });
  });

  describe('validateEmail', () => {
    it('valida email válido', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    it('valida email con subdominios', () => {
      expect(validateEmail('user@mail.example.com')).toBe(true);
    });

    it('rechaza email sin @', () => {
      expect(validateEmail('test.example.com')).toBe(false);
    });

    it('rechaza email sin dominio', () => {
      expect(validateEmail('test@')).toBe(false);
    });

    it('rechaza email sin usuario', () => {
      expect(validateEmail('@example.com')).toBe(false);
    });
  });
});
