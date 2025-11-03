import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import {
  RegisterDto,
  LoginDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Registro de nuevo usuario
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    const result = await this.authService.register(dto);

    return {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: result,
    };
  }

  /**
   * Login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.login(dto);

    // Establecer cookie con el token de sesión
    res.cookie('auth_token', result.session.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        session: result.session,
      },
    };
  }

  /**
   * Logout
   */
  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: any,
    @Res({ passthrough: true }) res: Response
  ) {
    const token = req.cookies?.auth_token || req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await this.authService.logout(token);
    }

    // Limpiar cookie
    res.clearCookie('auth_token');

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  /**
   * Obtener sesión actual
   */
  @Get('session')
  @UseGuards(AuthGuard)
  async getSession(@Req() req: any) {
    return {
      success: true,
      data: {
        user: req.user,
        tenant: req.tenant,
      },
    };
  }

  /**
   * Solicitar reset de contraseña
   */
  @Post('password/request-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    const result = await this.authService.requestPasswordReset(dto.email);
    return result;
  }

  /**
   * Resetear contraseña con token
   */
  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(dto);
    return result;
  }

  /**
   * Cambiar contraseña (usuario autenticado)
   */
  @Post('password/change')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: any,
    @Body() dto: ChangePasswordDto
  ) {
    const result = await this.authService.changePassword(req.user.id, dto);
    return result;
  }

  /**
   * Verificar email
   */
  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Query('token') token: string) {
    const result = await this.authService.verifyEmail(token);
    return result;
  }

  /**
   * Reenviar email de verificación
   */
  @Post('resend-verification')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Req() req: any) {
    // TODO: Implementar reenvío
    return {
      success: true,
      message: 'Verification email sent',
    };
  }
}
