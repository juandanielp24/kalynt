import { Injectable, Logger, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import { MercadoPagoService } from './providers/mercadopago/mercadopago.service';
import { PaymentMethod, PaymentStatus, PaymentRequest, PaymentResponse } from './payments.types';
import { CreatePaymentDto, ProcessMercadoPagoPaymentDto } from './dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private mercadoPagoService: MercadoPagoService
  ) {}

  /**
   * Crea un registro de pago
   */
  async createPayment(
    tenantId: string,
    dto: CreatePaymentDto
  ): Promise<PaymentResponse> {
    try {
      // 1. Validar que la venta existe
      const sale = await this.prisma.sale.findUnique({
        where: { id: dto.saleId },
        include: { items: true },
      });

      if (!sale) {
        throw new NotFoundException('Sale not found');
      }

      if (sale.tenantId !== tenantId) {
        throw new BadRequestException('Sale does not belong to this tenant');
      }

      // 2. Crear registro de pago
      const payment = await this.prisma.payment.create({
        data: {
          tenantId,
          saleId: dto.saleId,
          method: dto.method,
          amountCents: dto.amountCents,
          status: PaymentStatus.PENDING,
          externalData: dto.metadata,
        },
      });

      // 3. Procesar según método de pago
      let result: PaymentResponse;

      switch (dto.method) {
        case PaymentMethod.CASH:
          result = await this.processCashPayment(payment.id, dto);
          break;

        case PaymentMethod.MERCADO_PAGO:
        case PaymentMethod.CREDIT_CARD:
        case PaymentMethod.DEBIT_CARD:
          result = await this.processMercadoPagoPayment(payment.id, dto);
          break;

        case PaymentMethod.QR_CODE:
          result = await this.generateQRPayment(payment.id, dto);
          break;

        default:
          throw new BadRequestException(`Payment method ${dto.method} not supported`);
      }

      return result;
    } catch (error) {
      this.logger.error('Error creating payment', error);
      throw error;
    }
  }

  /**
   * Procesa pago en efectivo (aprobación inmediata)
   */
  private async processCashPayment(
    paymentId: string,
    dto: CreatePaymentDto
  ): Promise<PaymentResponse> {
    // Efectivo se aprueba inmediatamente
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    // Actualizar estado de venta
    await this.prisma.sale.update({
      where: { id: dto.saleId },
      data: {
        status: 'completed',
        paymentMethod: PaymentMethod.CASH,
      },
    });

    return {
      success: true,
      paymentId,
      status: PaymentStatus.APPROVED,
    };
  }

  /**
   * Procesa pago con Mercado Pago
   */
  private async processMercadoPagoPayment(
    paymentId: string,
    dto: CreatePaymentDto
  ): Promise<PaymentResponse> {
    try {
      // Obtener datos de la venta
      const sale = await this.prisma.sale.findUnique({
        where: { id: dto.saleId },
      });

      // Preparar request para MP
      const mpPaymentData = {
        transaction_amount: dto.amountCents / 100,
        description: dto.description || `Pago venta #${sale?.saleNumber}`,
        payment_method_id: 'account_money', // Por defecto, se puede cambiar
        payer: {
          email: dto.customerEmail || 'customer@example.com',
        },
        external_reference: dto.saleId,
        notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL,
        metadata: {
          ...dto.metadata,
          payment_id: paymentId,
          tenant_id: sale?.tenantId,
        },
      };

      // Crear pago en MP
      const mpPayment = await this.mercadoPagoService.createPayment(mpPaymentData);

      // Actualizar registro local
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          externalId: String(mpPayment.id),
          status: this.mercadoPagoService.mapMercadoPagoStatus(mpPayment.status),
          externalData: mpPayment as any,
        },
      });

      // Si el pago fue aprobado, actualizar venta
      if (mpPayment.status === 'approved') {
        await this.updateSalePaymentStatus(dto.saleId, PaymentStatus.APPROVED);
      }

      return {
        success: mpPayment.status === 'approved',
        paymentId,
        status: this.mercadoPagoService.mapMercadoPagoStatus(mpPayment.status),
        externalId: String(mpPayment.id),
      };
    } catch (error) {
      this.logger.error('Error processing Mercado Pago payment', error);

      // Actualizar pago como rechazado
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.REJECTED,
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Genera un QR code para pago
   */
  private async generateQRPayment(
    paymentId: string,
    dto: CreatePaymentDto
  ): Promise<PaymentResponse> {
    try {
      const sale = await this.prisma.sale.findUnique({
        where: { id: dto.saleId },
        include: { items: true },
      });

      if (!sale) {
        throw new NotFoundException('Sale not found');
      }

      const qrData = {
        external_reference: dto.saleId,
        title: `Venta #${sale.saleNumber}`,
        description: dto.description || 'Pago de venta',
        total_amount: dto.amountCents / 100,
        items: sale.items.map(item => ({
          sku_number: String(item.productId),
          category: 'marketplace',
          title: item.productName || 'Producto',
          description: item.productName || 'Producto',
          unit_price: item.unitPriceCents / 100,
          quantity: item.quantity,
          unit_measure: 'unit',
          total_amount: item.totalCents / 100,
        })),
        notification_url: process.env.MERCADO_PAGO_WEBHOOK_URL!,
      };

      const qrResult = await this.mercadoPagoService.createQRPayment(qrData);

      // Actualizar pago con QR
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          externalId: qrResult.inStoreOrderId,
          qrCode: qrResult.qrCode,
          status: PaymentStatus.PENDING,
        },
      });

      return {
        success: true,
        paymentId,
        status: PaymentStatus.PENDING,
        qrCode: qrResult.qrCode,
      };
    } catch (error) {
      this.logger.error('Error generating QR payment', error);
      throw error;
    }
  }

  /**
   * Genera un link de pago
   */
  async generatePaymentLink(
    tenantId: string,
    saleId: string
  ): Promise<{ paymentUrl: string; preferenceId: string }> {
    try {
      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
      });

      if (!sale || sale.tenantId !== tenantId) {
        throw new NotFoundException('Sale not found');
      }

      const linkResult = await this.mercadoPagoService.createPaymentLink(
        `Venta #${sale.saleNumber}`,
        `Pago de compra`,
        sale.totalCents,
        saleId,
        process.env.MERCADO_PAGO_WEBHOOK_URL
      );

      // Crear registro de pago
      await this.prisma.payment.create({
        data: {
          tenantId,
          saleId,
          method: PaymentMethod.MERCADO_PAGO,
          amountCents: sale.totalCents,
          status: PaymentStatus.PENDING,
          externalId: linkResult.id,
        },
      });

      return {
        paymentUrl: linkResult.initPoint,
        preferenceId: linkResult.id,
      };
    } catch (error) {
      this.logger.error('Error generating payment link', error);
      throw error;
    }
  }

  /**
   * Procesa notificación de webhook de Mercado Pago
   */
  async processWebhookNotification(
    notificationId: string,
    type: string
  ): Promise<void> {
    try {
      this.logger.log(`Processing webhook notification: ${notificationId}, type: ${type}`);

      if (type !== 'payment') {
        this.logger.debug(`Ignoring webhook type: ${type}`);
        return;
      }

      // Obtener información del pago desde MP
      const mpPayment = await this.mercadoPagoService.getPaymentInfo(notificationId);

      // Buscar pago local por external_reference (saleId)
      const sale = await this.prisma.sale.findUnique({
        where: { id: mpPayment.external_reference },
      });

      if (!sale) {
        this.logger.warn(`Sale not found for external_reference: ${mpPayment.external_reference}`);
        return;
      }

      // Buscar o crear registro de pago
      let payment = await this.prisma.payment.findFirst({
        where: {
          saleId: sale.id,
          externalId: String(mpPayment.id),
        },
      });

      const newStatus = this.mercadoPagoService.mapMercadoPagoStatus(mpPayment.status);

      if (payment) {
        // Actualizar pago existente
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: newStatus,
            externalData: mpPayment as any,
            ...(mpPayment.status === 'approved' && { approvedAt: new Date() }),
          },
        });
      } else {
        // Crear nuevo registro de pago
        payment = await this.prisma.payment.create({
          data: {
            tenantId: sale.tenantId,
            saleId: sale.id,
            method: PaymentMethod.MERCADO_PAGO,
            amountCents: Math.round(mpPayment.transaction_amount * 100),
            status: newStatus,
            externalId: String(mpPayment.id),
            externalData: mpPayment as any,
            ...(mpPayment.status === 'approved' && { approvedAt: new Date() }),
          },
        });
      }

      // Actualizar venta si el pago fue aprobado
      if (mpPayment.status === 'approved') {
        await this.updateSalePaymentStatus(sale.id, PaymentStatus.APPROVED);
      } else if (mpPayment.status === 'rejected' || mpPayment.status === 'cancelled') {
        await this.updateSalePaymentStatus(sale.id, PaymentStatus.REJECTED);
      }

      this.logger.log(`Webhook processed successfully for payment ${payment.id}`);
    } catch (error) {
      this.logger.error('Error processing webhook', error);
      // No relanzar el error para que MP no reintente
    }
  }

  /**
   * Actualiza el estado de pago de una venta
   */
  private async updateSalePaymentStatus(
    saleId: string,
    status: PaymentStatus
  ): Promise<void> {
    const saleStatus = status === PaymentStatus.APPROVED ? 'completed' : 'pending';

    await this.prisma.sale.update({
      where: { id: saleId },
      data: {
        status: saleStatus,
        paymentMethod: PaymentMethod.MERCADO_PAGO,
      },
    });
  }

  /**
   * Obtiene el estado de un pago
   */
  async getPaymentStatus(tenantId: string, paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { sale: true },
    });

    if (!payment || payment.tenantId !== tenantId) {
      throw new NotFoundException('Payment not found');
    }

    // Si tiene externalId de MP, consultar estado actual
    if (payment.externalId && payment.method === PaymentMethod.MERCADO_PAGO) {
      try {
        const mpPayment = await this.mercadoPagoService.getPaymentInfo(payment.externalId);

        // Actualizar estado local si cambió
        const newStatus = this.mercadoPagoService.mapMercadoPagoStatus(mpPayment.status);
        if (newStatus !== payment.status) {
          await this.prisma.payment.update({
            where: { id: paymentId },
            data: { status: newStatus },
          });
          payment.status = newStatus;
        }
      } catch (error) {
        this.logger.error('Error checking MP payment status', error);
      }
    }

    return payment;
  }

  /**
   * Reembolsa un pago
   */
  async refundPayment(
    tenantId: string,
    paymentId: string,
    amount?: number
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.tenantId !== tenantId) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.APPROVED) {
      throw new BadRequestException('Only approved payments can be refunded');
    }

    if (payment.method === PaymentMethod.MERCADO_PAGO && payment.externalId) {
      // Reembolsar en MP
      const refundAmount = amount || payment.amountCents / 100;
      await this.mercadoPagoService.refundPayment(payment.externalId, refundAmount);
    }

    // Actualizar estado local
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
      },
    });

    return { success: true, message: 'Payment refunded' };
  }
}
