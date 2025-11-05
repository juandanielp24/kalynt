/**
 * Formatea centavos a formato de moneda argentina (ARS)
 * @param cents - Cantidad en centavos
 * @returns String formateado como $X,XXX.XX
 */
export function formatCurrency(cents: number): string {
  const amount = cents / 100;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea CUIT al formato XX-XXXXXXXX-X
 * @param value - CUIT sin formatear
 * @returns CUIT formateado
 */
export function formatCUIT(value: string): string {
  // Eliminar todo lo que no sea dígito
  const digits = value.replace(/\D/g, '');

  // Aplicar formato según longitud
  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 10) {
    return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10, 11)}`;
}

/**
 * Parsea un string de precio a centavos
 * @param priceString - Precio como string (ej: "123.45", "123,45", "$123.45")
 * @returns Precio en centavos
 */
export function parsePriceToCents(priceString: string): number {
  // Eliminar símbolos de moneda, espacios, y puntos de miles
  let cleaned = priceString.replace(/[$\s]/g, '');

  // Reemplazar coma decimal por punto
  cleaned = cleaned.replace(',', '.');

  // Convertir a número y multiplicar por 100
  const amount = parseFloat(cleaned);

  if (isNaN(amount)) {
    return 0;
  }

  return Math.round(amount * 100);
}

/**
 * Formatea teléfono argentino
 * @param phone - Número de teléfono sin formatear
 * @returns Teléfono formateado
 */
export function formatPhone(phone: string): string {
  // Eliminar todo lo que no sea dígito
  const digits = phone.replace(/\D/g, '');

  // Sin código de país (10 dígitos): (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Con código de país (12-13 dígitos): +XX (XXX) XXX-XXXX
  if (digits.length >= 11) {
    const countryCode = digits.slice(0, digits.length - 10);
    const areaCode = digits.slice(digits.length - 10, digits.length - 7);
    const firstPart = digits.slice(digits.length - 7, digits.length - 4);
    const lastPart = digits.slice(digits.length - 4);

    return `+${countryCode} (${areaCode}) ${firstPart}-${lastPart}`;
  }

  // Si no cumple con el formato esperado, devolver tal cual
  return phone;
}

/**
 * Formatea fecha a formato argentino
 * @param date - Fecha a formatear
 * @returns Fecha formateada como DD/MM/YYYY
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Formatea fecha y hora a formato argentino
 * @param date - Fecha a formatear
 * @returns Fecha y hora formateada como DD/MM/YYYY HH:mm
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Formatea porcentaje
 * @param value - Valor decimal (ej: 0.21 para 21%)
 * @returns String formateado como XX%
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

/**
 * Formatea número de venta/factura
 * @param number - Número a formatear
 * @param prefix - Prefijo opcional (ej: "V" para venta, "F" para factura)
 * @returns Número formateado con padding
 */
export function formatInvoiceNumber(number: number, prefix?: string): string {
  const paddedNumber = number.toString().padStart(8, '0');
  return prefix ? `${prefix}-${paddedNumber}` : paddedNumber;
}
