import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DeliveryService } from './delivery.service';
import { DeliverySettingsService } from './delivery-settings.service';

@Injectable()
export class DeliveryEventsListener {
  private readonly logger = new Logger(DeliveryEventsListener.name);

  constructor(
    private deliveryService: DeliveryService,
    private settingsService: DeliverySettingsService,
  ) {}

  /**
   * Listen to delivery created event
   */
  @OnEvent('delivery.created')
  async handleDeliveryCreated(payload: {
    tenantId: string;
    deliveryId: string;
    saleId: string;
  }) {
    this.logger.log(
      `Handling delivery.created event for delivery ${payload.deliveryId}`,
    );

    try {
      const delivery = await this.deliveryService.getDelivery(
        payload.tenantId,
        payload.deliveryId,
      );

      // Check if auto-assign is enabled
      const settings = await this.settingsService.getSettings(delivery.tenantId);

      if (settings.autoAssign) {
        this.logger.log(`Auto-assigning delivery ${delivery.deliveryNumber}`);
        await this.deliveryService.autoAssignDelivery(
          delivery.tenantId,
          payload.deliveryId,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle delivery.created event: ${error.message}`,
      );
    }
  }

  /**
   * Listen to delivery assigned event
   */
  @OnEvent('delivery.assigned')
  async handleDeliveryAssigned(payload: {
    tenantId: string;
    deliveryId: string;
    driverId: string;
    delivery: any;
  }) {
    this.logger.log(
      `Handling delivery.assigned event: delivery ${payload.deliveryId} to driver ${payload.driverId}`,
    );

    // Here we'll emit WhatsApp notification event
    // This will be handled by WhatsApp service
    try {
      const shouldNotify = await this.settingsService.shouldNotifyCustomer(
        payload.tenantId,
        'assign',
      );

      if (shouldNotify && payload.delivery?.sale?.customerPhone) {
        // Emit WhatsApp notification event
        // WhatsApp service will listen to this
        this.logger.log(
          `Should send WhatsApp notification for delivery assignment to ${payload.delivery.sale.customerPhone}`,
        );
        // TODO: Emit event for WhatsApp notification
        // this.eventEmitter.emit('whatsapp.delivery.assigned', { ... });
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle delivery.assigned event: ${error.message}`,
      );
    }
  }

  /**
   * Listen to delivery status changed event
   */
  @OnEvent('delivery.status.updated')
  async handleDeliveryStatusChanged(payload: {
    tenantId: string;
    deliveryId: string;
    fromStatus: string;
    toStatus: string;
    delivery: any;
  }) {
    this.logger.log(
      `Handling delivery.status.updated event: ${payload.fromStatus} → ${payload.toStatus}`,
    );

    try {
      // Determine notification type based on new status
      let notificationType: 'pickup' | 'arrival' | 'delivery' | null = null;

      switch (payload.toStatus) {
        case 'PICKED_UP':
          notificationType = 'pickup';
          break;
        case 'ARRIVED':
          notificationType = 'arrival';
          break;
        case 'DELIVERED':
          notificationType = 'delivery';
          break;
      }

      if (notificationType) {
        const shouldNotify = await this.settingsService.shouldNotifyCustomer(
          payload.tenantId,
          notificationType,
        );

        if (shouldNotify && payload.delivery?.sale?.customerPhone) {
          // Emit WhatsApp notification event
          // WhatsApp service will listen to this
          this.logger.log(
            `Should send WhatsApp notification for status ${payload.toStatus} to ${payload.delivery.sale.customerPhone}`,
          );
          // TODO: Emit event for WhatsApp notification
          // this.eventEmitter.emit('whatsapp.delivery.status', { ... });
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle delivery.status.updated event: ${error.message}`,
      );
    }
  }
}
