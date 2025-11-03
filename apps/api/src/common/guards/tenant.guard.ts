import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    // Si hay usuario autenticado, verificar que coincida con el tenant
    if (user && user.tenantId !== tenantId) {
      throw new ForbiddenException('Tenant mismatch');
    }

    request.tenantId = tenantId;
    return true;
  }
}
