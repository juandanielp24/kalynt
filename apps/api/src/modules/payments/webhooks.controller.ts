import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { MercadoPagoService } from './providers/mercadopago/mercadopago.service';
import { MercadoPagoWebhookDto } from './dto/webhook-notification.dto';

@Controller('payments/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly mercadoPagoService: MercadoPagoService
  ) {}

  /**
   * Webhook de Mercado Pago
   * Recibe notificaciones de cambios de estado en pagos
   */
  @Post('mercadopago')
  @HttpCode(HttpStatus.OK)
  async handleMercadoPagoWebhook(
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
    @Query('id') id: string,
    @Query('topic') topic: string,
    @Body() body: any
  ) {
    try {
      this.logger.log(`Received MP webhook: topic=${topic}, id=${id}`);

      // Validar firma (seguridad)
      const isValid = this.mercadoPagoService.verifyWebhookSignature(
        xSignature,
        xRequestId,
        id
      );

      if (!isValid) {
        this.logger.warn('Invalid webhook signature');
        throw new BadRequestException('Invalid signature');
      }

      // Procesar según el tipo de notificación
      if (topic === 'payment' || body.type === 'payment') {
        const dataId = id || body.data?.id;

        if (!dataId) {
          this.logger.warn('No payment ID in webhook');
          return { success: false };
        }

        await this.paymentsService.processWebhookNotification(dataId, 'payment');
      } else {
        this.logger.debug(`Ignoring webhook topic: ${topic}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error processing webhook', error);

      // Retornar 200 para que MP no reintente
      return { success: false, error: error.message };
    }
  }

  /**
   * Test endpoint para verificar que el webhook está funcionando
   */
  @Post('mercadopago/test')
  @HttpCode(HttpStatus.OK)
  async testWebhook(@Body() body: any) {
    this.logger.log('Test webhook received', body);
    return { success: true, message: 'Webhook endpoint is working' };
  }
}
