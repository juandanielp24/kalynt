import { SetMetadata } from '@nestjs/common';
import { PermissionResource, PermissionAction } from '@prisma/client';

export interface RequirePermissionMetadata {
  resource: PermissionResource;
  action: PermissionAction;
}

export const PERMISSION_KEY = 'required_permission';

export const RequirePermission = (resource: PermissionResource, action: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, { resource, action } as RequirePermissionMetadata);
