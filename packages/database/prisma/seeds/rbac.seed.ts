import { PrismaClient, PermissionResource, PermissionAction } from '@prisma/client';

const prisma = new PrismaClient();

// Definición de permisos por recurso
const PERMISSION_DEFINITIONS = [
  // PRODUCTS
  { resource: PermissionResource.PRODUCTS, action: PermissionAction.CREATE, description: 'Crear productos' },
  { resource: PermissionResource.PRODUCTS, action: PermissionAction.READ, description: 'Ver productos' },
  { resource: PermissionResource.PRODUCTS, action: PermissionAction.UPDATE, description: 'Editar productos' },
  { resource: PermissionResource.PRODUCTS, action: PermissionAction.DELETE, description: 'Eliminar productos' },
  { resource: PermissionResource.PRODUCTS, action: PermissionAction.MANAGE, description: 'Gestión completa de productos' },

  // CATEGORIES
  { resource: PermissionResource.CATEGORIES, action: PermissionAction.CREATE, description: 'Crear categorías' },
  { resource: PermissionResource.CATEGORIES, action: PermissionAction.READ, description: 'Ver categorías' },
  { resource: PermissionResource.CATEGORIES, action: PermissionAction.UPDATE, description: 'Editar categorías' },
  { resource: PermissionResource.CATEGORIES, action: PermissionAction.DELETE, description: 'Eliminar categorías' },
  { resource: PermissionResource.CATEGORIES, action: PermissionAction.MANAGE, description: 'Gestión completa de categorías' },

  // STOCK
  { resource: PermissionResource.STOCK, action: PermissionAction.CREATE, description: 'Crear registros de stock' },
  { resource: PermissionResource.STOCK, action: PermissionAction.READ, description: 'Ver stock' },
  { resource: PermissionResource.STOCK, action: PermissionAction.UPDATE, description: 'Actualizar stock' },
  { resource: PermissionResource.STOCK, action: PermissionAction.DELETE, description: 'Eliminar registros de stock' },
  { resource: PermissionResource.STOCK, action: PermissionAction.MANAGE, description: 'Gestión completa de stock' },

  // SALES
  { resource: PermissionResource.SALES, action: PermissionAction.CREATE, description: 'Crear ventas' },
  { resource: PermissionResource.SALES, action: PermissionAction.READ, description: 'Ver ventas' },
  { resource: PermissionResource.SALES, action: PermissionAction.UPDATE, description: 'Editar ventas' },
  { resource: PermissionResource.SALES, action: PermissionAction.DELETE, description: 'Anular ventas' },
  { resource: PermissionResource.SALES, action: PermissionAction.MANAGE, description: 'Gestión completa de ventas' },

  // INVOICES
  { resource: PermissionResource.INVOICES, action: PermissionAction.CREATE, description: 'Generar facturas' },
  { resource: PermissionResource.INVOICES, action: PermissionAction.READ, description: 'Ver facturas' },
  { resource: PermissionResource.INVOICES, action: PermissionAction.UPDATE, description: 'Modificar facturas' },
  { resource: PermissionResource.INVOICES, action: PermissionAction.DELETE, description: 'Anular facturas' },
  { resource: PermissionResource.INVOICES, action: PermissionAction.MANAGE, description: 'Gestión completa de facturación' },

  // CUSTOMERS
  { resource: PermissionResource.CUSTOMERS, action: PermissionAction.CREATE, description: 'Crear clientes' },
  { resource: PermissionResource.CUSTOMERS, action: PermissionAction.READ, description: 'Ver clientes' },
  { resource: PermissionResource.CUSTOMERS, action: PermissionAction.UPDATE, description: 'Editar clientes' },
  { resource: PermissionResource.CUSTOMERS, action: PermissionAction.DELETE, description: 'Eliminar clientes' },
  { resource: PermissionResource.CUSTOMERS, action: PermissionAction.MANAGE, description: 'Gestión completa de clientes' },

  // USERS
  { resource: PermissionResource.USERS, action: PermissionAction.CREATE, description: 'Crear usuarios' },
  { resource: PermissionResource.USERS, action: PermissionAction.READ, description: 'Ver usuarios' },
  { resource: PermissionResource.USERS, action: PermissionAction.UPDATE, description: 'Editar usuarios' },
  { resource: PermissionResource.USERS, action: PermissionAction.DELETE, description: 'Eliminar usuarios' },
  { resource: PermissionResource.USERS, action: PermissionAction.MANAGE, description: 'Gestión completa de usuarios' },

  // ROLES
  { resource: PermissionResource.ROLES, action: PermissionAction.CREATE, description: 'Crear roles' },
  { resource: PermissionResource.ROLES, action: PermissionAction.READ, description: 'Ver roles' },
  { resource: PermissionResource.ROLES, action: PermissionAction.UPDATE, description: 'Editar roles' },
  { resource: PermissionResource.ROLES, action: PermissionAction.DELETE, description: 'Eliminar roles' },
  { resource: PermissionResource.ROLES, action: PermissionAction.MANAGE, description: 'Gestión completa de roles' },

  // LOCATIONS
  { resource: PermissionResource.LOCATIONS, action: PermissionAction.CREATE, description: 'Crear ubicaciones' },
  { resource: PermissionResource.LOCATIONS, action: PermissionAction.READ, description: 'Ver ubicaciones' },
  { resource: PermissionResource.LOCATIONS, action: PermissionAction.UPDATE, description: 'Editar ubicaciones' },
  { resource: PermissionResource.LOCATIONS, action: PermissionAction.DELETE, description: 'Eliminar ubicaciones' },
  { resource: PermissionResource.LOCATIONS, action: PermissionAction.MANAGE, description: 'Gestión completa de ubicaciones' },

  // REPORTS
  { resource: PermissionResource.REPORTS, action: PermissionAction.CREATE, description: 'Crear reportes' },
  { resource: PermissionResource.REPORTS, action: PermissionAction.READ, description: 'Ver reportes' },
  { resource: PermissionResource.REPORTS, action: PermissionAction.DELETE, description: 'Eliminar reportes' },
  { resource: PermissionResource.REPORTS, action: PermissionAction.EXECUTE, description: 'Generar reportes' },
  { resource: PermissionResource.REPORTS, action: PermissionAction.MANAGE, description: 'Gestión completa de reportes' },

  // ANALYTICS
  { resource: PermissionResource.ANALYTICS, action: PermissionAction.READ, description: 'Ver analytics' },
  { resource: PermissionResource.ANALYTICS, action: PermissionAction.MANAGE, description: 'Gestión completa de analytics' },

  // NOTIFICATIONS
  { resource: PermissionResource.NOTIFICATIONS, action: PermissionAction.CREATE, description: 'Enviar notificaciones' },
  { resource: PermissionResource.NOTIFICATIONS, action: PermissionAction.READ, description: 'Ver notificaciones' },
  { resource: PermissionResource.NOTIFICATIONS, action: PermissionAction.UPDATE, description: 'Marcar notificaciones' },
  { resource: PermissionResource.NOTIFICATIONS, action: PermissionAction.DELETE, description: 'Eliminar notificaciones' },
  { resource: PermissionResource.NOTIFICATIONS, action: PermissionAction.MANAGE, description: 'Gestión completa de notificaciones' },

  // SETTINGS
  { resource: PermissionResource.SETTINGS, action: PermissionAction.READ, description: 'Ver configuración' },
  { resource: PermissionResource.SETTINGS, action: PermissionAction.UPDATE, description: 'Modificar configuración' },
  { resource: PermissionResource.SETTINGS, action: PermissionAction.MANAGE, description: 'Gestión completa de configuración' },

  // AUDIT_LOGS
  { resource: PermissionResource.AUDIT_LOGS, action: PermissionAction.READ, description: 'Ver logs de auditoría' },
  { resource: PermissionResource.AUDIT_LOGS, action: PermissionAction.MANAGE, description: 'Gestión completa de logs' },

  // BACKUPS
  { resource: PermissionResource.BACKUPS, action: PermissionAction.READ, description: 'Ver backups' },
  { resource: PermissionResource.BACKUPS, action: PermissionAction.EXECUTE, description: 'Ejecutar backups' },
  { resource: PermissionResource.BACKUPS, action: PermissionAction.MANAGE, description: 'Gestión completa de backups' },

  // INTEGRATIONS
  { resource: PermissionResource.INTEGRATIONS, action: PermissionAction.CREATE, description: 'Crear integraciones' },
  { resource: PermissionResource.INTEGRATIONS, action: PermissionAction.READ, description: 'Ver integraciones' },
  { resource: PermissionResource.INTEGRATIONS, action: PermissionAction.UPDATE, description: 'Editar integraciones' },
  { resource: PermissionResource.INTEGRATIONS, action: PermissionAction.DELETE, description: 'Eliminar integraciones' },
  { resource: PermissionResource.INTEGRATIONS, action: PermissionAction.MANAGE, description: 'Gestión completa de integraciones' },

  // PAYMENTS
  { resource: PermissionResource.PAYMENTS, action: PermissionAction.CREATE, description: 'Procesar pagos' },
  { resource: PermissionResource.PAYMENTS, action: PermissionAction.READ, description: 'Ver pagos' },
  { resource: PermissionResource.PAYMENTS, action: PermissionAction.UPDATE, description: 'Modificar pagos' },
  { resource: PermissionResource.PAYMENTS, action: PermissionAction.DELETE, description: 'Anular pagos' },
  { resource: PermissionResource.PAYMENTS, action: PermissionAction.MANAGE, description: 'Gestión completa de pagos' },

  // TAXES
  { resource: PermissionResource.TAXES, action: PermissionAction.CREATE, description: 'Crear impuestos' },
  { resource: PermissionResource.TAXES, action: PermissionAction.READ, description: 'Ver impuestos' },
  { resource: PermissionResource.TAXES, action: PermissionAction.UPDATE, description: 'Editar impuestos' },
  { resource: PermissionResource.TAXES, action: PermissionAction.DELETE, description: 'Eliminar impuestos' },
  { resource: PermissionResource.TAXES, action: PermissionAction.MANAGE, description: 'Gestión completa de impuestos' },

  // DISCOUNTS
  { resource: PermissionResource.DISCOUNTS, action: PermissionAction.CREATE, description: 'Crear descuentos' },
  { resource: PermissionResource.DISCOUNTS, action: PermissionAction.READ, description: 'Ver descuentos' },
  { resource: PermissionResource.DISCOUNTS, action: PermissionAction.UPDATE, description: 'Editar descuentos' },
  { resource: PermissionResource.DISCOUNTS, action: PermissionAction.DELETE, description: 'Eliminar descuentos' },
  { resource: PermissionResource.DISCOUNTS, action: PermissionAction.MANAGE, description: 'Gestión completa de descuentos' },

  // SUPPLIERS
  { resource: PermissionResource.SUPPLIERS, action: PermissionAction.CREATE, description: 'Crear proveedores' },
  { resource: PermissionResource.SUPPLIERS, action: PermissionAction.READ, description: 'Ver proveedores' },
  { resource: PermissionResource.SUPPLIERS, action: PermissionAction.UPDATE, description: 'Editar proveedores' },
  { resource: PermissionResource.SUPPLIERS, action: PermissionAction.DELETE, description: 'Eliminar proveedores' },
  { resource: PermissionResource.SUPPLIERS, action: PermissionAction.MANAGE, description: 'Gestión completa de proveedores' },

  // WHATSAPP
  { resource: PermissionResource.WHATSAPP, action: PermissionAction.CREATE, description: 'Enviar mensajes de WhatsApp' },
  { resource: PermissionResource.WHATSAPP, action: PermissionAction.READ, description: 'Ver mensajes de WhatsApp' },
  { resource: PermissionResource.WHATSAPP, action: PermissionAction.UPDATE, description: 'Actualizar configuración de WhatsApp' },
  { resource: PermissionResource.WHATSAPP, action: PermissionAction.DELETE, description: 'Eliminar mensajes de WhatsApp' },
  { resource: PermissionResource.WHATSAPP, action: PermissionAction.MANAGE, description: 'Gestión completa de WhatsApp' },

  // DELIVERY
  { resource: PermissionResource.DELIVERY, action: PermissionAction.CREATE, description: 'Crear deliveries' },
  { resource: PermissionResource.DELIVERY, action: PermissionAction.READ, description: 'Ver deliveries' },
  { resource: PermissionResource.DELIVERY, action: PermissionAction.UPDATE, description: 'Actualizar deliveries' },
  { resource: PermissionResource.DELIVERY, action: PermissionAction.DELETE, description: 'Eliminar deliveries' },
  { resource: PermissionResource.DELIVERY, action: PermissionAction.MANAGE, description: 'Gestión completa de deliveries' },

  // DRIVERS
  { resource: PermissionResource.DRIVERS, action: PermissionAction.CREATE, description: 'Crear repartidores' },
  { resource: PermissionResource.DRIVERS, action: PermissionAction.READ, description: 'Ver repartidores' },
  { resource: PermissionResource.DRIVERS, action: PermissionAction.UPDATE, description: 'Actualizar repartidores' },
  { resource: PermissionResource.DRIVERS, action: PermissionAction.DELETE, description: 'Eliminar repartidores' },
  { resource: PermissionResource.DRIVERS, action: PermissionAction.MANAGE, description: 'Gestión completa de repartidores' },
];

