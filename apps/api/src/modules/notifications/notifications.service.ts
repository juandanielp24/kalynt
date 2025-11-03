import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import { EmailProvider } from './providers/email/email.provider';
import { NotificationPayload, NotificationType, NotificationTemplate } from './notifications.types';
import { formatCurrencyARS } from '@retail/shared';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private emailProvider: EmailProvider
  ) {}

  async send(type: NotificationType, payload: NotificationPayload) {
    try {
      switch (type) {
        case NotificationType.EMAIL:
          await this.emailProvider.send(payload);
          break;
        case NotificationType.PUSH:
          // TODO: Implementar push notifications
          this.logger.warn('Push notifications not yet implemented');
          break;
        case NotificationType.IN_APP:
          // TODO: Implementar in-app notifications
          this.logger.warn('In-app notifications not yet implemented');
          break;
        default:
          throw new Error(`Notification type ${type} not supported`);
      }

      // Log notification (opcional)
      await this.logNotification(type, payload);
    } catch (error) {
      // No fallar si la notificación falla (fail silently)
      this.logger.error('Notification failed:', error);
    }
  }

  private async logNotification(type: NotificationType, payload: NotificationPayload) {
    // Implementar logging si es necesario
    this.logger.debug(`Notification logged: ${type} to ${payload.to} (${payload.template})`);
  }

  // Métodos helper para eventos comunes

  /**
   * Envía email de bienvenida al registrar un nuevo usuario
   */
  async sendWelcomeEmail(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { tenant: true },
      });

      if (!user) {
        this.logger.warn(`User ${userId} not found for welcome email`);
        return;
      }

      await this.send(NotificationType.EMAIL, {
        to: user.email,
        template: NotificationTemplate.WELCOME,
        data: {
          name: user.name,
          email: user.email,
          tenantName: user.tenant.name,
          plan: user.tenant.plan || 'Free',
          appUrl: process.env.APP_URL || 'http://localhost:3000',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send welcome email for user ${userId}`, error);
    }
  }

  /**
   * Envía recibo de venta por email al cliente
   */
  async sendSaleReceipt(saleId: string) {
    try {
      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          items: true,
          tenant: true,
          location: true,
        },
      });

      if (!sale) {
        this.logger.warn(`Sale ${saleId} not found for receipt`);
        return;
      }

      if (!sale.customerEmail) {
        this.logger.debug(`Sale ${saleId} has no customer email`);
        return;
      }

      // Formatear items con precios formateados
      const formattedItems = sale.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: formatCurrencyARS(item.unitPriceCents),
        total: formatCurrencyARS(item.totalCents),
      }));

      await this.send(NotificationType.EMAIL, {
        to: sale.customerEmail,
        template: NotificationTemplate.SALE_RECEIPT,
        data: {
          tenantName: sale.tenant.name,
          tenantCuit: sale.tenant.cuit,
          address: sale.location.address || '',
          saleNumber: sale.saleNumber,
          saleDate: new Date(sale.saleDate).toLocaleDateString('es-AR'),
          invoiceType: sale.invoiceType,
          invoiceNumber: sale.invoiceNumber,
          cae: sale.cae,
          customerName: sale.customerName,
          customerCuit: sale.customerCuit,
          items: formattedItems,
          subtotal: formatCurrencyARS(sale.subtotalCents),
          tax: formatCurrencyARS(sale.taxCents),
          discount: sale.discountCents > 0 ? formatCurrencyARS(sale.discountCents) : null,
          total: formatCurrencyARS(sale.totalCents),
          paymentMethod: this.translatePaymentMethod(sale.paymentMethod),
          websiteUrl: process.env.APP_URL || 'http://localhost:3000',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send sale receipt for sale ${saleId}`, error);
    }
  }

  /**
   * Envía alerta de stock bajo a los administradores
   */
  async sendLowStockAlert(productId: string, locationId: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          stock: {
            where: { locationId },
            include: { location: true },
          },
          tenant: {
            include: {
              users: {
                where: { role: { in: ['owner', 'admin'] } },
              },
            },
          },
        },
      });

      if (!product) {
        this.logger.warn(`Product ${productId} not found for low stock alert`);
        return;
      }

      if (!product.stock[0]) {
        this.logger.warn(`Stock not found for product ${productId} at location ${locationId}`);
        return;
      }

      const stock = product.stock[0];

      // Enviar a todos los admins/owners
      for (const user of product.tenant.users) {
        await this.send(NotificationType.EMAIL, {
          to: user.email,
          template: NotificationTemplate.LOW_STOCK_ALERT,
          data: {
            productName: product.name,
            sku: product.sku,
            currentStock: stock.quantity,
            minStock: stock.minQuantity,
            locationName: stock.location.name,
            productId: product.id,
            appUrl: process.env.APP_URL || 'http://localhost:3000',
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send low stock alert for product ${productId}`, error);
    }
  }

  /**
   * Envía email de recuperación de contraseña
   */
  async sendPasswordResetEmail(email: string, resetToken: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        this.logger.warn(`User with email ${email} not found for password reset`);
        return;
      }

      const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

      await this.send(NotificationType.EMAIL, {
        to: email,
        template: NotificationTemplate.PASSWORD_RESET,
        data: {
          name: user.name,
          resetUrl,
          expirationHours: 24,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
    }
  }

  /**
   * Traduce método de pago a texto legible
   */
  private translatePaymentMethod(method: string): string {
    const translations: Record<string, string> = {
      CASH: 'Efectivo',
      DEBIT_CARD: 'Tarjeta de Débito',
      CREDIT_CARD: 'Tarjeta de Crédito',
      MERCADO_PAGO: 'Mercado Pago',
      MODO: 'MODO',
      BANK_TRANSFER: 'Transferencia Bancaria',
    };

    return translations[method] || method;
  }

  /**
   * Verifica la configuración del proveedor de email
   */
  async verifyEmailProvider(): Promise<boolean> {
    return this.emailProvider.verify();
  }
}
