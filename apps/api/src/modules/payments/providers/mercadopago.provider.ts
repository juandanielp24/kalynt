import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoConfig, Payment, Refund } from 'mercadopago';
import {
  IPaymentProvider,
  PaymentIntent,
  PaymentResult,
  PaymentStatus,
  PaymentMethod,
} from './payment-provider.interface';

@Injectable()
export class MercadoPagoProvider implements IPaymentProvider {
  private readonly logger = new Logger(MercadoPagoProvider.name);
  private client: MercadoPagoConfig;
  private payment: Payment;
  private refund: Refund;

  constructor(private configService: ConfigService) {
    const accessToken = this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN');

    if (!accessToken) {
      this.logger.warn('MERCADO_PAGO_ACCESS_TOKEN not configured. Payment processing will not work.');
      // No lanzar error para permitir que la app funcione sin MP configurado
    } else {
      this.client = new MercadoPagoConfig({
        accessToken,
        options: {
          timeout: 5000,
        },
      });

      this.payment = new Payment(this.client);
      this.refund = new Refund(this.client);
    }
  }

  async createPayment(intent: PaymentIntent): Promise<PaymentResult> {
    try {
      if (!this.payment) {
        throw new Error('Mercado Pago not configured');
      }

      const response = await this.payment.create({
        body: {
          transaction_amount: intent.amountCents / 100, // MP usa decimales
          description: intent.description,
          payment_method_id: intent.metadata?.paymentMethodId || 'pix',
          payer: {
            email: intent.metadata?.email || 'customer@example.com',
          },
          external_reference: intent.metadata?.saleId,
          notification_url: this.configService.get('MERCADO_PAGO_WEBHOOK_URL'),
          metadata: intent.metadata,
        },
      });

      this.logger.log(`Payment created: ${response.id}`);

      return {
        id: response.id!.toString(),
        status: this.mapStatus(response.status!),
        amountCents: intent.amountCents,
        paidCents: Math.round(response.transaction_amount! * 100),
        method: PaymentMethod.MERCADO_PAGO,
        externalId: response.id!.toString(),
        approvalCode: response.authorization_code || undefined,
        metadata: {
          status_detail: response.status_detail,
          payment_method: response.payment_method_id,
          payment_type: response.payment_type_id,
          qr_code: response.point_of_interaction?.transaction_data?.qr_code,
          qr_code_base64: response.point_of_interaction?.transaction_data?.qr_code_base64,
          ticket_url: response.point_of_interaction?.transaction_data?.ticket_url,
        },
      };
    } catch (error) {
      this.logger.error('Error creating payment', error);
      throw error;
    }
  }

  async getPayment(id: string): Promise<PaymentResult> {
    try {
      if (!this.payment) {
        throw new Error('Mercado Pago not configured');
      }

      const response = await this.payment.get({ id: Number(id) });

      return {
        id: response.id!.toString(),
        status: this.mapStatus(response.status!),
        amountCents: Math.round(response.transaction_amount! * 100),
        paidCents: Math.round((response.transaction_amount_refunded || 0) * 100),
        method: PaymentMethod.MERCADO_PAGO,
        externalId: response.id!.toString(),
        approvalCode: response.authorization_code || undefined,
        metadata: {
          status_detail: response.status_detail,
          payment_method: response.payment_method_id,
          payment_type: response.payment_type_id,
        },
      };
    } catch (error) {
      this.logger.error(`Error getting payment ${id}`, error);
      throw error;
    }
  }

  async refundPayment(id: string, amountCents?: number): Promise<PaymentResult> {
    try {
      if (!this.refund) {
        throw new Error('Mercado Pago not configured');
      }

      const response = await this.refund.create({
        body: {
          payment_id: Number(id),
          amount: amountCents ? amountCents / 100 : undefined,
        },
      });

      this.logger.log(`Refund created for payment ${id}: ${response.id}`);

      return {
        id: response.id!.toString(),
        status: PaymentStatus.REFUNDED,
        amountCents: Math.round(response.amount! * 100),
        paidCents: 0,
        method: PaymentMethod.MERCADO_PAGO,
        externalId: id,
      };
    } catch (error) {
      this.logger.error(`Error refunding payment ${id}`, error);
      throw error;
    }
  }

  async cancelPayment(id: string): Promise<PaymentResult> {
    try {
      if (!this.payment) {
        throw new Error('Mercado Pago not configured');
      }

      const response = await this.payment.cancel({ id: Number(id) });

      return {
        id: response.id!.toString(),
        status: PaymentStatus.CANCELLED,
        amountCents: Math.round(response.transaction_amount! * 100),
        paidCents: 0,
        method: PaymentMethod.MERCADO_PAGO,
        externalId: id,
      };
    } catch (error) {
      this.logger.error(`Error cancelling payment ${id}`, error);
      throw error;
    }
  }

  private mapStatus(mpStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: PaymentStatus.PENDING,
      approved: PaymentStatus.APPROVED,
      authorized: PaymentStatus.APPROVED,
      in_process: PaymentStatus.PENDING,
      in_mediation: PaymentStatus.PENDING,
      rejected: PaymentStatus.REJECTED,
      cancelled: PaymentStatus.CANCELLED,
      refunded: PaymentStatus.REFUNDED,
      charged_back: PaymentStatus.REFUNDED,
    };

    return statusMap[mpStatus] || PaymentStatus.PENDING;
  }

  /**
   * Obtener tasas de comisión por método de pago
   * Fuente: https://www.mercadopago.com.ar/costs-section/how-much-cost
   * Nota: Estas son tasas aproximadas de Argentina 2025
   */
  getCommissionRates() {
    return {
      money_in_account: 0.008, // 0.8% instantáneo
      debit_card: 0.0124, // 1.24% instantáneo
      credit_card: {
        instant: 0.0649, // 6.49% instantáneo
        '10_days': 0.0429, // 4.29% a 10 días
        '18_days': 0.0339, // 3.39% a 18 días
        '35_days': 0.0179, // 1.79% a 35 días
        '70_days': 0.0, // Gratis a 70 días
      },
    };
  }

  /**
   * Calcular comisión de Mercado Pago
   */
  calculateCommission(
    amountCents: number,
    paymentMethod: string,
    installments: number = 1
  ): number {
    const rates = this.getCommissionRates();
    let rate = 0;

    if (paymentMethod === 'account_money') {
      rate = rates.money_in_account;
    } else if (paymentMethod.includes('debit')) {
      rate = rates.debit_card;
    } else if (paymentMethod.includes('credit')) {
      // Por defecto, tasa instantánea
      rate = rates.credit_card.instant;

      // Ajustar según cuotas (ejemplo simplificado)
      if (installments >= 10) rate = rates.credit_card['10_days'];
      if (installments >= 18) rate = rates.credit_card['18_days'];
      if (installments >= 35) rate = rates.credit_card['35_days'];
      if (installments >= 70) rate = rates.credit_card['70_days'];
    }

    return Math.round(amountCents * rate);
  }
}
