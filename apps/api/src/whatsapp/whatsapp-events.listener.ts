import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WhatsAppNotificationsService } from './whatsapp-notifications.service';

@Injectable()
export class WhatsAppEventsListener {
  private readonly logger = new Logger(WhatsAppEventsListener.name);

  constructor(private notificationsService: WhatsAppNotificationsService) {}

  /**
   * Listen to sale created event
   */
  @OnEvent('sale.created')
  async handleSaleCreated(payload: { saleId: string }) {
    this.logger.log(`Handling sale.created event for sale ${payload.saleId}`);
    try {
      await this.notificationsService.sendOrderConfirmation(payload.saleId);
    } catch (error) {
      this.logger.error(`Failed to handle sale.created event: ${error.message}`);
    }
  }

  /**
   * Listen to payment received event
   */
  @OnEvent('payment.received')
  async handlePaymentReceived(payload: { saleId: string }) {
    this.logger.log(`Handling payment.received event for sale ${payload.saleId}`);
    try {
      await this.notificationsService.sendPaymentConfirmation(payload.saleId);
    } catch (error) {
      this.logger.error(`Failed to handle payment.received event: ${error.message}`);
    }
  }

  /**
   * Listen to stock updated event
   */
  @OnEvent('stock.updated')
  async handleStockUpdated(payload: { productId: string; tenantId: string; previousStock: number; newStock: number }) {
    this.logger.log(`Handling stock.updated event for product ${payload.productId}`);
    try {
      // If stock was 0 or low and now is available, send stock alert
      if (payload.previousStock <= 5 && payload.newStock > 5) {
        await this.notificationsService.sendStockAlert(payload.productId, payload.tenantId);
      }

      // If stock is low, send alert to admin
      if (payload.newStock <= 5) {
        await this.notificationsService.sendLowStockAlertToAdmin(
          payload.productId,
          payload.tenantId
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle stock.updated event: ${error.message}`);
    }
  }

  /**
   * Listen to customer created event
   */
  @OnEvent('customer.created')
  async handleCustomerCreated(payload: { customerId: string }) {
    this.logger.log(`Handling customer.created event for customer ${payload.customerId}`);
    try {
      await this.notificationsService.sendWelcomeMessage(payload.customerId);
    } catch (error) {
      this.logger.error(`Failed to handle customer.created event: ${error.message}`);
    }
  }
}
