import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MercadoPago from 'mercadopago';
import * as QRCode from 'qrcode';
import {
  MercadoPagoConfig,
  MercadoPagoPaymentRequest,
  MercadoPagoQRRequest,
  MercadoPagoPaymentInfo,
} from './mercadopago.types';
import { PaymentStatus } from '../../payments.types';

@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private client: typeof MercadoPago;

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

    MercadoPago.configure({
      access_token: accessToken,
    });

    this.client = MercadoPago;
    this.logger.log('Mercado Pago client initialized');
  }

  /**
   * Crea un pago con Mercado Pago
   */
  async createPayment(
    paymentData: MercadoPagoPaymentRequest
  ): Promise<MercadoPagoPaymentInfo> {
    try {
      this.logger.log(`Creating Mercado Pago payment for ${paymentData.payer.email}`);

      const payment = await this.client.payment.create(paymentData);

      this.logger.log(`Payment created: ${payment.body.id}, status: ${payment.body.status}`);

      return payment.body as MercadoPagoPaymentInfo;
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
   */
  async createQRPayment(
    qrData: MercadoPagoQRRequest
  ): Promise<{
    qrCode: string;
    qrData: string;
    inStoreOrderId: string;
  }> {
    try {
      this.logger.log(`Creating QR payment for reference: ${qrData.external_reference}`);

      // Crear orden en la API de Point of Sale
      const order = await this.client.instore.create({
        external_reference: qrData.external_reference,
        title: qrData.title,
        description: qrData.description,
        notification_url: qrData.notification_url,
        total_amount: qrData.total_amount,
        items: qrData.items,
      });

      const inStoreOrderId = order.body.id;
      const qrData_string = order.body.qr_data;

      // Generar QR code como imagen base64
      const qrCodeImage = await QRCode.toDataURL(qrData_string, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'M',
      });

      this.logger.log(`QR payment created: ${inStoreOrderId}`);

      return {
        qrCode: qrCodeImage,
        qrData: qrData_string,
        inStoreOrderId,
      };
    } catch (error: any) {
      this.logger.error('Error creating QR payment', error);
      throw new BadRequestException({
        message: 'QR payment creation failed',
        error: error.message,
      });
    }
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
      this.logger.log(`Creating payment link for reference: ${externalReference}`);

      const preference = await this.client.preferences.create({
        items: [
          {
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
        auto_return: 'approved',
      });

      this.logger.log(`Payment link created: ${preference.body.id}`);

      return {
        initPoint: preference.body.init_point,
        id: preference.body.id,
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
      const payment = await this.client.payment.get(Number(paymentId));
      return payment.body as MercadoPagoPaymentInfo;
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
      this.logger.log(`Refunding payment ${paymentId}${amount ? ` - amount: ${amount}` : ''}`);

      const refund = await this.client.refund.create({
        payment_id: Number(paymentId),
        amount: amount,
      });

      this.logger.log(`Refund created: ${refund.body.id}`);

      return refund.body;
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
   */
  async getPaymentMethods(): Promise<any[]> {
    try {
      const methods = await this.client.payment_methods.listAll();
      return methods.body;
    } catch (error: any) {
      this.logger.error('Error getting payment methods', error);
      throw error;
    }
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

      // Implementar verificación según documentación de MP
      // https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks

      // TODO: Implementar verificación real de firma
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
