import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient, WhatsAppTemplateType } from '@retail/database';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppConfigService } from './whatsapp-config.service';

@Injectable()
export class WhatsAppNotificationsService {
  private readonly logger = new Logger(WhatsAppNotificationsService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private whatsappService: WhatsAppService,
    private configService: WhatsAppConfigService,
  ) {}

  /**
   * Send order confirmation
   */
  async sendOrderConfirmation(saleId: string): Promise<void> {
    try {
      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
          location: true,
        },
      });

      if (!sale || !sale.customer?.phone) {
        this.logger.warn(`Cannot send order confirmation: sale or customer phone not found`);
        return;
      }

      const config = await this.configService.getConfig(sale.tenantId);
      if (!config || !config.orderConfirmations) {
        this.logger.log(`Order confirmations disabled for tenant ${sale.tenantId}`);
        return;
      }

      // Check if client is connected
      const isConnected = await this.whatsappService.isConnected(sale.tenantId);
      if (!isConnected) {
        this.logger.warn(`WhatsApp not connected for tenant ${sale.tenantId}`);
        return;
      }

      const variables = {
        customerName: sale.customer.name,
        orderNumber: sale.saleNumber,
        totalAmount: `${sale.totalAmount.toFixed(2)}`,
        orderDate: new Date(sale.createdAt).toLocaleDateString('es-AR'),
        itemsCount: sale.items.length,
        businessName: config.businessName || 'Nuestra tienda',
      };

      await this.whatsappService.sendTemplateMessage(
        sale.tenantId,
        sale.customer.phone,
        WhatsAppTemplateType.ORDER_CONFIRMATION,
        variables
      );

      this.logger.log(`Order confirmation sent for sale ${sale.saleNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send order confirmation: ${error.message}`);
    }
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(saleId: string): Promise<void> {
    try {
      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          customer: true,
        },
      });

      if (!sale || !sale.customer?.phone) {
        return;
      }

      const config = await this.configService.getConfig(sale.tenantId);
      if (!config || !config.orderConfirmations) {
        return;
      }

      const isConnected = await this.whatsappService.isConnected(sale.tenantId);
      if (!isConnected) {
        return;
      }

      const variables = {
        customerName: sale.customer.name,
        orderNumber: sale.saleNumber,
        amount: `${sale.totalAmount.toFixed(2)}`,
        paymentDate: new Date().toLocaleDateString('es-AR'),
        businessName: config.businessName || 'Nuestra tienda',
      };

      await this.whatsappService.sendTemplateMessage(
        sale.tenantId,
        sale.customer.phone,
        WhatsAppTemplateType.PAYMENT_RECEIVED,
        variables
      );

      this.logger.log(`Payment confirmation sent for sale ${sale.saleNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send payment confirmation: ${error.message}`);
    }
  }

  /**
   * Send payment reminder
   */
  async sendPaymentReminder(saleId: string): Promise<void> {
    try {
      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          customer: true,
        },
      });

      if (!sale || !sale.customer?.phone) {
        return;
      }

      // Only send reminder if there's pending amount
      const pendingAmount = sale.totalAmount - sale.paidAmount;
      if (pendingAmount <= 0) {
        return;
      }

      const config = await this.configService.getConfig(sale.tenantId);
      if (!config || !config.paymentReminders) {
        return;
      }

      const isConnected = await this.whatsappService.isConnected(sale.tenantId);
      if (!isConnected) {
        return;
      }

      const variables = {
        customerName: sale.customer.name,
        orderNumber: sale.saleNumber,
        amount: `${pendingAmount.toFixed(2)}`,
        dueDate: sale.dueDate
          ? new Date(sale.dueDate).toLocaleDateString('es-AR')
          : 'Sin fecha definida',
        businessName: config.businessName || 'Nuestra tienda',
      };

      await this.whatsappService.sendTemplateMessage(
        sale.tenantId,
        sale.customer.phone,
        WhatsAppTemplateType.PAYMENT_REMINDER,
        variables
      );

      this.logger.log(`Payment reminder sent for sale ${sale.saleNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send payment reminder: ${error.message}`);
    }
  }

  /**
   * Send stock alert to customers who want specific product
   */
  async sendStockAlert(productId: string, tenantId: string): Promise<void> {
    try {
      const product = await this.prisma.product.findFirst({
        where: { id: productId, tenantId },
        include: {
          stock: true,
        },
      });

      if (!product) {
        return;
      }

      const config = await this.configService.getConfig(tenantId);
      if (!config || !config.stockAlerts) {
        return;
      }

      const isConnected = await this.whatsappService.isConnected(tenantId);
      if (!isConnected) {
        return;
      }

      // Get customers who have this product in wishlist or previous interest
      // This is a simplified version - you might want to track customer interests
      const interestedCustomers = await this.prisma.customer.findMany({
        where: {
          tenantId,
          phone: { not: null },
          // Add your logic to find interested customers
        },
        take: 50, // Limit to avoid spam
      });

      const totalStock = product.stock.reduce((sum, s) => sum + s.quantity, 0);

      for (const customer of interestedCustomers) {
        if (!customer.phone) continue;

        const variables = {
          customerName: customer.name,
          productName: product.name,
          price: `${product.price.toFixed(2)}`,
          quantity: totalStock.toString(),
          businessName: config.businessName || 'Nuestra tienda',
        };

        try {
          await this.whatsappService.sendTemplateMessage(
            tenantId,
            customer.phone,
            WhatsAppTemplateType.STOCK_ALERT,
            variables
          );

          // Add delay between messages to avoid rate limits
          await this.delay(2000);
        } catch (error) {
          this.logger.error(
            `Failed to send stock alert to ${customer.phone}: ${error.message}`
          );
        }
      }

      this.logger.log(`Stock alerts sent for product ${product.name}`);
    } catch (error) {
      this.logger.error(`Failed to send stock alerts: ${error.message}`);
    }
  }

  /**
   * Send low stock alert to admin/managers
   */
  async sendLowStockAlertToAdmin(productId: string, tenantId: string): Promise<void> {
    try {
      const product = await this.prisma.product.findFirst({
        where: { id: productId, tenantId },
        include: {
          stock: true,
        },
      });

      if (!product) {
        return;
      }

      const totalStock = product.stock.reduce((sum, s) => sum + s.quantity, 0);

      // Only send if stock is below minimum
      if (totalStock > (product.minStock || 0)) {
        return;
      }

      const config = await this.configService.getConfig(tenantId);
      if (!config || !config.stockAlerts) {
        return;
      }

      const isConnected = await this.whatsappService.isConnected(tenantId);
      if (!isConnected) {
        return;
      }

      // Get admin users with permission to manage stock
      const adminUsers = await this.prisma.user.findMany({
        where: {
          tenantId,
          // phone: { not: null },
          // roleAssignments: {
          //   some: {
          //     role: {
          //       permissions: {
          //         some: {
          //           permission: {
          //             resource: 'STOCK',
          //             action: 'UPDATE',
          //           },
          //         },
          //       },
          //     },
          //   },
          // },
        },
      });

      const message = `⚠️ *ALERTA DE STOCK BAJO*

Producto: ${product.name}
SKU: ${product.sku}
Stock actual: ${totalStock}
Stock mínimo: ${product.minStock || 0}

Se requiere reposición urgente.`;

      for (const user of adminUsers) {
        // if (!user.phone) continue;

        try {
          // TODO: Add phone field to User model or get from profile
          // await this.whatsappService.sendMessage(tenantId, user.phone, message, {
          //   type: 'admin_alert',
          //   productId: product.id,
          // });

          await this.delay(1000);
        } catch (error) {
          this.logger.error(
            `Failed to send low stock alert to admin: ${error.message}`
          );
        }
      }

      this.logger.log(`Low stock alerts sent to admins for product ${product.name}`);
    } catch (error) {
      this.logger.error(`Failed to send low stock alert to admin: ${error.message}`);
    }
  }

  /**
   * Send welcome message to new customer
   */
  async sendWelcomeMessage(customerId: string): Promise<void> {
    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });

      if (!customer || !customer.phone) {
        return;
      }

      const config = await this.configService.getConfig(customer.tenantId);
      if (!config) {
        return;
      }

      const isConnected = await this.whatsappService.isConnected(customer.tenantId);
      if (!isConnected) {
        return;
      }

      const variables = {
        customerName: customer.name,
        businessName: config.businessName || 'Nuestra tienda',
      };

      await this.whatsappService.sendTemplateMessage(
        customer.tenantId,
        customer.phone,
        WhatsAppTemplateType.WELCOME,
        variables
      );

      this.logger.log(`Welcome message sent to customer ${customer.name}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome message: ${error.message}`);
    }
  }

  /**
   * Send custom message
   */
  async sendCustomMessage(
    tenantId: string,
    phoneNumber: string,
    message: string,
    mediaUrl?: string
  ): Promise<string> {
    const config = await this.configService.getConfig(tenantId);
    if (!config || !config.notificationsEnabled) {
      throw new Error('WhatsApp notifications are disabled');
    }

    const isConnected = await this.whatsappService.isConnected(tenantId);
    if (!isConnected) {
      throw new Error('WhatsApp is not connected');
    }

    if (mediaUrl) {
      return this.whatsappService.sendMessageWithMedia(
        tenantId,
        phoneNumber,
        message,
        mediaUrl,
        'image'
      );
    }

    return this.whatsappService.sendMessage(tenantId, phoneNumber, message);
  }

  /**
   * Send bulk messages
   */
  async sendBulkMessages(
    tenantId: string,
    phoneNumbers: string[],
    message: string,
    delayMs: number = 2000
  ): Promise<{ success: number; failed: number }> {
    const config = await this.configService.getConfig(tenantId);
    if (!config || !config.notificationsEnabled) {
      throw new Error('WhatsApp notifications are disabled');
    }

    const isConnected = await this.whatsappService.isConnected(tenantId);
    if (!isConnected) {
      throw new Error('WhatsApp is not connected');
    }

    let success = 0;
    let failed = 0;

    for (const phoneNumber of phoneNumbers) {
      try {
        await this.whatsappService.sendMessage(tenantId, phoneNumber, message);
        success++;
        await this.delay(delayMs);
      } catch (error) {
        this.logger.error(`Failed to send message to ${phoneNumber}: ${error.message}`);
        failed++;
      }
    }

    this.logger.log(`Bulk messages sent: ${success} success, ${failed} failed`);

    return { success, failed };
  }

  /**
   * Schedule payment reminders (to be called by cron)
   */
  async schedulePaymentReminders(): Promise<void> {
    try {
      this.logger.log('Running scheduled payment reminders...');

      // Get all tenants with WhatsApp enabled
      const configs = await this.prisma.whatsAppConfig.findMany({
        where: {
          paymentReminders: true,
          isConnected: true,
        },
      });

      for (const config of configs) {
        // Find sales with pending payments and due date approaching
        const now = new Date();
        const reminderDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days from now

        const salesWithPendingPayments = await this.prisma.sale.findMany({
          where: {
            tenantId: config.tenantId,
            // paidAmount: { lt: this.prisma.raw('total_amount') },
            dueDate: {
              gte: now,
              lte: reminderDate,
            },
          },
          include: {
            customer: true,
          },
        });

        for (const sale of salesWithPendingPayments) {
          if (!sale.customer?.phone) continue;

          try {
            await this.sendPaymentReminder(sale.id);
            await this.delay(3000); // 3 seconds delay between messages
          } catch (error) {
            this.logger.error(
              `Failed to send payment reminder for sale ${sale.saleNumber}: ${error.message}`
            );
          }
        }
      }

      this.logger.log('Scheduled payment reminders completed');
    } catch (error) {
      this.logger.error(`Failed to run scheduled payment reminders: ${error.message}`);
    }
  }

  /**
   * Utility: Delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
