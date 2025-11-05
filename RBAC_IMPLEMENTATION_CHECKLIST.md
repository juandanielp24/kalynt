# RBAC Implementation Checklist

Use this checklist to ensure complete and correct implementation of the RBAC system. Check off items as you complete them.

## Database & Migrations

### Schema
- [ ] `roles` table created with proper columns
  - [ ] `id` (UUID, primary key)
  - [ ] `name` (string, unique)
  - [ ] `description` (text, optional)
  - [ ] `isSystem` (boolean)
  - [ ] `tenantId` (UUID, nullable for system roles)
  - [ ] Timestamps (createdAt, updatedAt)

- [ ] `permissions` table created
  - [ ] `id` (UUID, primary key)
  - [ ] `resource` (enum)
  - [ ] `action` (enum)
  - [ ] `description` (text)
  - [ ] Unique constraint on (resource, action)

- [ ] `role_permissions` junction table created
  - [ ] `id` (UUID, primary key)
  - [ ] `roleId` (UUID, foreign key)
  - [ ] `permissionId` (UUID, foreign key)
  - [ ] `granted` (boolean, default true)
  - [ ] Unique constraint on (roleId, permissionId)

- [ ] `audit_logs` table created
  - [ ] `id` (UUID, primary key)
  - [ ] `tenantId` (UUID, indexed)
  - [ ] `userId` (UUID, indexed)
  - [ ] `roleId` (UUID)
  - [ ] `action` (string)
  - [ ] `entity` (string, indexed)
  - [ ] `entityId` (UUID)
  - [ ] `changes` (JSONB)
  - [ ] `ipAddress` (string)
  - [ ] `userAgent` (text)
  - [ ] `success` (boolean)
  - [ ] `errorMessage` (text, nullable)
  - [ ] `createdAt` (timestamp, indexed)

- [ ] `users` table updated
  - [ ] `roleId` (UUID, foreign key to roles table)
  - [ ] Legacy `role` field (string, kept for migration)

### Indexes
- [ ] Index on `users.roleId`
- [ ] Index on `role_permissions.roleId`
- [ ] Index on `role_permissions.permissionId`
- [ ] Index on `audit_logs.tenantId`
- [ ] Index on `audit_logs.userId`
- [ ] Index on `audit_logs.createdAt`
- [ ] Index on `audit_logs.entity`
- [ ] Composite index on `audit_logs(tenantId, createdAt)`

### Migrations
- [ ] Prisma migrations created and tested
- [ ] Migration script runs without errors
- [ ] Migration is reversible (down migration exists)
- [ ] All foreign key constraints are properly set
- [ ] Cascading deletes are configured appropriately

### Seed Data
- [ ] System roles seeded (Owner, Admin, Manager, Cashier, etc.)
- [ ] All permissions seeded (all resource-action combinations)
- [ ] Role-permission relationships seeded
- [ ] Test data created for development environment
- [ ] Seed script is idempotent (can run multiple times safely)

## Backend Core

### RBAC Service
- [ ] `RBACService` created (`apps/api/src/rbac/rbac.service.ts`)
- [ ] `hasPermission()` method implemented
  - [ ] Checks exact permission match
  - [ ] Checks RESOURCE:MANAGE permission
  - [ ] Checks ALL:MANAGE permission (superadmin)
  - [ ] Returns false for inactive users
  - [ ] Returns false for users without roles
- [ ] `requirePermission()` method implemented
  - [ ] Throws ForbiddenException when permission denied
  - [ ] Includes helpful error message
- [ ] `getUserPermissions()` method implemented
- [ ] `getUserRole()` method implemented
- [ ] `createRole()` method implemented
  - [ ] Validates role name uniqueness
  - [ ] Prevents creation of roles with reserved names
  - [ ] Creates audit log entry
- [ ] `updateRolePermissions()` method implemented
  - [ ] Validates role exists
  - [ ] Prevents modification of system roles
  - [ ] Creates audit log entry
