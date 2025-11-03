/**
 * Calculadora de IVA para Argentina
 *
 * Tasas vigentes:
 * - 21%: Alícuota general
 * - 10.5%: Alícuota reducida (ciertos alimentos, medicamentos)
 * - 27%: Alícuota incrementada (servicios digitales, telecomunicaciones)
 * - 5%: Alícuota especial (ciertos productos agropecuarios)
 * - 2.5%: Alícuota mínima (productos específicos)
 * - 0%: Exento
 */

import { AFIPIVACode } from '../afip.types';

/**
 * Tasas de IVA en Argentina
 */
export const IVA_RATES = {
  [AFIPIVACode.IVA_0]: 0,
  [AFIPIVACode.IVA_2_5]: 0.025,
  [AFIPIVACode.IVA_5]: 0.05,
  [AFIPIVACode.IVA_10_5]: 0.105,
  [AFIPIVACode.IVA_21]: 0.21,
  [AFIPIVACode.IVA_27]: 0.27,
  [AFIPIVACode.IVA_EXENTO]: 0,
  [AFIPIVACode.IVA_NO_GRAVADO]: 0,
} as const;

/**
 * Calcula el IVA a partir de un monto neto (base imponible)
 */
export function calculateIVA(netAmount: number, ivaCode: AFIPIVACode): number {
  const rate = IVA_RATES[ivaCode];
  return Math.round(netAmount * rate * 100) / 100; // Redondear a 2 decimales
}

/**
 * Calcula el monto neto a partir de un monto con IVA incluido
 */
export function calculateNetFromGross(grossAmount: number, ivaCode: AFIPIVACode): number {
  const rate = IVA_RATES[ivaCode];
  const netAmount = grossAmount / (1 + rate);
  return Math.round(netAmount * 100) / 100;
}

/**
 * Calcula el IVA incluido en un precio con IVA
 */
export function extractIVAFromGross(grossAmount: number, ivaCode: AFIPIVACode): number {
  const netAmount = calculateNetFromGross(grossAmount, ivaCode);
  return grossAmount - netAmount;
}

/**
 * Obtiene el código de IVA según la tasa porcentual
 */
export function getIVACodeFromRate(rate: number): AFIPIVACode {
  // Normalizar tasa (puede venir como 0.21 o 21)
  const normalizedRate = rate > 1 ? rate / 100 : rate;

  if (normalizedRate === 0) return AFIPIVACode.IVA_0;
  if (normalizedRate === 0.025) return AFIPIVACode.IVA_2_5;
  if (normalizedRate === 0.05) return AFIPIVACode.IVA_5;
  if (normalizedRate === 0.105) return AFIPIVACode.IVA_10_5;
  if (normalizedRate === 0.21) return AFIPIVACode.IVA_21;
  if (normalizedRate === 0.27) return AFIPIVACode.IVA_27;

  // Por defecto, IVA general
  return AFIPIVACode.IVA_21;
}

/**
 * Agrupa importes por tasa de IVA (útil para comprobantes con múltiples tasas)
 */
export function groupByIVARate(
  items: Array<{ netAmount: number; ivaCode: AFIPIVACode }>
): Array<{ codigo: AFIPIVACode; base_imponible: number; importe: number }> {
  const grouped = new Map<AFIPIVACode, { base: number; iva: number }>();

  for (const item of items) {
    const existing = grouped.get(item.ivaCode) || { base: 0, iva: 0 };
    const ivaAmount = calculateIVA(item.netAmount, item.ivaCode);

    grouped.set(item.ivaCode, {
      base: existing.base + item.netAmount,
      iva: existing.iva + ivaAmount,
    });
  }

  return Array.from(grouped.entries()).map(([codigo, amounts]) => ({
    codigo,
    base_imponible: Math.round(amounts.base * 100) / 100,
    importe: Math.round(amounts.iva * 100) / 100,
  }));
}

/**
 * Valida que los montos de IVA sean correctos
 */
export function validateIVAAmounts(
  netAmount: number,
  ivaAmount: number,
  ivaCode: AFIPIVACode,
  tolerance: number = 0.01 // Tolerancia de 1 centavo
): boolean {
  const calculatedIVA = calculateIVA(netAmount, ivaCode);
  const difference = Math.abs(calculatedIVA - ivaAmount);
  return difference <= tolerance;
}
