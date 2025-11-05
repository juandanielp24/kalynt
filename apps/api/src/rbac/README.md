# RBAC Module Documentation

## Table of Contents
- [Features](#features)
- [Predefined System Roles](#predefined-system-roles)
- [Resources and Permissions](#resources-and-permissions)
- [Backend Usage](#backend-usage)
- [Frontend Usage](#frontend-usage)
- [Roles Management](#roles-management)
- [Audit Logs](#audit-logs)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Performance Considerations](#performance-considerations)
- [Migration Guide](#migration-guide)
- [API Reference](#api-reference)

## Features

- ✅ Granular permission control at resource and action level
- ✅ Permission hierarchy (MANAGE grants all actions, ALL:MANAGE grants superadmin)
- ✅ Multi-tenant support with tenant-scoped roles
- ✅ System and custom roles
- ✅ Automatic audit logging for all permission-checked operations
- ✅ Global permission guards for API endpoints
- ✅ Decorator-based permission checks
- ✅ Frontend permission guards and hooks
- ✅ Real-time permission validation
- ✅ Comprehensive testing suite

## Predefined System Roles

### Owner
**Full system access with ALL:MANAGE permission**
- All permissions across all resources
- Can manage all aspects of the system
- Typically for business owners or C-level executives
- Cannot be deleted

### Admin
**Administrative access with elevated permissions**
- Users management (CREATE, READ, UPDATE, DELETE)
- Roles management (CREATE, READ, UPDATE, DELETE)
- Audit logs access (READ)
- Products management (MANAGE)
- Sales management (MANAGE)
- Inventory management (MANAGE)
- Customers management (MANAGE)
- Reports access (READ)
- Settings management (UPDATE)

### Manager
**Supervisory access for operations**
- Products: MANAGE
- Sales: MANAGE
- Inventory: MANAGE
- Customers: MANAGE
- Reports: READ
- Users: READ

### Cashier
**Point-of-sale operations**
- Sales: CREATE, READ
- Products: READ
- Customers: READ, CREATE
- Inventory: READ

### Inventory Manager
**Inventory and product management**
- Inventory: MANAGE
- Products: MANAGE
- Purchase Orders: MANAGE
- Suppliers: MANAGE
- Reports: READ (inventory-related)

### Sales Representative
**Customer relationship and sales**
- Sales: CREATE, READ, UPDATE
- Customers: MANAGE
- Products: READ
- Quotes: MANAGE
- Reports: READ (sales-related)

### Accountant
**Financial and reporting access**
- Sales: READ
- Reports: READ
- Invoices: MANAGE
- Payments: MANAGE
- Expenses: MANAGE

## Resources and Permissions

### Permission Structure
Each permission consists of:
- **Resource**: The entity being protected (e.g., PRODUCTS, SALES)
- **Action**: The operation being performed (e.g., CREATE, READ, UPDATE, DELETE, MANAGE)

### Permission Hierarchy
```
ALL:MANAGE (Superadmin - grants everything)
  └── RESOURCE:MANAGE (grants all actions on that resource)
      ├── RESOURCE:CREATE
      ├── RESOURCE:READ
      ├── RESOURCE:UPDATE
      ├── RESOURCE:DELETE
      └── RESOURCE:EXECUTE
```

### Available Resources

| Resource | Description |
|----------|-------------|
| `ALL` | All resources (superadmin) |
| `USERS` | User management |
| `ROLES` | Role and permission management |
| `PRODUCTS` | Product catalog |
| `SALES` | Sales transactions |
| `INVENTORY` | Inventory management |
| `CUSTOMERS` | Customer management |
| `SUPPLIERS` | Supplier management |
| `PURCHASE_ORDERS` | Purchase orders |
| `INVOICES` | Invoice management |
| `PAYMENTS` | Payment processing |
| `EXPENSES` | Expense tracking |
| `REPORTS` | Reporting and analytics |
| `QUOTES` | Sales quotes |
| `SETTINGS` | System settings |
| `AUDIT_LOGS` | Audit log access |

### Available Actions

| Action | Description |
|--------|-------------|
| `READ` | View/list resources |
| `CREATE` | Create new resources |
| `UPDATE` | Edit existing resources |
| `DELETE` | Remove resources |
| `EXECUTE` | Execute special operations |
| `MANAGE` | Full control (grants all actions) |

## Backend Usage

### Protecting Endpoints with Decorators

```typescript
import { Controller, Get, Post, Put, Delete } from '@nestjs/common';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PermissionResource, PermissionAction } from '@prisma/client';

@Controller('products')
export class ProductsController {
  // Require specific permission
  @Get()
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.READ)
  async findAll(@CurrentUser() user: any) {
    // Only users with PRODUCTS:READ (or PRODUCTS:MANAGE, or ALL:MANAGE) can access
    return this.productsService.findAll(user.tenantId);
  }

  @Post()
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.CREATE)
  async create(@CurrentUser() user: any, @Body() data: CreateProductDto) {
    return this.productsService.create(user.tenantId, data);
  }

  @Put(':id')
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.UPDATE)
  async update(@Param('id') id: string, @Body() data: UpdateProductDto) {
    return this.productsService.update(id, data);
  }

  @Delete(':id')
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.DELETE)
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
```

### Programmatic Permission Checks

```typescript
import { Injectable } from '@nestjs/common';
import { RBACService } from '../rbac/rbac.service';
import { PermissionResource, PermissionAction } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private rbacService: RBACService) {}

  async findOne(userId: string, productId: string) {
    // Check permission programmatically
    const hasPermission = await this.rbacService.hasPermission({
      userId,
      resource: PermissionResource.PRODUCTS,
      action: PermissionAction.READ,
    });

    if (!hasPermission) {
      throw new ForbiddenException('No tienes permiso para ver productos');
    }

    return this.prisma.product.findUnique({ where: { id: productId } });
  }

  async bulkUpdate(userId: string, updates: any[]) {
    // Require permission (throws ForbiddenException if not granted)
    await this.rbacService.requirePermission({
      userId,
      resource: PermissionResource.PRODUCTS,
      action: PermissionAction.UPDATE,
    });

    // Perform bulk update
    return this.prisma.product.updateMany(updates);
  }
}
```

### Audit Logs (Automatic)

Audit logs are automatically created for all endpoints protected with `@RequirePermission()`. The `AuditLogInterceptor` captures:
- User performing the action
- Resource and action
- Request details (method, endpoint, IP, user-agent)
- Changes made (for UPDATE/DELETE operations)
- Timestamp

```typescript
// Audit logs are automatic, but you can also create them manually
import { AuditLogsService } from '../rbac/audit-logs.service';

@Injectable()
export class CustomService {
  constructor(private auditLogsService: AuditLogsService) {}

  async performSensitiveOperation(userId: string, data: any) {
    // Your operation logic
    const result = await this.someOperation(data);

    // Create audit log manually if needed
    await this.auditLogsService.createAuditLog({
      userId,
      tenantId: user.tenantId,
      entity: 'CUSTOM_ENTITY',
      entityId: result.id,
      action: 'EXECUTE',
      metadata: {
        operation: 'sensitive_operation',
        details: 'Custom operation details',
      },
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
    });

    return result;
  }
}
```

## Frontend Usage

### Using the usePermissions Hook

```typescript
import { usePermissions } from '@/contexts/PermissionsContext';

export function ProductsPage() {
  const {
    permissions,
    isLoading,
    hasPermission,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    canManage,
  } = usePermissions();

  // Check specific permission
  const canCreateProducts = hasPermission('PRODUCTS', 'CREATE');

  // Or use convenience methods
  const canEditProducts = canUpdate('PRODUCTS');
  const canDeleteProducts = canDelete('PRODUCTS');
  const canManageProducts = canManage('PRODUCTS');

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <h1>Products</h1>

      {canCreateProducts && (
        <button onClick={handleCreate}>Create Product</button>
      )}

      <ProductList
        showEdit={canEditProducts}
        showDelete={canDeleteProducts}
      />
    </div>
  );
}
```

### Using Permission Guard Components

```typescript
import {
  PermissionGuard,
  CanCreate,
  CanRead,
  CanUpdate,
  CanDelete,
  CanManage,
} from '@/components/auth/PermissionGuard';

export function ProductsPage() {
  return (
    <div>
      {/* Only show if user has PRODUCTS:READ */}
      <PermissionGuard resource="PRODUCTS" action="READ">
        <ProductList />
      </PermissionGuard>

      {/* With fallback */}
      <PermissionGuard
        resource="PRODUCTS"
        action="READ"
        fallback={<p>No tienes permiso para ver productos</p>}
      >
        <ProductList />
      </PermissionGuard>

      {/* Convenience components */}
      <CanCreate resource="PRODUCTS">
        <button>Create Product</button>
      </CanCreate>

      <CanUpdate resource="PRODUCTS">
        <button>Edit Product</button>
      </CanUpdate>

      <CanDelete resource="PRODUCTS">
        <button>Delete Product</button>
      </CanDelete>

      <CanManage resource="SALES">
        <AdminPanel />
      </CanManage>
    </div>
  );
}
```

### Protecting Routes

```typescript
// app/(dashboard)/products/page.tsx
import { PermissionGuard } from '@/components/auth/PermissionGuard';

export default function ProductsPage() {
  return (
    <PermissionGuard
      resource="PRODUCTS"
      action="READ"
      fallback={
        <div className="p-4">
          <h1>Acceso Denegado</h1>
          <p>No tienes permiso para ver esta página.</p>
        </div>
      }
    >
      <ProductsContent />
    </PermissionGuard>
  );
}
```

## Roles Management

### Creating a Custom Role

```typescript
// Backend
import { RBACService } from './rbac/rbac.service';

const role = await rbacService.createRole({
  name: 'Store Manager',
  description: 'Manages store operations',
  tenantId: 'tenant-123',
  permissionIds: [
    'perm-products-manage',
    'perm-inventory-manage',
    'perm-sales-create',
    'perm-sales-read',
  ],
  createdBy: 'user-123',
});
```

```typescript
// Frontend
import { useMutation } from '@tanstack/react-query';
import { rbacApi } from '@/lib/api/rbac';

const createRoleMutation = useMutation({
  mutationFn: (data: { name: string; description: string; permissionIds: string[] }) =>
    rbacApi.createRole(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['roles'] });
    toast({ title: 'Rol creado exitosamente' });
  },
});

// Usage
createRoleMutation.mutate({
  name: 'Store Manager',
  description: 'Manages store operations',
  permissionIds: selectedPermissions,
});
```

### Assigning a Role to a User

```typescript
// Backend
await prisma.user.update({
  where: { id: userId },
  data: { roleId: roleId },
});
```

```typescript
// Frontend API call
await apiClient.put(`/users/${userId}/role`, {
  roleId: 'role-123',
});
```

### Updating Role Permissions

```typescript
// Backend
await rbacService.updateRolePermissions({
  roleId: 'role-123',
  permissionIds: ['perm-1', 'perm-2', 'perm-3'],
  updatedBy: 'user-123',
});
```

```typescript
// Frontend
const updateRoleMutation = useMutation({
  mutationFn: (permissionIds: string[]) =>
    rbacApi.updateRolePermissions(roleId, permissionIds),
});

updateRoleMutation.mutate(['perm-1', 'perm-2']);
```

## Audit Logs

### Viewing Audit Logs

```typescript
// Backend
import { AuditLogsService } from './rbac/audit-logs.service';

const logs = await auditLogsService.getAuditLogs('tenant-123', {
  page: 1,
  limit: 50,
  userId: 'user-123', // Optional filter
  resource: 'PRODUCTS', // Optional filter
  action: 'CREATE', // Optional filter
  startDate: '2024-01-01', // Optional filter
  endDate: '2024-01-31', // Optional filter
});

// Returns:
// {
//   logs: [...],
//   pagination: { total: 150, page: 1, limit: 50, totalPages: 3 }
// }
```

```typescript
// Frontend
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['audit-logs', page, filters],
  queryFn: async () => {
    const params = new URLSearchParams({
      page: page.toString(),
      ...filters,
    });
    const response = await apiClient.get(`/audit-logs?${params}`);
    return response.data;
  },
});
```

### Getting Audit Statistics

```typescript
// Backend
const stats = await auditLogsService.getAuditStatistics('tenant-123', {
  startDate: '2024-01-01',
  endDate: '2024-01-31',
});

// Returns:
// {
//   totalLogs: 1234,
//   byAction: { CREATE: 500, UPDATE: 300, DELETE: 100, READ: 334 },
//   byResource: { PRODUCTS: 600, SALES: 400, USERS: 234 },
//   topUsers: [
//     { userId: 'user-1', name: 'John Doe', count: 450 },
//     { userId: 'user-2', name: 'Jane Smith', count: 300 }
//   ]
// }
```

## Testing

### Backend Unit Tests

```typescript
// rbac.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { RBACService } from './rbac.service';

describe('RBACService', () => {
  let service: RBACService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RBACService, { provide: 'PRISMA', useValue: mockPrisma }],
    }).compile();

    service = module.get<RBACService>(RBACService);
  });

  it('should return true for user with specific permission', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);

    const result = await service.hasPermission({
      userId: 'user-1',
      resource: PermissionResource.PRODUCTS,
      action: PermissionAction.CREATE,
    });

    expect(result).toBe(true);
  });
});
```

### Frontend Component Tests

```typescript
// PermissionGuard.test.tsx
import { render, screen } from '@testing-library/react';
import { PermissionGuard } from './PermissionGuard';

jest.mock('@/contexts/PermissionsContext', () => ({
  usePermissions: () => ({
    hasPermission: (resource: string, action: string) =>
      resource === 'PRODUCTS' && action === 'READ',
  }),
}));

it('should render children when user has permission', () => {
  render(
    <PermissionGuard resource="PRODUCTS" action="READ">
      <div>Protected Content</div>
    </PermissionGuard>
  );

  expect(screen.getByText('Protected Content')).toBeInTheDocument();
});
```

### E2E Tests

```typescript
// roles-management.spec.ts
import { test, expect } from '../../fixtures/auth.fixture';
import { TestDataHelper } from '../../helpers/test-data.helper';

test.describe('RBAC - Roles Management', () => {
  let testData: TestDataHelper;

  test.beforeEach(async () => {
    testData = new TestDataHelper();
  });

  test('should create custom role', async ({ page, authenticatedUser }) => {
    await testData.assignRoleWithPermissions(authenticatedUser.id, [
      { resource: 'ROLES', action: 'READ' },
      { resource: 'ROLES', action: 'CREATE' },
    ]);

    await page.goto('/settings/roles');
    await page.click('button:has-text("Crear Rol")');
    await page.fill('input#name', 'Custom Test Role');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Rol creado')).toBeVisible();
  });
});
```

## Best Practices

### 1. Use the Most Specific Permission
```typescript
// ❌ Bad: Using MANAGE when you only need READ
@RequirePermission(PermissionResource.PRODUCTS, PermissionAction.MANAGE)
async getProduct() { }

// ✅ Good: Use the specific action you need
@RequirePermission(PermissionResource.PRODUCTS, PermissionAction.READ)
async getProduct() { }
```

### 2. Don't Bypass Permission Checks
```typescript
// ❌ Bad: Direct database access without permission check
async deleteProduct(productId: string) {
  return this.prisma.product.delete({ where: { id: productId } });
}

// ✅ Good: Always check permissions
@RequirePermission(PermissionResource.PRODUCTS, PermissionAction.DELETE)
async deleteProduct(productId: string) {
  return this.prisma.product.delete({ where: { id: productId } });
}
```

### 3. Use Permission Guards on Frontend Routes
```typescript
// ✅ Good: Protect entire pages
export default function ProductsPage() {
  return (
    <PermissionGuard resource="PRODUCTS" action="READ" fallback={<AccessDenied />}>
      <ProductsContent />
    </PermissionGuard>
  );
}
```

### 4. Provide Meaningful Fallbacks
```typescript
// ❌ Bad: No feedback to user
<PermissionGuard resource="PRODUCTS" action="CREATE">
  <CreateButton />
</PermissionGuard>

// ✅ Good: Explain why content is hidden
<PermissionGuard
  resource="PRODUCTS"
  action="CREATE"
  fallback={<p>Solicita permiso de creación a tu administrador</p>}
>
  <CreateButton />
</PermissionGuard>
```

### 5. Cache Permission Checks
The `PermissionsContext` automatically caches permissions for the current user session. Don't create additional caching layers.

### 6. Use System Roles for Common Patterns
Don't create custom roles that duplicate system roles. Use the predefined roles (Owner, Admin, Manager, etc.) whenever possible.

### 7. Audit Sensitive Operations
For operations beyond CRUD, manually create audit logs:
```typescript
await auditLogsService.createAuditLog({
  userId,
  tenantId,
  entity: 'PAYMENT_GATEWAY',
  action: 'EXECUTE',
  metadata: { operation: 'refund_initiated', amount: 100 },
});
```

## Troubleshooting

### User can't access a resource they should have permission for

**Check user's role and permissions:**
```sql
SELECT
  u.email,
  r.name as role_name,
  p.resource,
  p.action,
  rp.granted
FROM users u
JOIN roles r ON u."roleId" = r.id
JOIN role_permissions rp ON r.id = rp."roleId"
JOIN permissions p ON rp."permissionId" = p.id
WHERE u.id = 'user-id-here';
```

**Verify permission hierarchy:**
- Check if user has the exact permission (e.g., PRODUCTS:CREATE)
- Check if user has MANAGE permission on that resource (e.g., PRODUCTS:MANAGE)
- Check if user has ALL:MANAGE (superadmin)

### Permission guard not working in frontend

**Check the PermissionsContext is properly set up:**
```typescript
// _app.tsx or layout.tsx
<PermissionsProvider>
  <YourApp />
</PermissionsProvider>
```

**Verify API is returning permissions:**
```typescript
// Check /auth/me endpoint returns permissions
GET /auth/me
// Should include: { user: {...}, permissions: [...] }
```

### Audit logs not being created

**Verify AuditLogInterceptor is registered:**
```typescript
// rbac.module.ts
@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
```

**Check endpoint is protected with @RequirePermission:**
```typescript
// Audit logs only created for protected endpoints
@RequirePermission(PermissionResource.PRODUCTS, PermissionAction.CREATE)
async create() { }
```

### Role changes not taking effect

**Frontend may be caching permissions. Force re-fetch:**
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ['permissions'] });
```

**Or logout and login again to get fresh token with updated permissions.**

## Performance Considerations

### Permission Checks
- Permission checks involve database queries
- The `PermissionGuard` (global guard) runs on EVERY request
- Consider caching user permissions in JWT token for read-heavy workloads

### Audit Logs
- Audit logs are written on every protected endpoint call
- For high-traffic endpoints, consider:
  - Async audit log writing
  - Batching audit log writes
  - Partitioning audit logs table by date

### Database Indexes
Ensure these indexes exist:
```sql
-- User role lookup
CREATE INDEX idx_users_role ON users("roleId");

-- Role permissions lookup
CREATE INDEX idx_role_permissions_role ON role_permissions("roleId");

-- Audit logs queries
CREATE INDEX idx_audit_logs_tenant ON audit_logs("tenantId");
CREATE INDEX idx_audit_logs_user ON audit_logs("userId");
CREATE INDEX idx_audit_logs_created ON audit_logs("createdAt");
CREATE INDEX idx_audit_logs_entity ON audit_logs("entity");
```

### Reducing Database Queries
```typescript
// ❌ Bad: Multiple permission checks = multiple DB queries
await rbacService.hasPermission({ userId, resource: 'PRODUCTS', action: 'CREATE' });
await rbacService.hasPermission({ userId, resource: 'PRODUCTS', action: 'UPDATE' });
await rbacService.hasPermission({ userId, resource: 'PRODUCTS', action: 'DELETE' });

// ✅ Good: Fetch user permissions once, check in memory
const user = await prisma.user.findUnique({
  where: { id: userId },
  include: { rbacRole: { include: { permissions: { include: { permission: true } } } } },
});

const permissions = user.rbacRole.permissions.map(rp => ({
  resource: rp.permission.resource,
  action: rp.permission.action,
}));

// Now check in memory
const canCreate = hasPermissionInMemory(permissions, 'PRODUCTS', 'CREATE');
const canUpdate = hasPermissionInMemory(permissions, 'PRODUCTS', 'UPDATE');
const canDelete = hasPermissionInMemory(permissions, 'PRODUCTS', 'DELETE');
```

## Migration Guide

### Migrating from Simple Role System

If you have an existing system with simple roles (owner, admin, cashier), follow these steps:

#### 1. Run Database Migration
```bash
npx prisma migrate deploy
```

#### 2. Seed System Roles and Permissions
```bash
npm run seed:rbac
```

#### 3. Run Migration Script
```bash
npm run migrate:to-rbac
```

This script (`scripts/migrate-to-rbac.ts`) will:
- Map old roles to new RBAC roles
- Assign appropriate roleId to all users
- Verify all users have valid roles

#### 4. Update Backend Code
Replace simple role checks:
```typescript
// Before
if (user.role === 'admin' || user.role === 'owner') {
  // Allow access
}

// After
@RequirePermission(PermissionResource.USERS, PermissionAction.READ)
async getUsers() { }
```

#### 5. Update Frontend Code
Replace role-based UI logic:
```typescript
// Before
{user.role === 'admin' && <AdminButton />}

// After
<CanManage resource="USERS">
  <AdminButton />
</CanManage>
```

#### 6. Test Thoroughly
- Test all user roles can access appropriate resources
- Test permission denials work correctly
- Test audit logs are being created
- Run E2E test suite

#### 7. Deploy
- Deploy backend first
- Deploy frontend
- Monitor audit logs for any permission errors

## API Reference

### RBACService

#### `hasPermission(params)`
Check if user has a specific permission.

**Parameters:**
```typescript
{
  userId: string;
  resource: PermissionResource;
  action: PermissionAction;
}
```

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const hasAccess = await rbacService.hasPermission({
  userId: 'user-123',
  resource: PermissionResource.PRODUCTS,
  action: PermissionAction.CREATE,
});
```

#### `requirePermission(params)`
Require a permission or throw ForbiddenException.

**Parameters:** Same as `hasPermission`

**Returns:** `Promise<void>`

**Throws:** `ForbiddenException` if user lacks permission

**Example:**
```typescript
await rbacService.requirePermission({
  userId: 'user-123',
  resource: PermissionResource.PRODUCTS,
  action: PermissionAction.DELETE,
});
```

#### `createRole(params)`
Create a new custom role.

**Parameters:**
```typescript
{
  name: string;
  description?: string;
  tenantId: string;
  permissionIds: string[];
  createdBy: string;
}
```

**Returns:** `Promise<Role>`

**Example:**
```typescript
const role = await rbacService.createRole({
  name: 'Store Manager',
  description: 'Manages store operations',
  tenantId: 'tenant-123',
  permissionIds: ['perm-1', 'perm-2'],
  createdBy: 'user-123',
});
```

#### `updateRolePermissions(params)`
Update permissions for a role.

**Parameters:**
```typescript
{
  roleId: string;
  permissionIds: string[];
  updatedBy: string;
}
```

**Returns:** `Promise<Role>`

#### `deleteRole(roleId, deletedBy)`
Delete a custom role.

**Parameters:**
- `roleId: string`
- `deletedBy: string`

**Returns:** `Promise<Role>`

**Throws:** `BadRequestException` if role is system role or has users assigned

### AuditLogsService

#### `getAuditLogs(tenantId, options)`
Retrieve audit logs with filtering and pagination.

**Parameters:**
```typescript
tenantId: string;
options: {
  page?: number;
  limit?: number;
  userId?: string;
  resource?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
}
```

**Returns:**
```typescript
Promise<{
  logs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}>
```

#### `getAuditStatistics(tenantId, options)`
Get audit log statistics.

**Parameters:**
```typescript
tenantId: string;
options: {
  startDate?: string;
  endDate?: string;
}
```

**Returns:**
```typescript
Promise<{
  totalLogs: number;
  byAction: Record<string, number>;
  byResource: Record<string, number>;
  topUsers: Array<{
    userId: string;
    name: string;
    email: string;
    count: number;
  }>;
}>
```

### Decorators

#### `@RequirePermission(resource, action)`
Protect an endpoint with permission check. Automatically creates audit log.

**Parameters:**
- `resource: PermissionResource`
- `action: PermissionAction`

**Example:**
```typescript
@Get()
@RequirePermission(PermissionResource.PRODUCTS, PermissionAction.READ)
async findAll() {
  return this.productsService.findAll();
}
```

#### `@CurrentUser()`
Extract current user from request.

**Returns:** User object with id, email, name, tenantId, roleId

**Example:**
```typescript
@Get('me')
async getProfile(@CurrentUser() user: any) {
  return { user };
}
```

### Frontend Hooks

#### `usePermissions()`
Access permissions context.

**Returns:**
```typescript
{
  permissions: Array<{ resource: string; action: string }>;
  isLoading: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  canCreate: (resource: string) => boolean;
  canRead: (resource: string) => boolean;
  canUpdate: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  canManage: (resource: string) => boolean;
}
```

### Frontend Components

#### `<PermissionGuard>`
Conditionally render children based on permission.

**Props:**
```typescript
{
  resource: string;
  action: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}
```

**Example:**
```typescript
<PermissionGuard
  resource="PRODUCTS"
  action="CREATE"
  fallback={<p>No permission</p>}
>
  <CreateButton />
</PermissionGuard>
```

#### `<CanCreate>`, `<CanRead>`, `<CanUpdate>`, `<CanDelete>`, `<CanManage>`
Convenience components for specific actions.

**Props:**
```typescript
{
  resource: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}
```

**Example:**
```typescript
<CanCreate resource="PRODUCTS">
  <button>Create Product</button>
</CanCreate>
```

---

## Support

For questions or issues:
1. Check this documentation
2. Review the troubleshooting section
3. Check the E2E tests for usage examples
4. Contact the development team

## License

Internal use only. All rights reserved.
