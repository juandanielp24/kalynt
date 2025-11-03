export const TAX_RATE_IVA = 0.21; // 21% IVA

export const PROVINCES = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
] as const;

export type Province = typeof PROVINCES[number];

// Tasas de Ingresos Brutos por provincia (valores aproximados, verificar actualizadas)
export const IIBB_RATES: Record<Province, number> = {
  'Buenos Aires': 0.035,
  'CABA': 0.03,
  'Catamarca': 0.03,
  'Chaco': 0.035,
  'Chubut': 0.03,
  'Córdoba': 0.04,
  'Corrientes': 0.035,
  'Entre Ríos': 0.035,
  'Formosa': 0.03,
  'Jujuy': 0.03,
  'La Pampa': 0.03,
  'La Rioja': 0.03,
  'Mendoza': 0.035,
  'Misiones': 0.03,
  'Neuquén': 0.03,
  'Río Negro': 0.03,
  'Salta': 0.035,
  'San Juan': 0.03,
  'San Luis': 0.03,
  'Santa Cruz': 0.03,
  'Santa Fe': 0.035,
  'Santiago del Estero': 0.03,
  'Tierra del Fuego': 0.03,
  'Tucumán': 0.035,
} as const;

export const INVOICE_TYPES = {
  A: 'Factura A - Responsable Inscripto a Responsable Inscripto',
  B: 'Factura B - Responsable Inscripto a Consumidor Final',
  C: 'Factura C - Monotributista o Exento',
  E: 'Factura E - Exportación',
} as const;

export type InvoiceType = keyof typeof INVOICE_TYPES;
