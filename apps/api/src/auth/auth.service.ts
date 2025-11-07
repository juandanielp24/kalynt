import { Injectable, Inject, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaClient, LocationType, LocationStatus } from '@retail/database';
import * as bcrypt from 'bcryptjs';
import { auth } from './auth.config';
import { RegisterDto, LoginDto, ResetPasswordDto, ChangePasswordDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject('PRISMA') private prisma: PrismaClient
  ) {}

  /**
   * Registra un nuevo usuario y tenant
   */
  async register(dto: RegisterDto) {
    // 1. Verificar que el email no existe
    const existingUser = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // 2. Verificar que el slug del tenant no existe
    if (dto.tenantSlug) {
      const existingTenant = await this.prisma.tenant.findUnique({
        where: { slug: dto.tenantSlug },
      });

      if (existingTenant) {
        throw new ConflictException('Business name already taken');
      }
    }

    // 3. Hash de contrase�a
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 4. Crear tenant y usuario en transacci�n
    const result = await this.prisma.$transaction(async (tx) => {
      // Crear tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.tenantName,
          slug: dto.tenantSlug || this.generateSlug(dto.tenantName),
          country: dto.country || 'AR',
          currency: dto.currency || 'ARS',
          fiscalCondition: dto.fiscalCondition,
          cuit: dto.cuit,
          plan: 'free', // Plan inicial gratuito
          status: 'active',
        },
      });

      // Crear ubicaci�n por defecto
      const location = await tx.location.create({
        data: {
          tenantId: tenant.id,
          name: 'Sucursal Principal',
          code: 'MAIN001',
          type: LocationType.STORE,
          status: LocationStatus.ACTIVE,
        },
      });

      // Crear usuario
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.email,
          name: dto.name,
          role: 'owner', // Primer usuario es owner
          emailVerified: false, // Requiere verificaci�n
        },
      });

      // Crear account con better-auth structure
      await tx.account.create({
        data: {
          userId: user.id,
          providerId: 'credential',
          providerAccountId: user.id, // Use user.id as the account identifier
          password: hashedPassword,
        },
      });

      return { user, tenant, location };
    });

    // 5. Enviar email de verificaci�n
    // TODO: Integrar con NotificationsService
    // await this.sendVerificationEmail(result.user);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
    };
  }

  /**
   * Login de usuario
   */
  async login(dto: LoginDto) {
    // 1. Buscar usuario
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, deletedAt: null },
      include: {
        accounts: true,
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Verificar contrase�a
    const account = user.accounts.find(acc => acc.providerId === 'credential');

    if (!account || !account.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(dto.password, account.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 3. Verificar que el usuario est� activo
    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    // 4. Verificar que el tenant est� activo
    if (user.tenant.status !== 'active') {
      throw new UnauthorizedException('Account is suspended');
    }

    // 5. Crear sesi�n
    const session = await this.createSession(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
        tenantId: user.tenantId,
        tenant: {
          id: user.tenant.id,
          name: user.tenant.name,
          slug: user.tenant.slug,
          plan: user.tenant.plan,
        },
      },
      session,
    };
  }

  /**
   * Crea una sesi�n para el usuario
   */
  private async createSession(userId: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 d�as

    const session = await this.prisma.session.create({
      data: {
        userId,
        expiresAt,
        token: this.generateToken(),
      },
    });

    return {
      sessionToken: session.token,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Verifica una sesi�n
   */
  async verifySession(token: string) {
    const session = await this.prisma.session.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Session expired');
    }

    return session;
  }

  /**
   * Cierra sesi�n
   */
  async logout(token: string) {
    await this.prisma.session.delete({
      where: { token },
    });

    return { success: true };
  }

  /**
   * Solicita recuperaci�n de contrase�a
   */
  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      // No revelar si el email existe
      return { success: true, message: 'If the email exists, a reset link has been sent' };
    }

    // Generar token de reset
    const resetToken = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hora

    await this.prisma.verification.create({
      data: {
        identifier: email,
        token: resetToken,
        expiresAt,
      },
    });

    // TODO: Enviar email con link de reset
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    console.log(`Password reset URL: ${resetUrl}`);

    return { success: true, message: 'Password reset email sent' };
  }

  /**
   * Resetea la contrase�a usando el token
   */
  async resetPassword(dto: ResetPasswordDto) {
    // 1. Verificar token
    const verification = await this.prisma.verification.findUnique({
      where: { token: dto.token },
    });

    if (!verification || verification.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired token');
    }

    // 2. Buscar usuario
    const user = await this.prisma.user.findFirst({
      where: { email: verification.identifier },
      include: { accounts: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // 3. Actualizar contrase�a
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    const account = user.accounts.find(acc => acc.providerId === 'credential');

    if (account) {
      await this.prisma.account.update({
        where: { id: account.id },
        data: { password: hashedPassword },
      });
    }

    // 4. Eliminar token usado
    await this.prisma.verification.delete({
      where: { id: verification.id },
    });

    // 5. Invalidar todas las sesiones
    await this.prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return { success: true, message: 'Password reset successfully' };
  }

  /**
   * Cambia la contrase�a del usuario autenticado
   */
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const account = user.accounts.find(acc => acc.providerId === 'credential');

    if (!account || !account.password) {
      throw new BadRequestException('No password account found');
    }

    // Verificar contrase�a actual
    const isValidPassword = await bcrypt.compare(dto.currentPassword, account.password);

    if (!isValidPassword) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Actualizar contrase�a
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.account.update({
      where: { id: account.id },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Password changed successfully' };
  }

  /**
   * Verifica email del usuario
   */
  async verifyEmail(token: string) {
    const verification = await this.prisma.verification.findUnique({
      where: { token },
    });

    if (!verification || verification.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.updateMany({
      where: { email: verification.identifier },
      data: { emailVerified: true },
    });

    await this.prisma.verification.delete({
      where: { id: verification.id },
    });

    return { success: true, message: 'Email verified successfully' };
  }

  /**
   * Genera un slug �nico a partir del nombre del tenant
   */
  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${baseSlug}-${randomSuffix}`;
  }

  /**
   * Genera un token aleatorio seguro
   */
  private generateToken(): string {
    return crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '');
  }
}
