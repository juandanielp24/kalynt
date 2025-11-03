import { z } from 'zod';

/**
 * Schema de validación para variables de entorno compartidas
 */
export const envSchema = z.object({
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  DATABASE_POOL_MIN: z.coerce.number().int().min(0).default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).default(10),

  // Redis
  REDIS_URL: z.string().url('REDIS_URL must be a valid URL').optional(),

  // API
  API_URL: z.string().url('API_URL must be a valid URL'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),

  // Storage (S3, Cloudinary, etc.)
  STORAGE_PROVIDER: z.enum(['local', 's3', 'cloudinary']).default('local'),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_REGION: z.string().optional(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),

  // Email
  EMAIL_PROVIDER: z.enum(['smtp', 'sendgrid', 'ses']).default('smtp'),
  EMAIL_FROM: z.string().email('EMAIL_FROM must be a valid email'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Feature flags
  FEATURE_MULTI_TENANT: z.coerce.boolean().default(true),
  FEATURE_ELECTRONIC_INVOICING: z.coerce.boolean().default(false),
  FEATURE_LOYALTY_PROGRAM: z.coerce.boolean().default(false),

  // External services
  AFIP_WSDL_URL: z.string().url().optional(),
  AFIP_CERT_PATH: z.string().optional(),
  AFIP_KEY_PATH: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Valida las variables de entorno contra el schema
 * @param env - Objeto de variables de entorno (process.env)
 * @returns Variables validadas y parseadas
 * @throws Error si la validación falla
 */
export function validateEnv(env: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.format();
    console.error('❌ Invalid environment variables:', errors);
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

/**
 * Helper para verificar si estamos en producción
 */
export function isProduction(env: Env): boolean {
  return env.NODE_ENV === 'production';
}

/**
 * Helper para verificar si estamos en desarrollo
 */
export function isDevelopment(env: Env): boolean {
  return env.NODE_ENV === 'development';
}

/**
 * Helper para verificar si estamos en test
 */
export function isTest(env: Env): boolean {
  return env.NODE_ENV === 'test';
}