- [ ] `deleteRole()` method implemented
  - [ ] Prevents deletion of system roles
  - [ ] Prevents deletion of roles with assigned users
  - [ ] Creates audit log entry
- [ ] `assignRole()` method implemented
- [ ] Service has comprehensive unit tests

### Audit Logs Service
- [ ] `AuditLogsService` created (`apps/api/src/rbac/audit-logs.service.ts`)
- [ ] `createAuditLog()` method implemented
  - [ ] Sanitizes sensitive data (passwords, tokens)
  - [ ] Stores user context
  - [ ] Stores request metadata
- [ ] `getAuditLogs()` method implemented
  - [ ] Supports pagination
  - [ ] Supports filtering by user
  - [ ] Supports filtering by resource
  - [ ] Supports filtering by action
  - [ ] Supports date range filtering
  - [ ] Returns properly formatted response
- [ ] `getAuditStatistics()` method implemented
  - [ ] Calculates total logs
  - [ ] Groups by action
  - [ ] Groups by resource
  - [ ] Identifies top users
  - [ ] Supports date range filtering

### Guards
- [ ] `PermissionGuard` created (`apps/api/src/rbac/guards/permission.guard.ts`)
- [ ] Guard is registered globally via `APP_GUARD`
- [ ] Guard extracts user from request context
- [ ] Guard reads required permission from route metadata
- [ ] Guard calls `RBACService.hasPermission()`
- [ ] Guard allows public routes (without `@RequirePermission`)
- [ ] Guard returns 403 Forbidden for denied permissions

### Decorators
- [ ] `@RequirePermission()` decorator created
  - [ ] Accepts resource and action parameters
  - [ ] Sets metadata for PermissionGuard
- [ ] `@CurrentUser()` decorator created (if not exists)
  - [ ] Extracts user from request

### Interceptors
- [ ] `AuditLogInterceptor` created
- [ ] Interceptor is registered globally via `APP_INTERCEPTOR`
- [ ] Interceptor runs only on routes with `@RequirePermission`
- [ ] Interceptor captures request details
- [ ] Interceptor captures response/error
- [ ] Interceptor creates audit log asynchronously
- [ ] Interceptor doesn't block request flow

### Module
- [ ] `RBACModule` created (`apps/api/src/rbac/rbac.module.ts`)
- [ ] Module is marked as `@Global()`
- [ ] Exports `RBACService`, `AuditLogsService`, `PermissionGuard`
- [ ] Module is imported in `AppModule`

## Backend Controllers

### Roles Controller
- [ ] `RolesController` created (`apps/api/src/rbac/roles.controller.ts`)
- [ ] `GET /api/roles` - List all roles
  - [ ] Requires ROLES:READ permission
  - [ ] Returns system roles + tenant's custom roles
  - [ ] Includes permissions for each role
- [ ] `GET /api/roles/permissions` - List all available permissions
  - [ ] Requires ROLES:READ permission
  - [ ] Groups permissions by resource
- [ ] `POST /api/roles` - Create custom role
  - [ ] Requires ROLES:CREATE permission
  - [ ] Validates input
  - [ ] Creates role with selected permissions
  - [ ] Returns created role
- [ ] `PUT /api/roles/:id/permissions` - Update role permissions
  - [ ] Requires ROLES:UPDATE permission
  - [ ] Prevents modification of system roles
  - [ ] Updates permissions
  - [ ] Returns updated role
- [ ] `DELETE /api/roles/:id` - Delete custom role
  - [ ] Requires ROLES:DELETE permission
  - [ ] Prevents deletion of system roles
  - [ ] Prevents deletion of roles with users
  - [ ] Returns success message
- [ ] `GET /api/roles/my-permissions` - Get current user's permissions
  - [ ] Returns user's role and permissions
  - [ ] Available to all authenticated users

