import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment, Preference, PaymentRefund } from 'mercadopago';
import * as QRCode from 'qrcode';
import {
  MercadoPagoConfigOptions,
  MercadoPagoPaymentRequest,
  MercadoPagoQRRequest,
  MercadoPagoPaymentInfo,
} from './mercadopago.types';
import { PaymentStatus } from '../../payments.types';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: MercadoPagoConfig;
  private payment: Payment;
  private preference: Preference;
  private refund: PaymentRefund;

  constructor(private configService: ConfigService) {
    this.initializeClient();
  }

  /**
   * Inicializa el cliente de Mercado Pago
   */
  private initializeClient() {
    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN');

    if (!accessToken) {
      this.logger.warn('Mercado Pago access token not configured');
      return;
    }

    this.client = new MercadoPagoConfig({
      accessToken,
      options: {
        timeout: 5000,
      },
    });

    this.payment = new Payment(this.client);
    this.preference = new Preference(this.client);
    this.refund = new PaymentRefund(this.client);
    this.logger.log('Mercado Pago client initialized');
  }

  /**
   * Crea un pago con Mercado Pago
   */
  async createPayment(
    paymentData: MercadoPagoPaymentRequest
  ): Promise<MercadoPagoPaymentInfo> {
    try {
      if (!this.payment) {
        throw new Error('Mercado Pago not configured');
      }

      this.logger.log(`Creating Mercado Pago payment for ${paymentData.payer.email}`);

      const payment = await this.payment.create({
        body: paymentData,
      });

      this.logger.log(`Payment created: ${payment.id}, status: ${payment.status}`);

      return payment as any as MercadoPagoPaymentInfo;
    } catch (error: any) {
      this.logger.error('Error creating Mercado Pago payment', error);
      throw new BadRequestException({
        message: 'Payment creation failed',
        error: error.message,
        details: error.cause,
      });
    }
  }

  /**
   * Genera un QR code para pagos presenciales
   * TODO: Migrate to new Point of Sale API v2
   * https://www.mercadopago.com/developers/en/docs/qr-code/integration-configuration
   */
  async createQRPayment(
    qrData: MercadoPagoQRRequest
  ): Promise<{
    qrCode: string;
    qrData: string;
    inStoreOrderId: string;
  }> {
    // The instore API has been deprecated in MP SDK v2
    // Need to use Point of Sale API v2 instead
    throw new BadRequestException({
      message: 'QR payment creation not implemented for SDK v2',
      error: 'The instore API has been deprecated. Please use Point of Sale API v2.',
    });
  }

  /**
   * Genera un link de pago
   */
  async createPaymentLink(
    title: string,
    description: string,
    amountCents: number,
    externalReference: string,
    notificationUrl?: string
  ): Promise<{
    initPoint: string;
    id: string;
  }> {
    try {
      if (!this.preference) {
        throw new Error('Mercado Pago not configured');
      }

      this.logger.log(`Creating payment link for reference: ${externalReference}`);

      const preference = await this.preference.create({
        body: {
          items: [
            {
              id: externalReference,
              title,
              description,
              unit_price: amountCents / 100,
              quantity: 1,
              currency_id: 'ARS',
            },
          ],
          external_reference: externalReference,
          notification_url: notificationUrl,
          back_urls: {
            success: `${this.configService.get('APP_URL')}/payment/success`,
            failure: `${this.configService.get('APP_URL')}/payment/failure`,
            pending: `${this.configService.get('APP_URL')}/payment/pending`,
          },
          auto_return: 'approved' as any,
        },
      });

      this.logger.log(`Payment link created: ${preference.id}`);

      return {
        initPoint: preference.init_point || '',
        id: preference.id || '',
      };
    } catch (error: any) {
      this.logger.error('Error creating payment link', error);
      throw new BadRequestException({
        message: 'Payment link creation failed',
        error: error.message,
      });
    }
  }

  /**
   * Obtiene información de un pago
   */
  async getPaymentInfo(paymentId: string): Promise<MercadoPagoPaymentInfo> {
    try {
      if (!this.payment) {
        throw new Error('Mercado Pago not configured');
      }

      const payment = await this.payment.get({ id: Number(paymentId) });
      return payment as any as MercadoPagoPaymentInfo;
    } catch (error: any) {
      this.logger.error(`Error getting payment info for ${paymentId}`, error);
      throw new BadRequestException({
        message: 'Failed to get payment info',
        error: error.message,
      });
    }
  }

  /**
   * Reembolsa un pago
   */
  async refundPayment(paymentId: string, amount?: number): Promise<any> {
    try {
      if (!this.refund) {
        throw new Error('Mercado Pago not configured');
      }

      this.logger.log(`Refunding payment ${paymentId}${amount ? ` - amount: ${amount}` : ''}`);

      const refund = await this.refund.create({
        payment_id: Number(paymentId),
        body: {
          amount: amount,
        },
      });

      this.logger.log(`Refund created: ${refund.id}`);

      return refund;
    } catch (error: any) {
      this.logger.error(`Error refunding payment ${paymentId}`, error);
      throw new BadRequestException({
        message: 'Refund failed',
        error: error.message,
      });
    }
  }

  /**
   * Obtiene los métodos de pago disponibles
   * TODO: Update to use PaymentMethod class in SDK v2
   * https://www.mercadopago.com/developers/en/reference/payment_methods/_payment_methods/get
   */
  async getPaymentMethods(): Promise<any[]> {
    // The payment_methods API has changed in v2
    // Need to use PaymentMethod class instead
    throw new BadRequestException({
      message: 'Get payment methods not implemented for SDK v2',
      error: 'The payment_methods API has changed. Please use PaymentMethod class.',
    });
  }

  /**
   * Convierte el status de MP al status interno
   */
  mapMercadoPagoStatus(mpStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      approved: PaymentStatus.APPROVED,
      pending: PaymentStatus.PENDING,
      in_process: PaymentStatus.IN_PROCESS,
      rejected: PaymentStatus.REJECTED,
      cancelled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
    };

    return statusMap[mpStatus] || PaymentStatus.PENDING;
  }

  /**
   * Verifica la firma del webhook (seguridad)
   */
  verifyWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string
  ): boolean {
    try {
      const secret = this.configService.get<string>('MERCADO_PAGO_WEBHOOK_SECRET');

      if (!secret) {
        this.logger.warn('Webhook secret not configured, skipping verification');
        return true;
      }

      // Implementar verificaci�n seg�n documentaci�n de MP
      // https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks

      // TODO: Implementar verificaci�n real de firma
      // const crypto = require('crypto');
      // const parts = xSignature.split(',');
      // ...

      return true;
    } catch (error: any) {
      this.logger.error('Error verifying webhook signature', error);
      return false;
    }
  }
}
