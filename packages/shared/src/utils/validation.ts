/**
 * Valida CUIT/CUIL argentino (11 dígitos con dígito verificador)
 * Formato: XX-XXXXXXXX-X
 */
export function validateCUIT(cuit: string): boolean {
  // Remover guiones y espacios
  const cleaned = cuit.replace(/[-\s]/g, '');

  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }

  // Validar dígito verificador
  const [check, ...rest] = cleaned.split('').reverse().map(Number);
  const weights = [2, 3, 4, 5, 6, 7, 2, 3, 4, 5];

  const sum = rest.reduce((acc, digit, i) => acc + digit * weights[i], 0);
  const calculatedCheck = (11 - (sum % 11)) % 11;

  return check === calculatedCheck;
}

/**
 * Formatea CUIT al formato XX-XXXXXXXX-X
 */
export function formatCUIT(cuit: string): string {
  const cleaned = cuit.replace(/[-\s]/g, '');
  if (cleaned.length !== 11) {
    throw new Error('Invalid CUIT length');
  }
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
}

/**
 * Valida email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