### Audit Logs Controller
- [ ] `AuditLogsController` created (`apps/api/src/rbac/audit-logs.controller.ts`)
- [ ] `GET /api/audit-logs` - List audit logs
  - [ ] Requires AUDIT_LOGS:READ permission
  - [ ] Supports pagination (page, limit)
  - [ ] Supports filtering (userId, resource, action, dates)
  - [ ] Returns logs + pagination metadata
- [ ] `GET /api/audit-logs/statistics` - Get audit statistics
  - [ ] Requires AUDIT_LOGS:READ permission
  - [ ] Supports date range filtering
  - [ ] Returns statistics (total, by action, by resource, top users)

### Users Controller Updates
- [ ] Existing `UsersController` updated
- [ ] `POST /api/users/:id/role` - Assign role to user
  - [ ] Requires USERS:UPDATE permission
  - [ ] Validates role exists
  - [ ] Updates user's roleId
  - [ ] Returns updated user

## Frontend Core

### Permissions Context
- [ ] `PermissionsContext` created (`apps/web/src/contexts/PermissionsContext.tsx`)
- [ ] Context fetches user's permissions on mount
- [ ] Context provides:
  - [ ] `permissions` array
  - [ ] `isLoading` boolean
  - [ ] `hasPermission(resource, action)` function
  - [ ] `canCreate(resource)` function
  - [ ] `canRead(resource)` function
  - [ ] `canUpdate(resource)` function
  - [ ] `canDelete(resource)` function
  - [ ] `canManage(resource)` function
- [ ] Context respects permission hierarchy
  - [ ] Checks exact match first
  - [ ] Checks RESOURCE:MANAGE
  - [ ] Checks ALL:MANAGE
- [ ] Context is wrapped in root layout

### Permission Guard Components
- [ ] `PermissionGuard` component created
  - [ ] Accepts `resource` and `action` props
  - [ ] Accepts optional `fallback` prop
  - [ ] Renders children if permission granted
  - [ ] Renders fallback (or nothing) if permission denied
- [ ] Convenience components created:
  - [ ] `CanCreate` component
  - [ ] `CanRead` component
  - [ ] `CanUpdate` component
  - [ ] `CanDelete` component
  - [ ] `CanManage` component

### API Client
- [ ] RBAC API functions created (`apps/web/src/lib/api/rbac.ts` or similar)
  - [ ] `getRoles()` - Fetch all roles
  - [ ] `getPermissions()` - Fetch all permissions
  - [ ] `createRole(data)` - Create custom role
  - [ ] `updateRolePermissions(roleId, permissionIds)` - Update role
  - [ ] `deleteRole(roleId)` - Delete role
  - [ ] `getAuditLogs(filters)` - Fetch audit logs
  - [ ] `getAuditStatistics(filters)` - Fetch statistics
- [ ] API functions handle errors gracefully
- [ ] API functions include proper TypeScript types

## Frontend Pages

### Roles Management Page
- [ ] Page created at `/settings/roles` or similar
- [ ] Protected with `PermissionGuard` (requires ROLES:READ)
- [ ] Displays list of all roles (system + custom)
  - [ ] Shows role name
  - [ ] Shows role description
  - [ ] Shows "System" badge for system roles
  - [ ] Shows permission count
- [ ] "Create Role" button visible only with ROLES:CREATE permission
- [ ] Each role card shows:
  - [ ] "Edit" button (only for custom roles, requires ROLES:UPDATE)
  - [ ] "Delete" button (only for custom roles, requires ROLES:DELETE)
  - [ ] List of permissions
- [ ] Roles are filterable/searchable
- [ ] Loading states implemented
- [ ] Error states implemented

### Create Role Dialog
- [ ] Dialog/modal component created
- [ ] Form includes:
  - [ ] Name input (required)
  - [ ] Description textarea (optional)
  - [ ] Permissions selection (grouped by resource)
- [ ] Permissions can be selected/deselected
- [ ] "Select All" / "Deselect All" per resource group
- [ ] Form validation implemented
- [ ] Success toast/notification on creation
- [ ] Error handling and display
- [ ] Closes on successful creation
- [ ] Invalidates roles query on success

