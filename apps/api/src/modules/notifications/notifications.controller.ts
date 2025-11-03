import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@Controller('notifications')
@UseGuards(AuthGuard, TenantGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Envía una notificación manual
   * POST /notifications/send
   */
  @Post('send')
  async send(@Body() dto: SendNotificationDto) {
    await this.notificationsService.send(dto.type, {
      to: dto.to,
      template: dto.template,
      data: dto.data,
      priority: dto.priority,
      scheduleAt: dto.scheduleAt ? new Date(dto.scheduleAt) : undefined,
    });

    return {
      success: true,
      message: 'Notification sent successfully',
    };
  }

  /**
   * Verifica la configuración del email provider
   * GET /notifications/verify-email
   */
  @Get('verify-email')
  async verifyEmailProvider() {
    const isVerified = await this.notificationsService.verifyEmailProvider();

    return {
      success: isVerified,
      message: isVerified
        ? 'Email provider is configured correctly'
        : 'Email provider verification failed',
    };
  }

  /**
   * Envía un email de prueba
   * POST /notifications/test-email
   */
  @Post('test-email')
  async sendTestEmail(
    @Headers('x-user-id') userId: string,
    @Body('email') email?: string
  ) {
    await this.notificationsService.sendWelcomeEmail(userId);

    return {
      success: true,
      message: 'Test email sent successfully',
    };
  }
}
