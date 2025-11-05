import type { CartItem } from '@/stores/pos-store';

/**
 * Calcula el precio con descuento aplicado
 * @param priceCents - Precio original en centavos
 * @param discountPercent - Porcentaje de descuento (0-100)
 * @returns Precio con descuento en centavos
 */
export function calculateDiscountedPrice(
  priceCents: number,
  discountPercent: number
): number {
  if (discountPercent <= 0) {
    return priceCents;
  }

  const discountAmount = Math.round((priceCents * discountPercent) / 100);
  return priceCents - discountAmount;
}

/**
 * Calcula el IVA (u otro impuesto) desde el precio bruto que ya incluye el impuesto
 * @param grossPriceCents - Precio bruto en centavos (incluye IVA)
 * @param taxRate - Tasa de impuesto (ej: 0.21 para IVA 21%)
 * @returns Monto del impuesto en centavos
 */
export function calculateTaxFromGrossPrice(
  grossPriceCents: number,
  taxRate: number
): number {
  // IVA = PrecioBruto - (PrecioBruto / (1 + TasaIVA))
  const netPrice = Math.round(grossPriceCents / (1 + taxRate));
  return grossPriceCents - netPrice;
}

/**
 * Calcula el precio neto (sin IVA) desde el precio bruto
 * @param grossPriceCents - Precio bruto en centavos (incluye IVA)
 * @param taxRate - Tasa de impuesto (ej: 0.21 para IVA 21%)
 * @returns Precio neto en centavos
 */
export function calculateNetPrice(
  grossPriceCents: number,
  taxRate: number
): number {
  return Math.round(grossPriceCents / (1 + taxRate));
}

/**
 * Calcula el precio bruto desde el precio neto
 * @param netPriceCents - Precio neto en centavos (sin IVA)
 * @param taxRate - Tasa de impuesto (ej: 0.21 para IVA 21%)
 * @returns Precio bruto en centavos
 */
export function calculateGrossPrice(
  netPriceCents: number,
  taxRate: number
): number {
  return Math.round(netPriceCents * (1 + taxRate));
}

/**
 * Calcula los totales del carrito
 * @param items - Items del carrito
 * @param globalDiscountPercent - Descuento global aplicado al total (0-100)
 * @returns Objeto con subtotal, impuestos, descuento y total
 */
export function calculateCartTotals(
  items: CartItem[],
  globalDiscountPercent: number = 0
): {
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
} {
  // Calcular subtotal con descuentos por item
  let subtotalCents = 0;
  let taxCents = 0;

  items.forEach((item) => {
    // Precio unitario con descuento del item
    const discountedUnitPrice = calculateDiscountedPrice(
      item.unitPriceCents,
      item.discountPercent || 0
    );

    // Subtotal del item (precio x cantidad)
    const itemSubtotal = discountedUnitPrice * item.quantity;
    subtotalCents += itemSubtotal;

    // IVA del item (extraído del precio bruto)
    const itemTax = calculateTaxFromGrossPrice(itemSubtotal, item.taxRate);
    taxCents += itemTax;
  });

  // Aplicar descuento global al subtotal
  const discountCents = Math.round((subtotalCents * globalDiscountPercent) / 100);
  const totalCents = subtotalCents - discountCents;

  // Recalcular IVA proporcionalmente si hay descuento global
  if (discountCents > 0 && subtotalCents > 0) {
    const discountRatio = totalCents / subtotalCents;
    taxCents = Math.round(taxCents * discountRatio);
  }

  return {
    subtotalCents,
    taxCents,
    discountCents,
    totalCents,
  };
}

/**
 * Calcula el cambio a devolver en una transacción en efectivo
 * @param totalCents - Total de la venta en centavos
 * @param paidCents - Monto pagado en centavos
 * @returns Cambio a devolver en centavos
 */
export function calculateChange(totalCents: number, paidCents: number): number {
  const change = paidCents - totalCents;
  return change > 0 ? change : 0;
}

/**
 * Calcula el total de items en el carrito
 * @param items - Items del carrito
 * @returns Cantidad total de items
 */
export function calculateTotalItems(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Calcula cuotas para pago con tarjeta de crédito
 * @param totalCents - Total en centavos
 * @param installments - Número de cuotas
 * @param interestRate - Tasa de interés por cuota (ej: 0.05 para 5%)
 * @returns Monto de cada cuota en centavos
 */
export function calculateInstallment(
  totalCents: number,
  installments: number,
  interestRate: number = 0
): number {
  if (installments <= 1 || interestRate === 0) {
    return Math.round(totalCents / installments);
  }

  // Fórmula de cuota con interés compuesto
  const monthlyRate = interestRate;
  const totalWithInterest = totalCents * Math.pow(1 + monthlyRate, installments);

  return Math.round(totalWithInterest / installments);
}

/**
 * Calcula el porcentaje de descuento efectivo aplicado
 * @param originalPriceCents - Precio original
 * @param finalPriceCents - Precio final
 * @returns Porcentaje de descuento
 */
export function calculateDiscountPercentage(
  originalPriceCents: number,
  finalPriceCents: number
): number {
  if (originalPriceCents === 0) {
    return 0;
  }

  const discount =
    ((originalPriceCents - finalPriceCents) / originalPriceCents) * 100;

  return Math.max(0, Math.round(discount * 100) / 100); // Redondear a 2 decimales
}

/**
 * Calcula el margen de ganancia
 * @param costCents - Costo del producto en centavos
 * @param salePriceCents - Precio de venta en centavos
 * @returns Objeto con margen en centavos y porcentaje
 */
export function calculateProfitMargin(
  costCents: number,
  salePriceCents: number
): {
  marginCents: number;
  marginPercent: number;
} {
  const marginCents = salePriceCents - costCents;
  const marginPercent = costCents > 0 ? (marginCents / costCents) * 100 : 0;

  return {
    marginCents,
    marginPercent: Math.round(marginPercent * 100) / 100,
  };
}

/**
 * Redondea a los centavos más cercanos (manejo de precisión decimal)
 * @param cents - Centavos a redondear
 * @returns Centavos redondeados
 */
export function roundToCents(cents: number): number {
  return Math.round(cents);
}