### Edit Role Dialog
- [ ] Dialog/modal component created
- [ ] Pre-populates with current role permissions
- [ ] Shows role name (read-only)
- [ ] Allows changing permissions
- [ ] "Select All" / "Deselect All" per resource group
- [ ] Success toast/notification on update
- [ ] Error handling and display
- [ ] Closes on successful update
- [ ] Invalidates roles query on success

### Audit Logs Page
- [ ] Page created at `/settings/audit-logs` or similar
- [ ] Protected with `PermissionGuard` (requires AUDIT_LOGS:READ)
- [ ] Statistics dashboard at top:
  - [ ] Total records count
  - [ ] Most active users
  - [ ] Actions breakdown (pie/bar chart)
  - [ ] Resource breakdown
- [ ] Filters section:
  - [ ] Action filter (dropdown: All, CREATE, UPDATE, DELETE, READ)
  - [ ] Resource filter (dropdown or search)
  - [ ] User filter (search/autocomplete)
  - [ ] Date range picker (start date, end date)
  - [ ] "Clear Filters" button
- [ ] Audit logs table:
  - [ ] Columns: User, Action, Resource, Details, Timestamp
  - [ ] Action badges with color coding (green=CREATE, blue=UPDATE, red=DELETE)
  - [ ] Expandable rows for detailed information
  - [ ] Pagination controls
  - [ ] Items per page selector
- [ ] Loading states implemented
- [ ] Empty state when no logs match filters
- [ ] Export functionality (optional but recommended)

### User Management Page Updates
- [ ] Existing user management page updated
- [ ] User creation form includes:
  - [ ] Role selector (dropdown)
- [ ] User edit form includes:
  - [ ] Role selector (dropdown)
  - [ ] Shows current role
- [ ] User list shows role name for each user
- [ ] Role changes require USERS:UPDATE permission

## Testing

### Backend Unit Tests
- [ ] `RBACService` tests (`rbac.service.spec.ts`)
  - [ ] Tests `hasPermission()` with exact match
  - [ ] Tests `hasPermission()` with MANAGE permission
  - [ ] Tests `hasPermission()` with ALL:MANAGE permission
  - [ ] Tests `hasPermission()` returns false without permission
  - [ ] Tests `hasPermission()` returns false for inactive users
  - [ ] Tests `hasPermission()` returns false for users without roles
  - [ ] Tests `requirePermission()` throws on denial
  - [ ] Tests `createRole()` success
  - [ ] Tests `createRole()` with duplicate name
  - [ ] Tests `updateRolePermissions()` success
  - [ ] Tests `updateRolePermissions()` prevents system role modification
  - [ ] Tests `deleteRole()` success
  - [ ] Tests `deleteRole()` prevents system role deletion
  - [ ] Tests `deleteRole()` prevents deletion with assigned users
- [ ] `AuditLogsService` tests
  - [ ] Tests `createAuditLog()` sanitizes sensitive data
  - [ ] Tests `getAuditLogs()` pagination
  - [ ] Tests `getAuditLogs()` filtering
  - [ ] Tests `getAuditStatistics()` calculations
- [ ] `PermissionGuard` tests
  - [ ] Tests guard allows access with permission
  - [ ] Tests guard denies access without permission
  - [ ] Tests guard allows public routes
- [ ] Controller tests for all endpoints
- [ ] All tests pass with good coverage (>80%)

### Frontend Component Tests
- [ ] `PermissionGuard` component tests
  - [ ] Tests renders children with permission
  - [ ] Tests doesn't render children without permission
  - [ ] Tests renders fallback without permission
  - [ ] Tests respects MANAGE permission hierarchy
  - [ ] Tests respects ALL:MANAGE permission
- [ ] `CanCreate`, `CanUpdate`, `CanDelete`, `CanRead`, `CanManage` tests
- [ ] Roles page component tests
- [ ] Audit logs page component tests
- [ ] All tests pass

