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
  Req,
} from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppConfigService } from './whatsapp-config.service';
import { WhatsAppNotificationsService } from './whatsapp-notifications.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { AuditLog } from '../rbac/interceptors/audit-log.interceptor';
import { PermissionResource, PermissionAction, MessageDirection, MessageStatus } from '@retail/database';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('whatsapp')
@UseGuards(AuthGuard)
export class WhatsAppController {
  constructor(
    private readonly whatsappService: WhatsAppService,
    private readonly configService: WhatsAppConfigService,
    private readonly notificationsService: WhatsAppNotificationsService,
  ) {}

  // ==================== Configuration ====================

  @Get('config')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  async getConfig(@CurrentUser() user: any) {
    const config = await this.configService.getConfig(user.tenantId);

    return {
      success: true,
      data: config,
    };
  }

  @Put('config')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'WHATSAPP_CONFIG', description: 'Updated WhatsApp configuration' })
  async updateConfig(@CurrentUser() user: any, @Body() data: any) {
    const config = await this.configService.upsertConfig(user.tenantId, data);

    return {
      success: true,
      data: config,
      message: 'Configuration updated successfully',
    };
  }

  @Post('connect')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'WHATSAPP_CONFIG', description: 'Connected WhatsApp' })
  async connect(@CurrentUser() user: any) {
    await this.whatsappService.initializeClient(user.tenantId);

    return {
      success: true,
      message: 'WhatsApp connection initialized. Scan QR code to authenticate.',
    };
  }

  @Post('disconnect')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'WHATSAPP_CONFIG', description: 'Disconnected WhatsApp' })
  async disconnect(@CurrentUser() user: any) {
    await this.whatsappService.disconnect(user.tenantId);

    return {
      success: true,
      message: 'WhatsApp disconnected successfully',
    };
  }

  @Get('status')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  async getStatus(@CurrentUser() user: any) {
    const isConnected = await this.whatsappService.isConnected(user.tenantId);

    return {
      success: true,
      data: { isConnected },
    };
  }

  // ==================== Templates ====================

  @Get('templates')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  async getTemplates(@CurrentUser() user: any) {
    const templates = await this.configService.getTemplates(user.tenantId);

    return {
      success: true,
      data: templates,
    };
  }

  @Post('templates')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'WHATSAPP_TEMPLATE', description: 'Created WhatsApp template' })
  async createTemplate(@CurrentUser() user: any, @Body() data: any) {
    const template = await this.configService.createTemplate(user.tenantId, data);

    return {
      success: true,
      data: template,
      message: 'Template created successfully',
    };
  }

  @Put('templates/:id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'WHATSAPP_TEMPLATE', description: 'Updated WhatsApp template' })
  async updateTemplate(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    const template = await this.configService.updateTemplate(id, user.tenantId, data);

    return {
      success: true,
      data: template,
      message: 'Template updated successfully',
    };
  }

  @Delete('templates/:id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.DELETE)
  @AuditLog({ action: 'DELETE', entity: 'WHATSAPP_TEMPLATE', description: 'Deleted WhatsApp template' })
  async deleteTemplate(@CurrentUser() user: any, @Param('id') id: string) {
    await this.configService.deleteTemplate(id, user.tenantId);

    return {
      success: true,
      message: 'Template deleted successfully',
    };
  }

  @Post('templates/defaults')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'WHATSAPP_TEMPLATE', description: 'Created default templates' })
  async createDefaultTemplates(@CurrentUser() user: any) {
    const templates = await this.configService.createDefaultTemplates(user.tenantId);

    return {
      success: true,
      data: templates,
      message: 'Default templates created successfully',
    };
  }

  // ==================== Messages ====================

  @Get('messages')
  @RequirePermission(PermissionResource.CUSTOMERS, PermissionAction.READ)
  async getMessages(
    @CurrentUser() user: any,
    @Query('phoneNumber') phoneNumber?: string,
    @Query('direction') direction?: MessageDirection,
    @Query('status') status?: MessageStatus,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.whatsappService.getMessages(user.tenantId, {
      phoneNumber,
      direction,
      status,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Post('messages/send')
  @RequirePermission(PermissionResource.CUSTOMERS, PermissionAction.UPDATE)
  @AuditLog({ action: 'CREATE', entity: 'WHATSAPP_MESSAGE', description: 'Sent WhatsApp message' })
  async sendMessage(
    @CurrentUser() user: any,
    @Body() data: { phoneNumber: string; message: string; mediaUrl?: string },
  ) {
    const messageId = await this.notificationsService.sendCustomMessage(
      user.tenantId,
      data.phoneNumber,
      data.message,
      data.mediaUrl,
    );

    return {
      success: true,
      data: { messageId },
      message: 'Message sent successfully',
    };
  }

  @Post('messages/bulk')
  @RequirePermission(PermissionResource.CUSTOMERS, PermissionAction.UPDATE)
  @AuditLog({ action: 'CREATE', entity: 'WHATSAPP_MESSAGE', description: 'Sent bulk WhatsApp messages' })
  async sendBulkMessages(
    @CurrentUser() user: any,
    @Body() data: { phoneNumbers: string[]; message: string },
  ) {
    const result = await this.notificationsService.sendBulkMessages(
      user.tenantId,
      data.phoneNumbers,
      data.message,
    );

    return {
      success: true,
      data: result,
      message: 'Bulk messages sent',
    };
  }

  @Get('messages/stats')
  @RequirePermission(PermissionResource.CUSTOMERS, PermissionAction.READ)
  async getMessageStats(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    const stats = await this.whatsappService.getMessageStats(
      user.tenantId,
      days ? parseInt(days) : 30,
    );

    return {
      success: true,
      data: stats,
    };
  }

  // ==================== Manual Notifications ====================

  @Post('notifications/order-confirmation/:saleId')
  @RequirePermission(PermissionResource.SALES, PermissionAction.UPDATE)
  async sendOrderConfirmation(@CurrentUser() user: any, @Param('saleId') saleId: string) {
    await this.notificationsService.sendOrderConfirmation(saleId);

    return {
      success: true,
      message: 'Order confirmation sent',
    };
  }

  @Post('notifications/payment-reminder/:saleId')
  @RequirePermission(PermissionResource.SALES, PermissionAction.UPDATE)
  async sendPaymentReminder(@CurrentUser() user: any, @Param('saleId') saleId: string) {
    await this.notificationsService.sendPaymentReminder(saleId);

    return {
      success: true,
      message: 'Payment reminder sent',
    };
  }
}
