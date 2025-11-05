/**
 * Valida un CUIT argentino usando el algoritmo de verificación
 * @param cuit - CUIT a validar (puede incluir guiones)
 * @returns true si el CUIT es válido
 */
export function validateCUIT(cuit: string): boolean {
  // Eliminar guiones y espacios
  const cleaned = cuit.replace(/[-\s]/g, '');

  // Debe tener exactamente 11 dígitos
  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }

  // Algoritmo de validación de CUIT
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * multipliers[i];
  }

  const calculatedVerifier = 11 - (sum % 11);
  const verifier =
    calculatedVerifier === 11 ? 0 : calculatedVerifier === 10 ? 9 : calculatedVerifier;

  return verifier === parseInt(cleaned[10]);
}

/**
 * Valida que haya stock suficiente para una cantidad solicitada
 * @param requestedQuantity - Cantidad solicitada
 * @param availableStock - Stock disponible
 * @returns Objeto con resultado de validación y mensaje
 */
export function validateStock(
  requestedQuantity: number,
  availableStock: number
): { isValid: boolean; message?: string } {
  if (requestedQuantity <= 0) {
    return {
      isValid: false,
      message: 'La cantidad debe ser mayor a 0',
    };
  }

  if (!Number.isInteger(requestedQuantity)) {
    return {
      isValid: false,
      message: 'La cantidad debe ser un número entero',
    };
  }

  if (requestedQuantity > availableStock) {
    return {
      isValid: false,
      message: `Stock insuficiente. Disponible: ${availableStock}`,
    };
  }

  if (availableStock === 0) {
    return {
      isValid: false,
      message: 'Producto sin stock',
    };
  }

  return { isValid: true };
}

/**
 * Valida un porcentaje de descuento
 * @param discount - Descuento a validar
 * @param maxDiscount - Descuento máximo permitido (default: 100)
 * @returns Objeto con resultado de validación y mensaje
 */
export function validateDiscount(
  discount: number,
  maxDiscount: number = 100
): { isValid: boolean; message?: string } {
  if (discount < 0) {
    return {
      isValid: false,
      message: 'El descuento no puede ser negativo',
    };
  }

  if (discount > maxDiscount) {
    return {
      isValid: false,
      message: `El descuento no puede superar ${maxDiscount}%`,
    };
  }

  return { isValid: true };
}

/**
 * Valida un email
 * @param email - Email a validar
 * @returns true si el email es válido
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida un número de teléfono argentino
 * @param phone - Teléfono a validar
 * @returns true si el teléfono es válido
 */
export function validatePhone(phone: string): boolean {
  // Eliminar todo lo que no sea dígito
  const digits = phone.replace(/\D/g, '');

  // Teléfono argentino: 10 dígitos sin código de país, o 11-13 con código
  return digits.length === 10 || (digits.length >= 11 && digits.length <= 13);
}

/**
 * Valida un precio
 * @param priceCents - Precio en centavos
 * @returns Objeto con resultado de validación y mensaje
 */
export function validatePrice(priceCents: number): {
  isValid: boolean;
  message?: string;
} {
  if (priceCents < 0) {
    return {
      isValid: false,
      message: 'El precio no puede ser negativo',
    };
  }

  if (!Number.isInteger(priceCents)) {
    return {
      isValid: false,
      message: 'El precio debe ser un número entero en centavos',
    };
  }

  if (priceCents === 0) {
    return {
      isValid: false,
      message: 'El precio debe ser mayor a 0',
    };
  }

  return { isValid: true };
}

/**
 * Valida que un carrito no esté vacío
 * @param itemsCount - Cantidad de items en el carrito
 * @returns Objeto con resultado de validación y mensaje
 */
export function validateCart(itemsCount: number): {
  isValid: boolean;
  message?: string;
} {
  if (itemsCount === 0) {
    return {
      isValid: false,
      message: 'El carrito está vacío',
    };
  }

  return { isValid: true };
}

/**
 * Valida datos de cliente para factura tipo A
 * @param customerCUIT - CUIT del cliente
 * @returns Objeto con resultado de validación y mensaje
 */
export function validateInvoiceACustomer(customerCUIT?: string): {
  isValid: boolean;
  message?: string;
} {
  if (!customerCUIT) {
    return {
      isValid: false,
      message: 'Se requiere CUIT del cliente para Factura A',
    };
  }

  if (!validateCUIT(customerCUIT)) {
    return {
      isValid: false,
      message: 'El CUIT del cliente no es válido',
    };
  }

  return { isValid: true };
}

/**
 * Valida un código de barras
 * @param barcode - Código de barras a validar
 * @returns true si el código es válido
 */
export function validateBarcode(barcode: string): boolean {
  // Códigos de barras comunes: EAN-13, EAN-8, UPC-A
  const cleaned = barcode.replace(/\s/g, '');

  // EAN-13: 13 dígitos
  // EAN-8: 8 dígitos
  // UPC-A: 12 dígitos
  const validLengths = [8, 12, 13];

  if (!validLengths.includes(cleaned.length)) {
    return false;
  }

  if (!/^\d+$/.test(cleaned)) {
    return false;
  }

  return true;
}