### E2E Tests
- [ ] Test helper created (`tests/e2e/helpers/test-data.helper.ts`)
  - [ ] `assignRoleWithPermission()` method
  - [ ] `assignRoleWithPermissions()` method
  - [ ] `createCustomRole()` method
  - [ ] `cleanupTestRoles()` method
- [ ] Auth fixture created (`tests/e2e/fixtures/auth.fixture.ts`)
  - [ ] Creates test user
  - [ ] Logs in and gets token
  - [ ] Sets auth cookie
- [ ] Roles management tests (`tests/e2e/specs/rbac/roles-management.spec.ts`)
  - [ ] Tests display roles list
  - [ ] Tests create custom role
  - [ ] Tests create button hidden without permission
  - [ ] Tests edit role permissions
  - [ ] Tests delete custom role
  - [ ] Tests cannot delete system role
  - [ ] Tests permission hierarchy (MANAGE grants all)
  - [ ] Tests granular permissions (READ only)
- [ ] Audit logs tests
  - [ ] Tests display audit logs page
  - [ ] Tests filter audit logs by action
  - [ ] Tests filter audit logs by user
  - [ ] Tests filter audit logs by date
  - [ ] Tests access denied without permission
- [ ] All E2E tests pass

## Documentation

### Technical Documentation
- [ ] RBAC module README created (`apps/api/src/rbac/README.md`)
  - [ ] Features overview
  - [ ] System roles documented
  - [ ] Resources and permissions listed
  - [ ] Backend usage examples
  - [ ] Frontend usage examples
  - [ ] Testing instructions
  - [ ] Best practices
  - [ ] Troubleshooting guide
  - [ ] Performance considerations
  - [ ] Migration guide
  - [ ] API reference

### User Documentation
- [ ] User guide created (`docs/user-guides/RBAC_USER_GUIDE.md`)
  - [ ] Explains roles and permissions in simple terms
  - [ ] Documents each system role
  - [ ] Explains how to create custom roles
  - [ ] Explains how to assign roles to users
  - [ ] Explains how to view audit logs
  - [ ] Best practices for non-technical users
  - [ ] Common mistakes and how to avoid them
  - [ ] FAQ section

### API Documentation
- [ ] API endpoints documented (Swagger/OpenAPI)
- [ ] Request/response examples provided
- [ ] Error responses documented

### Code Comments
- [ ] Complex logic has explanatory comments
- [ ] JSDoc comments for public methods
- [ ] Type definitions are clear and documented

## Security

### Authentication
- [ ] All RBAC endpoints require authentication
- [ ] JWT tokens include user's role information
- [ ] Tokens are validated on every request

