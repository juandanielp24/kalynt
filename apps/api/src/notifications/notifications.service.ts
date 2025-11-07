import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaClient } from '@retail/database';
import { SmsService } from './services/sms.service';
import { PushService } from './services/push.service';
import { InAppService } from './services/in-app.service';

export interface EmailNotification {
  to: string | string[];
  subject: string;
  template: string;
  context: Record<string, any>;
  from?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
  }>;
}

export interface SmsNotification {
  to: string;
  message: string;
}

export interface PushNotification {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface InAppNotification {
  userId: string;
  tenantId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    @InjectQueue('sms') private smsQueue: Queue,
    @InjectQueue('push') private pushQueue: Queue,
    @Inject('PRISMA') private prisma: PrismaClient,
    private smsService: SmsService,
    private pushService: PushService,
    private inAppService: InAppService,
  ) {}

  /**
   * Send email notification (queued)
   */
  async sendEmail(notification: EmailNotification) {
    await this.emailQueue.add('send-email', notification, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  /**
   * Send SMS notification (queued)
   */
  async sendSms(notification: SmsNotification) {
    await this.smsQueue.add('send-sms', notification, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  /**
   * Send push notification (queued)
   */
  async sendPush(notification: PushNotification) {
    await this.pushQueue.add('send-push', notification, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
  }

  /**
   * Send in-app notification (real-time)
   */
  async sendInApp(notification: InAppNotification) {
    // Save to database
    const saved = await this.prisma.notification.create({
      data: {
        userId: notification.userId,
        tenantId: notification.tenantId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data ?? undefined,
        actionUrl: notification.actionUrl,
        read: false,
      },
    });

    // Send real-time via WebSocket
    await this.inAppService.sendToUser(notification.userId, {
      id: saved.id,
      ...notification,
      createdAt: saved.createdAt,
    });

    return saved;
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user: { email: string; name: string }) {
    await this.sendEmail({
      to: user.email,
      subject: '¡Bienvenido a Retail Super App!',
      template: 'welcome',
      context: {
        name: user.name,
        loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
      },
    });
  }

  /**
   * Send invoice email
   */
  async sendInvoiceEmail(sale: any) {
    if (!sale.customerEmail) return;

    await this.sendEmail({
      to: sale.customerEmail,
      subject: `Factura ${sale.invoiceNumber} - ${sale.tenant.name}`,
      template: 'invoice',
      context: {
        invoiceNumber: sale.invoiceNumber,
        customerName: sale.customerName,
        saleDate: sale.saleDate,
        items: sale.items,
        subtotal: sale.subtotalCents / 100,
        tax: sale.taxCents / 100,
        total: sale.totalCents / 100,
        tenant: sale.tenant,
        cae: sale.cae,
      },
      attachments: sale.invoicePdfUrl
        ? [
            {
              filename: `factura-${sale.invoiceNumber}.pdf`,
              path: sale.invoicePdfUrl,
            },
          ]
        : undefined,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    user: { email: string; name: string },
    token: string,
  ) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    await this.sendEmail({
      to: user.email,
      subject: 'Restablecer contraseña',
      template: 'password-reset',
      context: {
        name: user.name,
        resetUrl,
        expiresIn: '1 hora',
      },
    });
  }

  /**
   * Send order confirmation SMS
   */
  async sendOrderConfirmationSms(phone: string, orderNumber: string) {
    await this.sendSms({
      to: phone,
      message: `¡Tu pedido ${orderNumber} fue confirmado! Gracias por tu compra.`,
    });
  }

  /**
   * Send low stock alert
   */
  async sendLowStockAlert(tenantId: string, product: any) {
    // Get users with notification permissions
    const users = await this.prisma.user.findMany({
      where: {
        tenantId,
        role: { in: ['owner', 'admin', 'manager'] },
        isActive: true,
      },
    });

    // Send in-app notification to all managers
    for (const user of users) {
      await this.sendInApp({
        userId: user.id,
        tenantId: tenantId,
        type: 'low_stock',
        title: 'Stock Bajo',
        message: `${product.name} tiene stock bajo (${product.stock} unidades)`,
        data: {
          productId: product.id,
          productName: product.name,
          stock: product.stock,
        },
        actionUrl: `/inventory/products/${product.id}`,
      });
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { userId };

    if (options?.unreadOnly) {
      where.read = false;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(
    userId: string,
    tenantId: string,
    preferences: {
      emailEnabled?: boolean;
      smsEnabled?: boolean;
      pushEnabled?: boolean;
      inAppEnabled?: boolean;
    },
  ) {
    return this.prisma.userNotificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        tenantId,
        ...preferences,
      },
      update: preferences,
    });
  }

  /**
   * Get notification preferences
   */
  async getPreferences(userId: string) {
    const prefs = await this.prisma.userNotificationPreference.findUnique({
      where: { userId },
    });

    return (
      prefs || {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
      }
    );
  }
}
