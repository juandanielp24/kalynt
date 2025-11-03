export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  CASHIER = 'cashier',
  VIEWER = 'viewer',
}

export const ROLE_PERMISSIONS = {
  [UserRole.OWNER]: ['*'], // todos los permisos
  [UserRole.ADMIN]: [
    'pos:read',
    'pos:write',
    'inventory:read',
    'inventory:write',
    'reports:read',
    'users:read',
    'users:write',
  ],
  [UserRole.CASHIER]: [
    'pos:read',
    'pos:write',
    'inventory:read',
  ],
  [UserRole.VIEWER]: [
    'pos:read',
    'inventory:read',
    'reports:read',
  ],
} as const;