### Authorization
- [ ] Every sensitive endpoint has `@RequirePermission` decorator
- [ ] Permission checks happen on the backend (never trust frontend)
- [ ] Tenant isolation is enforced (users can only access their tenant's data)
- [ ] System roles cannot be modified
- [ ] System roles cannot be deleted
- [ ] Role changes are audited

### Data Protection
- [ ] Passwords are never logged in audit logs
- [ ] API tokens are sanitized from audit logs
- [ ] Sensitive fields (SSN, credit card) are not logged
- [ ] Audit logs are scoped to tenant (can't see other tenants' logs)
- [ ] SQL injection prevention (using Prisma ORM)

### Rate Limiting
- [ ] Rate limiting configured for RBAC endpoints (optional but recommended)
- [ ] Prevents brute force attacks on permission checks

## Performance

### Database Optimization
- [ ] All necessary indexes created
- [ ] Queries use indexes effectively
- [ ] N+1 query problems resolved (use `include` in Prisma)
- [ ] Audit logs table partitioned by date (if expecting high volume)

### Caching
- [ ] User permissions cached in JWT token (optional)
- [ ] Permissions context caches permissions client-side
- [ ] Role list cached on frontend (with React Query)
- [ ] Stale-while-revalidate strategy for non-critical data

### API Performance
- [ ] Pagination implemented for large lists
- [ ] Audit logs endpoint has sensible defaults (e.g., 50 items per page)
- [ ] Statistics queries are optimized
- [ ] Audit log writes are asynchronous (don't block main request)

## UX/UI

### Visual Feedback
- [ ] Loading spinners during data fetches
- [ ] Success toasts on successful actions
- [ ] Error messages on failures
- [ ] Confirmation dialogs for destructive actions
- [ ] Disabled states for buttons without permission

### Accessibility
- [ ] Forms have proper labels
- [ ] Error messages are associated with form fields
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG standards
- [ ] Screen reader friendly

### Responsive Design
- [ ] Roles page works on mobile devices
- [ ] Audit logs page works on tablets
- [ ] Tables have horizontal scroll on small screens
- [ ] Dialogs are centered and properly sized

### User Experience
- [ ] Permission-denied screens have helpful messages
- [ ] Users know why they can't access something
- [ ] Roles are displayed with human-readable descriptions
- [ ] Action badges use intuitive colors (green=create, red=delete, etc.)
- [ ] Forms have validation messages

## Deployment

### Pre-Deployment
- [ ] All tests passing (unit, integration, E2E)
- [ ] Code reviewed and approved
- [ ] Database backup created
- [ ] Rollback plan prepared
- [ ] Migration tested on staging environment

### Migration
- [ ] Run migration script (`scripts/migrate-to-rbac.ts`)
- [ ] Verify all users have roles assigned
- [ ] Verify system roles exist
- [ ] Verify permissions are correctly assigned
- [ ] Test sample user access after migration

### Deployment Steps
- [ ] Deploy database migrations
- [ ] Deploy backend code
- [ ] Deploy frontend code
- [ ] Clear application caches
- [ ] Restart services if necessary

### Post-Deployment
- [ ] Smoke test: Owner can log in
- [ ] Smoke test: Admin can create custom role
- [ ] Smoke test: Cashier has limited access
- [ ] Smoke test: Audit logs are being created
- [ ] Monitor error logs for permission-related issues
- [ ] Monitor audit logs for unusual activity

## Post-Launch

### Monitoring
- [ ] Set up alerts for permission-denied errors
- [ ] Monitor audit log volume
- [ ] Track which permissions are most used
- [ ] Monitor database performance (query times)
- [ ] Check for slow queries related to permissions

### User Training
- [ ] Train admins on role management
- [ ] Train admins on reading audit logs
- [ ] Share user guide with all users
- [ ] Provide support channel for permission issues

### Maintenance
- [ ] Schedule regular review of custom roles (quarterly)
- [ ] Schedule regular review of user role assignments
- [ ] Archive old audit logs (if not auto-purged)
- [ ] Review and update documentation as needed

### Future Enhancements (Optional)
- [ ] Role templates for common job functions
- [ ] Bulk role assignment
- [ ] Permission conflicts detection
- [ ] Advanced audit log search (full-text search)
- [ ] Audit log analytics dashboard
- [ ] Export audit logs to external system (SIEM)
- [ ] Scheduled reports on permission usage
- [ ] Conditional permissions (e.g., only own data)

## Sign-Off

Before marking the RBAC implementation as complete, ensure all critical items are checked:

- [ ] All database migrations completed successfully
- [ ] All backend services implemented and tested
- [ ] All frontend pages implemented and tested
- [ ] All tests passing (unit, component, E2E)
- [ ] Documentation complete (technical and user guides)
- [ ] Security audit passed
- [ ] Performance benchmarks met
- [ ] Deployed to production successfully
- [ ] Post-deployment smoke tests passed
- [ ] Monitoring and alerts configured

**Signed off by:**
- Backend Lead: _________________ Date: _________
- Frontend Lead: _________________ Date: _________
- QA Lead: _________________ Date: _________
- Project Manager: _________________ Date: _________

---

**Congratulations!** If all items are checked, your RBAC implementation is complete and production-ready!
