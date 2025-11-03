import { describe, it, expect } from 'vitest';
import { formatCurrencyARS, parseCurrencyToCents, addMoney, createMoney } from '../../src/utils/currency';

describe('currency utils', () => {
  describe('formatCurrencyARS', () => {
    it('formatea centavos como ARS correctamente', () => {
      // Intl.NumberFormat usa non-breaking space (\u00A0)
      expect(formatCurrencyARS(123456)).toBe('$\u00A01.234,56');
    });

    it('maneja cero', () => {
      expect(formatCurrencyARS(0)).toBe('$\u00A00,00');
    });

    it('maneja negativos', () => {
      expect(formatCurrencyARS(-500)).toBe('-$\u00A05,00');
    });
  });

  describe('parseCurrencyToCents', () => {
    it('parsea formato argentino', () => {
      expect(parseCurrencyToCents('$1.234,56')).toBe(123456);
    });

    it('parsea formato US', () => {
      expect(parseCurrencyToCents('1,234.56')).toBe(123456);
    });

    it('lanza error en formato inválido', () => {
      expect(() => parseCurrencyToCents('abc')).toThrow('Invalid currency format');
    });
  });

  describe('addMoney', () => {
    it('suma dos Money del mismo tipo', () => {
      const a = createMoney(1000, 'ARS');
      const b = createMoney(500, 'ARS');
      expect(addMoney(a, b)).toEqual({ amount: 1500, currency: 'ARS' });
    });

    it('lanza error con diferentes monedas', () => {
      const a = createMoney(1000, 'ARS');
      const b = createMoney(500, 'USD');
      expect(() => addMoney(a, b)).toThrow('Cannot add different currencies');
    });
  });
});
