/**
 * Validador de CUIT/CUIL argentino
 *
 * El CUIT/CUIL tiene 11 dígitos: XX-XXXXXXXX-X
 * Los primeros 2 dígitos indican el tipo (20, 23, 24, 27, 30, 33, 34)
 * Los siguientes 8 son el número de documento
 * El último es el dígito verificador calculado
 */

/**
 * Valida el formato y dígito verificador de un CUIT/CUIL
 */
export function validateCUIT(cuit: string): boolean {
  // Limpiar formato (quitar guiones y espacios)
  const cleaned = cuit.replace(/[-\s]/g, '');

  // Validar longitud
  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }

  // Calcular dígito verificador
  const digits = cleaned.split('').map(Number);
  const checkDigit = digits[10];
  const documentDigits = digits.slice(0, 10);

  // Multiplicadores según AFIP
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

  // Suma ponderada
  const sum = documentDigits.reduce(
    (acc, digit, index) => acc + digit * multipliers[index],
    0
  );

  // Calcular verificador
  const remainder = sum % 11;
  const calculatedCheck = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;

  return checkDigit === calculatedCheck;
}

/**
 * Formatea un CUIT con guiones: XX-XXXXXXXX-X
 */
export function formatCUIT(cuit: string): string {
  const cleaned = cuit.replace(/[-\s]/g, '');

  if (!/^\d{11}$/.test(cleaned)) {
    return cuit; // Retornar sin cambios si no es válido
  }

  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
}

/**
 * Limpia el formato de un CUIT (quita guiones)
 */
export function cleanCUIT(cuit: string): string {
  return cuit.replace(/[-\s]/g, '');
}

/**
 * Valida si un CUIT es de persona física o jurídica
 */
export function getCUITType(cuit: string): 'PERSONA_FISICA' | 'PERSONA_JURIDICA' | 'UNKNOWN' {
  const cleaned = cleanCUIT(cuit);
  const prefix = cleaned.slice(0, 2);

  // Prefijos para personas físicas
  const personaFisica = ['20', '23', '24', '27'];

  // Prefijos para personas jurídicas
  const personaJuridica = ['30', '33', '34'];

  if (personaFisica.includes(prefix)) {
    return 'PERSONA_FISICA';
  }

  if (personaJuridica.includes(prefix)) {
    return 'PERSONA_JURIDICA';
  }

  return 'UNKNOWN';
}

/**
 * Extrae el DNI de un CUIT de persona física
 */
export function extractDNIFromCUIT(cuit: string): string | null {
  const cleaned = cleanCUIT(cuit);
  const type = getCUITType(cuit);

  if (type !== 'PERSONA_FISICA') {
    return null;
  }

  // Los 8 dígitos centrales son el DNI
  return cleaned.slice(2, 10);
}

/**
 * Genera un CUIT a partir de un DNI y tipo de persona
 */
export function generateCUITFromDNI(
  dni: string,
  gender: 'M' | 'F' | 'EMPRESA' = 'M'
): string {
  const cleanedDNI = dni.replace(/\D/g, '').padStart(8, '0');

  // Determinar prefijo según género
  let prefix: string;
  if (gender === 'M') {
    prefix = '20';
  } else if (gender === 'F') {
    prefix = '27';
  } else {
    prefix = '30'; // Empresa
  }

  // Calcular dígito verificador
  const partial = prefix + cleanedDNI;
  const digits = partial.split('').map(Number);
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

  const sum = digits.reduce(
    (acc, digit, index) => acc + digit * multipliers[index],
    0
  );

  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;

  return `${prefix}${cleanedDNI}${checkDigit}`;
}
