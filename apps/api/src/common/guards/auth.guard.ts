import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * AuthGuard
 * Verifica que el usuario esté autenticado.
 * El middleware de autenticación ya debe haber adjuntado el usuario al request.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Verificar que el usuario está activo
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    return true;
  }
}