// Definición de roles del sistema con sus permisos
const SYSTEM_ROLES = [
  {
    name: 'Owner',
    description: 'Propietario del negocio con acceso completo a todas las funcionalidades',
    permissions: [
      // Acceso completo a TODO (MANAGE en todos los recursos)
      'PRODUCTS:MANAGE', 'CATEGORIES:MANAGE', 'STOCK:MANAGE', 'SALES:MANAGE',
      'INVOICES:MANAGE', 'CUSTOMERS:MANAGE', 'USERS:MANAGE', 'ROLES:MANAGE',
      'LOCATIONS:MANAGE', 'REPORTS:MANAGE', 'ANALYTICS:MANAGE', 'NOTIFICATIONS:MANAGE',
      'SETTINGS:MANAGE', 'AUDIT_LOGS:MANAGE', 'BACKUPS:MANAGE', 'INTEGRATIONS:MANAGE',
      'PAYMENTS:MANAGE', 'TAXES:MANAGE', 'DISCOUNTS:MANAGE', 'SUPPLIERS:MANAGE',
      'WHATSAPP:MANAGE', 'DELIVERY:MANAGE', 'DRIVERS:MANAGE',
    ],
  },
  {
    name: 'Admin',
    description: 'Administrador con acceso casi completo, excepto configuración crítica del sistema',
    permissions: [
      // Gestión completa de operaciones
      'PRODUCTS:MANAGE', 'CATEGORIES:MANAGE', 'STOCK:MANAGE', 'SALES:MANAGE',
      'INVOICES:MANAGE', 'CUSTOMERS:MANAGE', 'USERS:MANAGE', 'ROLES:READ',
      'LOCATIONS:MANAGE', 'REPORTS:MANAGE', 'ANALYTICS:MANAGE', 'NOTIFICATIONS:MANAGE',
      // Solo lectura en configuración crítica
      'SETTINGS:READ', 'AUDIT_LOGS:READ', 'BACKUPS:READ', 'INTEGRATIONS:READ',
      // Gestión de pagos y finanzas
      'PAYMENTS:MANAGE', 'TAXES:MANAGE', 'DISCOUNTS:MANAGE', 'SUPPLIERS:MANAGE',
      // WhatsApp
      'WHATSAPP:MANAGE',
      // Delivery y Drivers
      'DELIVERY:MANAGE', 'DRIVERS:MANAGE',
    ],
  },
  {
    name: 'Manager',
    description: 'Gerente de tienda con capacidad de supervisión y gestión operativa',
    permissions: [
      // Operaciones del día a día
      'PRODUCTS:READ', 'PRODUCTS:UPDATE', 'CATEGORIES:READ', 'STOCK:READ', 'STOCK:UPDATE',
      'SALES:MANAGE', 'INVOICES:MANAGE', 'CUSTOMERS:MANAGE',
      // Usuario básico
      'USERS:READ', 'ROLES:READ', 'LOCATIONS:READ',
      // Reportes y analytics
      'REPORTS:CREATE', 'REPORTS:READ', 'REPORTS:DELETE', 'ANALYTICS:READ',
      // Notificaciones
      'NOTIFICATIONS:READ', 'NOTIFICATIONS:UPDATE',
      // Pagos y descuentos
      'PAYMENTS:READ', 'PAYMENTS:CREATE', 'DISCOUNTS:READ', 'DISCOUNTS:CREATE',
      // WhatsApp
      'WHATSAPP:READ', 'WHATSAPP:CREATE',
      // Delivery y Drivers
      'DELIVERY:READ', 'DELIVERY:CREATE', 'DELIVERY:UPDATE', 'DRIVERS:READ',
    ],
  },
  {
    name: 'Cashier',
    description: 'Cajero con permisos para realizar ventas y consultar inventario básico',
    permissions: [
      // Solo lectura de productos y stock
      'PRODUCTS:READ', 'CATEGORIES:READ', 'STOCK:READ',
      // Crear y ver ventas (solo las propias)
      'SALES:CREATE', 'SALES:READ',
      // Facturación
      'INVOICES:CREATE', 'INVOICES:READ',
      // Clientes básico
      'CUSTOMERS:READ', 'CUSTOMERS:CREATE',
      // Pagos
      'PAYMENTS:CREATE', 'PAYMENTS:READ',
      // Notificaciones propias
      'NOTIFICATIONS:READ', 'NOTIFICATIONS:UPDATE',
    ],
  },
  {
    name: 'Inventory Manager',
    description: 'Encargado de inventario con gestión completa de productos y stock',
    permissions: [
      // Gestión completa de inventario
      'PRODUCTS:MANAGE', 'CATEGORIES:MANAGE', 'STOCK:MANAGE',
      // Ver ventas para ajustes de stock
      'SALES:READ',
      // Proveedores
      'SUPPLIERS:MANAGE',
      // Ubicaciones
      'LOCATIONS:READ',
      // Reportes de inventario
      'REPORTS:CREATE', 'REPORTS:READ',
      // Notificaciones
      'NOTIFICATIONS:READ', 'NOTIFICATIONS:UPDATE',
    ],
  },
  {
    name: 'Sales Representative',
    description: 'Representante de ventas con enfoque en clientes y ventas',
    permissions: [
      // Productos (lectura)
      'PRODUCTS:READ', 'CATEGORIES:READ', 'STOCK:READ',
      // Gestión de ventas
      'SALES:MANAGE', 'INVOICES:MANAGE',
      // Gestión de clientes
      'CUSTOMERS:MANAGE',
      // Pagos
      'PAYMENTS:CREATE', 'PAYMENTS:READ',
      // Descuentos
      'DISCOUNTS:READ', 'DISCOUNTS:CREATE',
      // Reportes de ventas
      'REPORTS:READ', 'ANALYTICS:READ',
      // Notificaciones
      'NOTIFICATIONS:READ', 'NOTIFICATIONS:UPDATE',
    ],
  },
  {
    name: 'Accountant',
    description: 'Contador con acceso de solo lectura a datos financieros y reportes',
    permissions: [
      // Solo lectura de ventas y finanzas
      'SALES:READ', 'INVOICES:READ', 'PAYMENTS:READ',
      // Productos y clientes (lectura)
      'PRODUCTS:READ', 'CATEGORIES:READ', 'CUSTOMERS:READ',
      // Impuestos y descuentos
      'TAXES:READ', 'DISCOUNTS:READ',
      // Reportes completos
      'REPORTS:MANAGE', 'ANALYTICS:READ',
      // Auditoría
      'AUDIT_LOGS:READ',
      // Notificaciones
      'NOTIFICATIONS:READ', 'NOTIFICATIONS:UPDATE',
    ],
  },
];

