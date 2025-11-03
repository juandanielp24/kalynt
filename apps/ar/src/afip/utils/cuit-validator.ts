/**
 * Validador de CUIT/CUIL argentino
 * 
 * Formato: XX-XXXXXXXX-X
 * - 2 dígitos de tipo de persona
 * - 8 dígitos de DNI
 * - 1 dígito verificador
 */

export class CuitValidator {
  /**
   * Valida un CUIT/CUIL
   */
  static validate(cuit: string): boolean {
    if (!cuit) return false;

    // Eliminar guiones y espacios
    const cleanCuit = cuit.replace(/[-\s]/g, '');

    // Debe tener 11 dígitos
    if (cleanCuit.length !== 11) return false;

    // Debe ser numérico
    if (!/^\d{11}$/.test(cleanCuit)) return false;

    // Calcular dígito verificador
    const calculatedDigit = this.calculateVerificationDigit(cleanCuit.substring(0, 10));
    const providedDigit = parseInt(cleanCuit[10]);

    return calculatedDigit === providedDigit;
  }

  /**
   * Calcula el dígito verificador
   */
  static calculateVerificationDigit(cuitWithoutDigit: string): number {
    const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cuitWithoutDigit[i]) * multipliers[i];
    }

    const remainder = sum % 11;
    const digit = 11 - remainder;

    // Si el dígito es 11, devolver 0
    // Si el dígito es 10, técnicamente es inválido, pero se usa 9
    if (digit === 11) return 0;
    if (digit === 10) return 9;
    
    return digit;
  }

  /**
   * Formatea un CUIT con guiones
   */
  static format(cuit: string): string {
    const cleanCuit = cuit.replace(/[-\s]/g, '');
    
    if (cleanCuit.length !== 11) {
      throw new Error('CUIT debe tener 11 dígitos');
    }

    return `${cleanCuit.substring(0, 2)}-${cleanCuit.substring(2, 10)}-${cleanCuit.substring(10)}`;
  }

  /**
   * Limpia un CUIT (quita guiones y espacios)
   */
  static clean(cuit: string): string {
    return cuit.replace(/[-\s]/g, '');
  }

  /**
   * Genera un CUIT completo a partir de un DNI
   */
  static generateFromDNI(dni: string, gender: 'M' | 'F' | 'C' = 'M'): string {
    const cleanDni = dni.replace(/\D/g, '').padStart(8, '0');
    
    // Prefijos según género
    // 20: Hombre, 23/24: Masculino, 27: Mujer, 30/33/34: Femenino
    let prefix: string;
    switch (gender) {
      case 'M':
        prefix = '20';
        break;
      case 'F':
        prefix = '27';
        break;
      case 'C': // Empresa
        prefix = '30';
        break;
      default:
        prefix = '20';
    }

    const cuitWithoutDigit = prefix + cleanDni;
    const digit = this.calculateVerificationDigit(cuitWithoutDigit);

    return cuitWithoutDigit + digit;
  }

  /**
   * Extrae el DNI de un CUIT
   */
  static extractDNI(cuit: string): string {
    const cleanCuit = this.clean(cuit);
    return cleanCuit.substring(2, 10);
  }

  /**
   * Determina el tipo de persona según el prefijo
   */
  static getPersonType(cuit: string): 'FISICA' | 'JURIDICA' | 'DESCONOCIDO' {
    const cleanCuit = this.clean(cuit);
    const prefix = parseInt(cleanCuit.substring(0, 2));

    // 20, 23, 24, 27 = Persona física
    if ([20, 23, 24, 27].includes(prefix)) {
      return 'FISICA';
    }

    // 30, 33, 34 = Persona jurídica
    if ([30, 33, 34].includes(prefix)) {
      return 'JURIDICA';
    }

    return 'DESCONOCIDO';
  }

  /**
   * Genera un CUIT aleatorio válido (solo para testing)
   */
  static generateTestCUIT(): string {
    const prefix = '20'; // Persona física - hombre
    const dni = String(Math.floor(Math.random() * 90000000) + 10000000); // 8 dígitos

    const partial = prefix + dni;
    const digit = this.calculateVerificationDigit(partial);

    return `${prefix}-${dni}-${digit}`;
  }
}
