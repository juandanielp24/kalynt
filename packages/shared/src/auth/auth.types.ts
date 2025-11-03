export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
  VIEWER = 'VIEWER',
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  tenantSlug: string;
  emailVerified: boolean;
}

export interface Session {
  user: AuthUser;
  sessionId: string;
  expiresAt: Date;
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  tenantName: string;
  tenantSlug: string;
  country?: string;
}
