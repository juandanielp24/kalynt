import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { GetTenant } from '../common/decorators/get-tenant.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(AuthGuard, TenantGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getUserNotifications(
    @Headers('x-user-id') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const notifications = await this.notificationsService.getUserNotifications(
      userId,
      {
        unreadOnly: unreadOnly === 'true',
        limit: limit ? parseInt(limit) : undefined,
        offset: offset ? parseInt(offset) : undefined,
      },
    );

    return {
      success: true,
      data: notifications,
    };
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  async getUnreadCount(@Headers('x-user-id') userId: string) {
    const count = await this.notificationsService.getUnreadCount(userId);

    return {
      success: true,
      data: { count },
    };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(
    @Param('id') notificationId: string,
    @Headers('x-user-id') userId: string,
  ) {
    await this.notificationsService.markAsRead(notificationId, userId);

    return {
      success: true,
      message: 'Notification marked as read',
    };
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Headers('x-user-id') userId: string) {
    await this.notificationsService.markAllAsRead(userId);

    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  async deleteNotification(
    @Param('id') notificationId: string,
    @Headers('x-user-id') userId: string,
  ) {
    await this.notificationsService.deleteNotification(notificationId, userId);

    return {
      success: true,
      message: 'Notification deleted',
    };
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get notification preferences' })
  async getPreferences(@Headers('x-user-id') userId: string) {
    const preferences = await this.notificationsService.getPreferences(userId);

    return {
      success: true,
      data: preferences,
    };
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update notification preferences' })
  async updatePreferences(
    @Headers('x-user-id') userId: string,
    @GetTenant() tenantId: string,
    @Body()
    preferences: {
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      pushEnabled?: boolean;
      inAppEnabled?: boolean;
    },
  ) {
    const updated = await this.notificationsService.updatePreferences(
      userId,
      tenantId,
      preferences,
    );

    return {
      success: true,
      data: updated,
      message: 'Preferences updated successfully',
    };
  }

  @Post('device-token')
  @ApiOperation({ summary: 'Register device token for push notifications' })
  async registerDeviceToken(
    @Headers('x-user-id') userId: string,
    @Body() body: { token: string; platform: 'ios' | 'android' },
  ) {
    // This would be handled by PushService
    // For now, return success
    return {
      success: true,
      message: 'Device token registered',
    };
  }

  @Delete('device-token/:token')
  @ApiOperation({ summary: 'Unregister device token' })
  async unregisterDeviceToken(
    @Headers('x-user-id') userId: string,
    @Param('token') token: string,
  ) {
    // This would be handled by PushService
    return {
      success: true,
      message: 'Device token unregistered',
    };
  }
}
