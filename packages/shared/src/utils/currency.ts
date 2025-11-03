import type { Money } from '../types/common.types';

/**
 * Formatea un monto en centavos como moneda argentina (ARS)
 * @param cents - Monto en centavos
 * @returns String formateado (ej: "$1.234,56")
 */
export function formatCurrencyARS(cents: number): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parsea un string de moneda a centavos
 * @param value - String como "$1.234,56" o "1234.56"
 * @returns Monto en centavos
 */
export function parseCurrencyToCents(value: string): number {
  // Remover símbolo de moneda y espacios
  const cleaned = value.replace(/[^0-9,.-]/g, '');

  // Detectar formato basado en la posición de los separadores
  // En formato AR: 1.234,56 (coma es el último separador)
  // En formato US: 1,234.56 (punto es el último separador)
  const lastCommaIndex = cleaned.lastIndexOf(',');
  const lastDotIndex = cleaned.lastIndexOf('.');

  let normalized: string;
  if (lastCommaIndex > lastDotIndex) {
    // Formato argentino: 1.234,56 -> 1234.56
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDotIndex > lastCommaIndex) {
    // Formato US: 1,234.56 -> 1234.56
    normalized = cleaned.replace(/,/g, '');
  } else {
    // Sin separadores decimales
    normalized = cleaned;
  }

  const amount = parseFloat(normalized);
  if (isNaN(amount)) {
    throw new Error(`Invalid currency format: ${value}`);
  }

  return Math.round(amount * 100);
}

/**
 * Crea un objeto Money desde centavos
 */
export function createMoney(cents: number, currency: Money['currency'] = 'ARS'): Money {
  return { amount: cents, currency };
}

/**
 * Suma dos valores Money (deben ser misma moneda)
 */
export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error('Cannot add different currencies');
  }
  return { amount: a.amount + b.amount, currency: a.currency };
}

/**
 * Multiplica Money por un factor
 */
export function multiplyMoney(money: Money, factor: number): Money {
  return { amount: Math.round(money.amount * factor), currency: money.currency };
}
