import { UserRole } from './auth.types';

export const PERMISSIONS = {
  // POS
  'pos:read': 'Ver punto de venta',
  'pos:write': 'Procesar ventas',
  'pos:refund': 'Hacer devoluciones',

  // Inventory
  'inventory:read': 'Ver inventario',
  'inventory:write': 'Gestionar productos',
  'inventory:adjust': 'Ajustar stock',

  // Sales
  'sales:read': 'Ver ventas',
  'sales:export': 'Exportar reportes',

  // Customers
  'customers:read': 'Ver clientes',
  'customers:write': 'Gestionar clientes',

  // Users
  'users:read': 'Ver usuarios',
  'users:write': 'Gestionar usuarios',
  'users:delete': 'Eliminar usuarios',

  // Settings
  'settings:read': 'Ver configuración',
  'settings:write': 'Modificar configuración',

  // Reports
  'reports:read': 'Ver reportes',
  'reports:advanced': 'Reportes avanzados',
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: Object.keys(PERMISSIONS) as Permission[], // Todos los permisos

  [UserRole.ADMIN]: [
    'pos:read',
    'pos:write',
    'pos:refund',
    'inventory:read',
    'inventory:write',
    'inventory:adjust',
    'sales:read',
    'sales:export',
    'customers:read',
    'customers:write',
    'users:read',
    'settings:read',
    'reports:read',
    'reports:advanced',
  ],

  [UserRole.CASHIER]: [
    'pos:read',
    'pos:write',
    'inventory:read',
    'customers:read',
    'sales:read',
  ],

  [UserRole.VIEWER]: [
    'pos:read',
    'inventory:read',
    'sales:read',
    'customers:read',
    'reports:read',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}
