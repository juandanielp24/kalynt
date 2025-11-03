import { betterAuth } from 'better-auth';
import { PrismaClient } from '@retail/database';

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prisma,

  // Email provider (usando servicio de emails existente)
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      // Integrar con NotificationsService
      console.log(`Send verification email to ${user.email}: ${url}`);
      // TODO: Implementar envío de email
    },
  },

  // Session configuration
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutos
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 días
    updateAge: 60 * 60 * 24, // Actualizar cada 24 horas
  },

  // Account linking
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['email'],
    },
  },

  // Security
  advanced: {
    generateId: () => {
      // Usar función personalizada si es necesario
      return crypto.randomUUID();
    },
    crossSubDomainCookies: {
      enabled: false,
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
  },

  // Rate limiting
  rateLimit: {
    enabled: true,
    window: 60, // 1 minuto
    max: 10, // 10 requests
  },

  // URLs
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  basePath: '/auth',

  // Trusted origins
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ],
});

export type Session = typeof auth.$Infer.Session;
