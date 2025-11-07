import { SetMetadata } from '@nestjs/common';
import { PermissionResource, PermissionAction } from '@prisma/client';

export interface RequirePermissionMetadata {
  resource: PermissionResource;
  action: PermissionAction;
}

export const PERMISSION_KEY = 'required_permission';

export const RequirePermission = (resource: PermissionResource, action: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, { resource, action } as RequirePermissionMetadata);

// Alias for RequirePermission that accepts an object
export const Permissions = (metadata: RequirePermissionMetadata) =>
  SetMetadata(PERMISSION_KEY, metadata);

// String-based permission decorator for simplified usage
// Accepts permission strings like 'subscriptions.plans.read'
export const RequirePermissions = (permission: string) =>
  SetMetadata(PERMISSION_KEY, { permission });
