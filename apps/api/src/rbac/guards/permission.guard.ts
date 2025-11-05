import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBACService } from '../rbac.service';
import { PERMISSION_KEY, RequirePermissionMetadata } from '../decorators/require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RBACService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permission from decorator
    const requiredPermission = this.reflector.getAllAndOverride<RequirePermissionMetadata>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      // No permission required, allow access
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Check permission
    const hasPermission = await this.rbacService.hasPermission({
      userId: user.id,
      resource: requiredPermission.resource,
      action: requiredPermission.action,
      tenantId: user.tenantId,
    });

    return hasPermission;
  }
}
