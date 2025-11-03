import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Obtener token de cookie o header
      const token =
        req.cookies?.auth_token ||
        req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next();
      }

      // Verificar sesión
      const session = await this.authService.verifySession(token);

      // Agregar usuario y tenant al request
      req['user'] = session.user;
      req['tenant'] = session.user.tenant;

      next();
    } catch (error) {
      // No bloquear, solo no agregar usuario
      next();
    }
  }
}

// Extender tipos de Express
declare global {
  namespace Express {
    interface Request {
      user?: any;
      tenant?: any;
    }
  }
}