export async function seedRBAC() {
  console.log('🔐 Seeding RBAC system...');

  try {
    // 1. Crear todos los permisos
    console.log('📋 Creating permissions...');
    const permissionsMap = new Map<string, string>(); // key: "RESOURCE:ACTION", value: permissionId

    for (const permDef of PERMISSION_DEFINITIONS) {
      const permission = await prisma.permission.upsert({
        where: {
          resource_action: {
            resource: permDef.resource,
            action: permDef.action,
          },
        },
        update: {
          description: permDef.description,
        },
        create: {
          resource: permDef.resource,
          action: permDef.action,
          description: permDef.description,
        },
      });

      const key = `${permDef.resource}:${permDef.action}`;
      permissionsMap.set(key, permission.id);
      console.log(`  ✓ ${key}`);
    }

    console.log(`✅ Created ${permissionsMap.size} permissions`);

    // 2. Crear roles del sistema
    console.log('\n👥 Creating system roles...');

    for (const roleDef of SYSTEM_ROLES) {
      // Crear o actualizar el rol
      const role = await prisma.role.upsert({
        where: {
          tenantId_name: {
            tenantId: null,
            name: roleDef.name,
          },
        },
        update: {
          description: roleDef.description,
          isSystem: true,
          isActive: true,
        },
        create: {
          name: roleDef.name,
          description: roleDef.description,
          isSystem: true,
          isActive: true,
          tenantId: null, // Roles del sistema no pertenecen a ningún tenant
        },
      });

      console.log(`  📌 Role: ${roleDef.name}`);

      // Asignar permisos al rol
      for (const permKey of roleDef.permissions) {
        const permissionId = permissionsMap.get(permKey);

        if (!permissionId) {
          console.warn(`    ⚠️  Permission not found: ${permKey}`);
          continue;
        }

        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permissionId,
            },
          },
          update: {
            granted: true,
          },
          create: {
            roleId: role.id,
            permissionId: permissionId,
            granted: true,
          },
        });
      }

      console.log(`    ✓ Assigned ${roleDef.permissions.length} permissions`);
    }

    console.log('\n✅ RBAC system seeded successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Permissions: ${permissionsMap.size}`);
    console.log(`   - System Roles: ${SYSTEM_ROLES.length}`);

  } catch (error) {
    console.error('❌ Error seeding RBAC:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  seedRBAC()
    .then(() => {
      console.log('\n🎉 RBAC seed completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 RBAC seed failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
