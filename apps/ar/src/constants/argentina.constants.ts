/**
 * Constantes para Argentina (AFIP/ARCA)
 */

// URLs de AFIP
export const AFIP_URLS = {
  testing: {
    wsaa: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    wsfev1: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
  },
  production: {
    wsaa: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
    wsfev1: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
  },
};

// Tipos de comprobante (según AFIP)
export const INVOICE_TYPES = {
  FACTURA_A: 1,
  FACTURA_B: 6,
  FACTURA_C: 11,
  FACTURA_E: 19, // Factura E (exportación)
  FACTURA_M: 51, // Factura M (monotributista)
  NOTA_CREDITO_A: 3,
  NOTA_CREDITO_B: 8,
  NOTA_CREDITO_C: 13,
  NOTA_DEBITO_A: 2,
  NOTA_DEBITO_B: 7,
  NOTA_DEBITO_C: 12,
} as const;

// Alias con prefijo AFIP_ para compatibilidad
export const AFIP_INVOICE_TYPES = INVOICE_TYPES;

// Tipos de documento
export const DOCUMENT_TYPES = {
  CUIT: 80,
  CUIL: 86,
  CDI: 87,
  LE: 89,
  LC: 90,
  CI_EXTRANJERA: 91,
  EN_TRAMITE: 92,
  ACTA_NACIMIENTO: 93,
  CI_BS_AS: 95,
  DNI: 96,
  PASAPORTE: 94,
  CI_POLICIA_FEDERAL: 0,
  CI_BUENOS_AIRES: 1,
  CI_CATAMARCA: 2,
  CI_CORDOBA: 3,
  CI_CORRIENTES: 4,
  CI_ENTRE_RIOS: 5,
  CI_JUJUY: 6,
  CI_MENDOZA: 7,
  CI_LA_RIOJA: 8,
  CI_SALTA: 9,
  CI_SAN_JUAN: 10,
  CI_SAN_LUIS: 11,
  CI_SANTA_FE: 12,
  CI_SANTIAGO_ESTERO: 13,
  CI_TUCUMAN: 14,
  CI_CHACO: 16,
  CI_CHUBUT: 17,
  CI_FORMOSA: 18,
  CI_MISIONES: 19,
  CI_NEUQUEN: 20,
  CI_LA_PAMPA: 21,
  CI_RIO_NEGRO: 22,
  CI_SANTA_CRUZ: 23,
  CI_TIERRA_DEL_FUEGO: 24,
  CONSUMIDOR_FINAL: 99, // Documento genérico para consumidores finales
} as const;

// Alias con prefijo AFIP_ para compatibilidad
export const AFIP_DOCUMENT_TYPES = DOCUMENT_TYPES;

// Tipos de concepto
export const CONCEPT_TYPES = {
  PRODUCTOS: 1,
  SERVICIOS: 2,
  PRODUCTOS_Y_SERVICIOS: 3,
} as const;

// Alias con prefijo AFIP_ para compatibilidad
export const AFIP_CONCEPT_TYPES = CONCEPT_TYPES;

// Condiciones de IVA
export const IVA_CONDITIONS = {
  RESPONSABLE_INSCRIPTO: 1,
  RESPONSABLE_MONOTRIBUTO: 6,
  EXENTO: 4,
  CONSUMIDOR_FINAL: 5,
  RESPONSABLE_NO_INSCRIPTO: 13,
} as const;

// Alícuotas de IVA
export const IVA_RATES = {
  0: 3, // 0%
  10.5: 4, // 10.5%
  21: 5, // 21%
  27: 6, // 27%
  5: 8, // 5%
  2.5: 9, // 2.5%
} as const;

// Códigos de IVA (formato alternativo)
export const AFIP_IVA_CODES = {
  IVA_0: 3,
  IVA_2_5: 9,
  IVA_5: 8,
  IVA_10_5: 4,
  IVA_21: 5,
  IVA_27: 6,
  EXENTO: 2,
  NO_GRAVADO: 1,
} as const;

// Monedas
export const CURRENCIES = {
  ARS: 'PES',
  USD: 'DOL',
  EUR: 'EUR',
} as const;

// Puntos de venta por defecto
export const DEFAULT_SALE_POINT = 1;

// TTL del token de autenticación (en segundos)
export const TOKEN_TTL = 43200; // 12 horas

// CUIT de testing de AFIP
export const TEST_CUIT = '20409378472';

// Códigos de error comunes
export const AFIP_ERROR_CODES = {
  1000: 'CUIT inválido',
  1001: 'Punto de venta inválido',
  1002: 'Número de comprobante inválido',
  1003: 'Tipo de comprobante inválido',
  1004: 'Tipo de documento inválido',
  1005: 'Número de documento inválido',
  1006: 'Fecha inválida',
  1007: 'Importe total inválido',
  1008: 'Importe neto inválido',
  1009: 'Moneda inválida',
  1010: 'Cotización inválida',
  1011: 'Código de autorización duplicado',
  1012: 'Token expirado',
  1013: 'Certificado expirado',
  1014: 'CUIT no autorizado para operar',
  1015: 'Servicio no disponible',
} as const;

// Provincias de Argentina (código AFIP)
export const PROVINCES = {
  CAPITAL_FEDERAL: 0,
  BUENOS_AIRES: 1,
  CATAMARCA: 2,
  CORDOBA: 3,
  CORRIENTES: 4,
  ENTRE_RIOS: 5,
  JUJUY: 6,
  MENDOZA: 7,
  LA_RIOJA: 8,
  SALTA: 9,
  SAN_JUAN: 10,
  SAN_LUIS: 11,
  SANTA_FE: 12,
  SANTIAGO_DEL_ESTERO: 13,
  TUCUMAN: 14,
  CHACO: 16,
  CHUBUT: 17,
  FORMOSA: 18,
  MISIONES: 19,
  NEUQUEN: 20,
  LA_PAMPA: 21,
  RIO_NEGRO: 22,
  SANTA_CRUZ: 23,
  TIERRA_DEL_FUEGO: 24,
} as const;
