import { format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Handlebars helpers for email templates
 */
export const handlebarsHelpers = {
  /**
   * Format a date with a specific format string
   * @example {{formatDate date "dd/MM/yyyy"}}
   * @example {{formatDate date "EEEE, dd 'de' MMMM 'de' yyyy"}}
   */
  formatDate: (date: Date | string, formatString: string) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    try {
      return format(dateObj, formatString, { locale: es });
    } catch (error) {
      console.error('Error formatting date:', error);
      return String(date);
    }
  },

  /**
   * Format cents to currency string
   * @example {{formatCurrency 150000}} -> $1,500.00
   */
  formatCurrency: (cents: number) => {
    if (cents == null || isNaN(cents)) return '$0.00';
    const amount = cents / 100;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  },

  /**
   * Format a number with locale-specific formatting
   * @example {{formatNumber 1234567.89 decimals=2}}
   */
  formatNumber: (
    value: number,
    options?: {
      decimals?: number;
      useGrouping?: boolean;
      style?: 'decimal' | 'percent';
    },
  ) => {
    if (value == null || isNaN(value)) return '0';

    const formatOptions: Intl.NumberFormatOptions = {
      minimumFractionDigits: options?.decimals ?? 0,
      maximumFractionDigits: options?.decimals ?? 2,
      useGrouping: options?.useGrouping ?? true,
    };

    if (options?.style === 'percent') {
      formatOptions.style = 'percent';
    }

    return new Intl.NumberFormat('es-AR', formatOptions).format(value);
  },

  /**
   * Get the current year
   * @example {{year}} -> 2025
   */
  year: () => {
    return new Date().getFullYear();
  },

  /**
   * Conditional helper to compare two values
   * @example {{#ifEquals status "active"}}Active{{else}}Inactive{{/ifEquals}}
   */
  ifEquals: function (arg1: any, arg2: any, options: any) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
  },

  /**
   * Math helper: addition
   * @example {{add 5 3}} -> 8
   */
  add: (a: number, b: number) => {
    return (a || 0) + (b || 0);
  },

  /**
   * Math helper: subtraction
   * @example {{subtract 10 3}} -> 7
   */
  subtract: (a: number, b: number) => {
    return (a || 0) - (b || 0);
  },

  /**
   * Math helper: multiplication
   * @example {{multiply 4 5}} -> 20
   */
  multiply: (a: number, b: number) => {
    return (a || 0) * (b || 0);
  },

  /**
   * Math helper: division
   * @example {{divide 20 4}} -> 5
   */
  divide: (a: number, b: number) => {
    if (!b || b === 0) return 0;
    return (a || 0) / b;
  },

  /**
   * Format a percentage
   * @example {{formatPercent 0.755}} -> 75.50%
   */
  formatPercent: (value: number, decimals = 2) => {
    if (value == null || isNaN(value)) return '0%';
    return `${(value * 100).toFixed(decimals)}%`;
  },

  /**
   * Truncate a string to a maximum length
   * @example {{truncate longText 50}}
   */
  truncate: (str: string, maxLength: number) => {
    if (!str) return '';
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  },

  /**
   * Convert string to uppercase
   * @example {{uppercase "hello"}} -> HELLO
   */
  uppercase: (str: string) => {
    return str ? str.toUpperCase() : '';
  },

  /**
   * Convert string to lowercase
   * @example {{lowercase "HELLO"}} -> hello
   */
  lowercase: (str: string) => {
    return str ? str.toLowerCase() : '';
  },

  /**
   * Capitalize first letter of string
   * @example {{capitalize "hello world"}} -> Hello world
   */
  capitalize: (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Check if a value is defined and not null
   * @example {{#ifDefined value}}Has value{{/ifDefined}}
   */
  ifDefined: function (value: any, options: any) {
    return value != null ? options.fn(this) : options.inverse(this);
  },

  /**
   * Join array items with a separator
   * @example {{join tags ", "}}
   */
  join: (array: any[], separator: string) => {
    if (!Array.isArray(array)) return '';
    return array.join(separator);
  },

  /**
   * Get the length of an array or string
   * @example {{length items}}
   */
  length: (value: any[] | string) => {
    if (!value) return 0;
    return value.length;
  },

  /**
   * Format a date as relative time (e.g., "2 hours ago")
   * @example {{timeAgo date}}
   */
  timeAgo: (date: Date | string) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const intervals: { [key: string]: number } = {
      año: 31536000,
      mes: 2592000,
      semana: 604800,
      día: 86400,
      hora: 3600,
      minuto: 60,
      segundo: 1,
    };

    for (const [name, secondsInInterval] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInInterval);
      if (interval >= 1) {
        return interval === 1
          ? `hace 1 ${name}`
          : `hace ${interval} ${name}${interval > 1 && name !== 'mes' ? 's' : name === 'mes' ? 'es' : ''}`;
      }
    }

    return 'ahora';
  },

  /**
   * Conditional helper to check if value is greater than
   * @example {{#ifGreaterThan count 0}}Has items{{/ifGreaterThan}}
   */
  ifGreaterThan: function (a: number, b: number, options: any) {
    return a > b ? options.fn(this) : options.inverse(this);
  },

  /**
   * Conditional helper to check if value is less than
   * @example {{#ifLessThan stock minStock}}Low stock!{{/ifLessThan}}
   */
  ifLessThan: function (a: number, b: number, options: any) {
    return a < b ? options.fn(this) : options.inverse(this);
  },
};
