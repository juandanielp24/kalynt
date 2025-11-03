import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { PrismaClient } from '@retail/database';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionToken =
      request.cookies?.session ||
      request.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      throw new UnauthorizedException('No session token provided');
    }

    try {
      // Decodificar el token simple
      const decoded = JSON.parse(
        Buffer.from(sessionToken, 'base64').toString('utf-8')
      );

      // Verificar que el token no sea muy antiguo (7 días)
      const tokenAge = Date.now() - decoded.timestamp;
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 días
      if (tokenAge > maxAge) {
        throw new UnauthorizedException('Session expired');
      }

      // Buscar usuario
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { tenant: true },
      });

      if (!user || user.deletedAt) {
        throw new UnauthorizedException('Invalid session');
      }

      // Agregar usuario al request
      request.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        tenantSlug: user.tenant.slug,
        emailVerified: false,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
