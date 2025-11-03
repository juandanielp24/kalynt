import type { UUID, Timestamp } from './common.types';
import type { UserRole } from '../constants/roles';

export interface User {
  id: UUID;
  tenantId: UUID;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  preferences: UserPreferences;
  lastLoginAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export interface UserPreferences {
  language: string; // e.g., 'es', 'en'
  theme: 'light' | 'dark' | 'system';
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  lowStock: boolean;
  dailySummary: boolean;
}

export interface UserSession {
  userId: UUID;
  tenantId: UUID;
  role: UserRole;
  permissions: string[];
  expiresAt: Timestamp;
}

export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt' | 'lastLoginAt'>;

export type UpdateUserInput = Partial<Omit<User, 'id' | 'tenantId' | 'createdAt' | 'updatedAt' | 'deletedAt'>>;

export interface LoginCredentials {
  email: string;
  password: string;
  tenantId?: UUID;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
