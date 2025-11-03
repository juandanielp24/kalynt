import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import { hash } from 'bcryptjs';
import { auth } from './better-auth.config';
import { LoginDto, RegisterDto } from './dto';
import { UserRole } from '@retail/shared';

@Injectable()
export class AuthService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async register(dto: RegisterDto) {
    // Verificar que el email no esté registrado
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Verificar que el slug del tenant esté disponible
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug },
    });

    if (existingTenant) {
      throw new BadRequestException('Tenant slug already taken');
    }

    // Hash password
    const hashedPassword = await hash(dto.password, 10);

    // Crear tenant y usuario owner en transacción
    const result = await this.prisma.$transaction(async (tx) => {
      // Crear tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName,
          slug: dto.tenantSlug,
          settings: {},
        },
      });

      // Crear usuario owner
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email,
          name: dto.name,
          password: hashedPassword,
          role: UserRole.OWNER,
        },
      });

      // Crear ubicación por defecto
      await tx.location.create({
        data: {
          tenantId: tenant.id,
          name: 'Sucursal Principal',
          address: '',
        },
      });

      // Crear categoría por defecto
      await tx.category.create({
        data: {
          tenantId: tenant.id,
          name: 'General',
        },
      });

      return { tenant, user };
    });

    return {
      success: true,
      message: 'User and tenant created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        tenantId: result.user.tenantId,
        tenantSlug: result.tenant.slug,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
    };
  }

  async login(dto: LoginDto) {
    // Buscar usuario por email
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        deletedAt: null,
      },
      include: {
        tenant: true,
      },
    });

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Si se proporciona tenantSlug, verificar que coincida
    if (dto.tenantSlug && user.tenant.slug !== dto.tenantSlug) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verificar password con bcrypt
    const bcrypt = await import('bcryptjs');
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Crear sesión con better-auth
    // Nota: better-auth maneja las sesiones internamente
    // Por ahora retornamos un token simple que será reemplazado por JWT
    const sessionToken = Buffer.from(
      JSON.stringify({
        userId: user.id,
        tenantId: user.tenantId,
        timestamp: Date.now(),
      })
    ).toString('base64');

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        tenantId: user.tenantId,
        tenantSlug: user.tenant.slug,
        emailVerified: false, // TODO: Implementar verificación de email
      },
      sessionToken,
    };
  }

  async logout(sessionToken: string) {
    if (!sessionToken) {
      return { success: true };
    }

    // TODO: Invalidar sesión en better-auth
    return { success: true };
  }

  async getCurrentUser(sessionToken: string) {
    if (!sessionToken) {
      throw new UnauthorizedException('No session token provided');
    }

    try {
      // Decodificar el token simple
      const decoded = JSON.parse(
        Buffer.from(sessionToken, 'base64').toString('utf-8')
      );

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { tenant: true },
      });

      if (!user || user.deletedAt) {
        throw new UnauthorizedException('Invalid session');
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as UserRole,
        tenantId: user.tenantId,
        tenantSlug: user.tenant.slug,
        emailVerified: false,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid session');
    }
  }

  async verifyEmail(token: string) {
    // TODO: Implementar verificación de email con better-auth
    return { success: true, message: 'Email verification not yet implemented' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user) {
      // No revelar si el email existe
      return { success: true };
    }

    // TODO: Generar token y enviar email
    console.log(`Password reset email would be sent to ${email}`);

    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    // TODO: Verificar token y actualizar password
    return {
      success: true,
      message: 'Password reset not yet implemented',
    };
  }
}
