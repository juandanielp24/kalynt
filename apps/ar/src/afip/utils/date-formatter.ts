import { format, addDays } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

/**
 * Utilidades para formateo de fechas según AFIP
 */
export class DateFormatter {
  private static readonly TIMEZONE = 'America/Argentina/Buenos_Aires';

  /**
   * Formatea fecha para AFIP (YYYYMMDD)
   */
  static toAFIPFormat(date: Date = new Date()): string {
    const zonedDate = utcToZonedTime(date, this.TIMEZONE);
    return format(zonedDate, 'yyyyMMdd');
  }

  /**
   * Formatea fecha y hora para WSAA (ISO)
   */
  static toWSAAFormat(date: Date = new Date()): string {
    const zonedDate = utcToZonedTime(date, this.TIMEZONE);
    return format(zonedDate, "yyyy-MM-dd'T'HH:mm:ss");
  }

  /**
   * Parsea fecha de AFIP (YYYYMMDD) a Date
   */
  static fromAFIPFormat(afipDate: string): Date {
    const year = parseInt(afipDate.substring(0, 4));
    const month = parseInt(afipDate.substring(4, 6)) - 1;
    const day = parseInt(afipDate.substring(6, 8));
    return new Date(year, month, day);
  }

  /**
   * Obtiene la fecha de vencimiento del CAE (10 días después)
   */
  static getCAEExpirationDate(invoiceDate: Date = new Date()): string {
    const expiration = addDays(invoiceDate, 10);
    return this.toAFIPFormat(expiration);
  }

  /**
   * Obtiene fecha actual en Argentina
   */
  static now(): Date {
    return utcToZonedTime(new Date(), this.TIMEZONE);
  }

  /**
   * Parsea una fecha en formato AFIP (YYYYMMDD) a Date
   * Alias de fromAFIPFormat para compatibilidad
   */
  static parseAFIPDate(dateStr: string): Date {
    return this.fromAFIPFormat(dateStr);
  }

  /**
   * Formatea una fecha al formato AFIP (YYYYMMDD)
   * Alias de toAFIPFormat para compatibilidad
   */
  static formatAFIPDate(date: Date = new Date()): string {
    return this.toAFIPFormat(date);
  }

  /**
   * Calcula la fecha de vencimiento del CAE (10 días desde la fecha dada)
   * Alias de getCAEExpirationDate para compatibilidad
   */
  static calculateCAEExpiration(date: Date = new Date()): Date {
    return addDays(date, 10);
  }
}
