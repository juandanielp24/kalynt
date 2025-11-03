import { parseISO } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { es } from 'date-fns/locale';

// Timezone por defecto para Argentina
export const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';

/**
 * Formatea una fecha según el timezone argentino
 * @param date - Fecha a formatear
 * @param formatStr - Formato de salida (default: 'dd/MM/yyyy HH:mm')
 * @param timezone - Timezone (default: Argentina)
 * @returns Fecha formateada
 */
export function formatDate(
  date: Date | string,
  formatStr: string = 'dd/MM/yyyy HH:mm',
  timezone: string = ARGENTINA_TIMEZONE
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatInTimeZone(dateObj, timezone, formatStr, { locale: es });
}

/**
 * Formatea una fecha como fecha corta (dd/MM/yyyy)
 * @param date - Fecha a formatear
 * @returns Fecha formateada
 */
export function formatDateShort(date: Date | string): string {
  return formatDate(date, 'dd/MM/yyyy');
}

/**
 * Formatea una fecha como hora (HH:mm)
 * @param date - Fecha a formatear
 * @returns Hora formateada
 */
export function formatTime(date: Date | string): string {
  return formatDate(date, 'HH:mm');
}

/**
 * Convierte una fecha a timezone argentino
 * @param date - Fecha a convertir
 * @param timezone - Timezone destino (default: Argentina)
 * @returns Fecha en el timezone especificado
 */
export function toArgentinaTime(
  date: Date | string,
  timezone: string = ARGENTINA_TIMEZONE
): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return toZonedTime(dateObj, timezone);
}

/**
 * Parsea un string de fecha en formato argentino (dd/MM/yyyy)
 * @param dateStr - String de fecha
 * @returns Objeto Date
 */
export function parseDate(dateStr: string): Date {
  // Intentar parsear formato ISO primero
  if (dateStr.includes('T') || dateStr.includes('-')) {
    return parseISO(dateStr);
  }

  // Parsear formato dd/MM/yyyy
  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  const [day, month, year] = parts.map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Obtiene la fecha actual en timezone argentino
 * @returns Fecha actual
 */
export function now(): Date {
  return toArgentinaTime(new Date());
}

/**
 * Verifica si una fecha es hoy
 * @param date - Fecha a verificar
 * @returns true si es hoy
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = now();
  return formatDateShort(dateObj) === formatDateShort(today);
}
