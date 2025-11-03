import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import { MercadoPagoProvider } from './providers/mercadopago.provider';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from './providers/payment-provider.interface';

@Injectable()
export class PaymentsService {
  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private mercadoPagoProvider: MercadoPagoProvider
  ) {}

  async createPayment(tenantId: string, dto: CreatePaymentDto) {
    // Validar que la venta existe
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: dto.saleId,
        tenantId,
      },
      include: {
        customer: true,
      },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    // Verificar que no esté ya pagada completamente
    if (sale.status === 'COMPLETED') {
      throw new BadRequestException('Sale already paid');
    }

    // Crear pago con Mercado Pago
    const paymentResult = await this.mercadoPagoProvider.createPayment({
      amountCents: sale.totalCents,
      currency: 'ARS',
      description: `Venta #${sale.saleNumber}`,
      metadata: {
        saleId: sale.id,
        tenantId,
        paymentMethodId: dto.paymentMethodId || 'pix',
        email: dto.email || sale.customer?.email || 'customer@example.com',
        ...dto.metadata,
      },
    });

    // Actualizar venta con información del pago
    const saleNotes = typeof sale.notes === 'string' ? JSON.parse(sale.notes || '{}') : sale.notes || {};

    const updatedSale = await this.prisma.sale.update({
      where: { id: sale.id },
      data: {
        status: paymentResult.status === PaymentStatus.APPROVED ? 'COMPLETED' : 'PENDING',
        paymentMethod: 'MERCADO_PAGO',
        notes: {
          ...saleNotes,
          mercadoPagoPaymentId: paymentResult.id,
          paymentExternalId: paymentResult.externalId,
          paymentMetadata: paymentResult.metadata,
          paymentCreatedAt: new Date().toISOString(),
        },
      },
    });

    return {
      sale: updatedSale,
      payment: paymentResult,
    };
  }

  async getPayment(tenantId: string, paymentId: string) {
    return this.mercadoPagoProvider.getPayment(paymentId);
  }

  async getPaymentBySale(tenantId: string, saleId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, tenantId },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    // Extraer payment ID de metadata
    const saleNotes = typeof sale.notes === 'string' ? JSON.parse(sale.notes || '{}') : sale.notes || {};
    const paymentId = saleNotes?.mercadoPagoPaymentId;

    if (!paymentId) {
      throw new NotFoundException('Payment ID not found for this sale');
    }

    return this.mercadoPagoProvider.getPayment(paymentId);
  }

  async refundPayment(tenantId: string, saleId: string, amountCents?: number) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, tenantId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    if (sale.status === 'REFUNDED') {
      throw new BadRequestException('Sale already refunded');
    }

    // Extraer payment ID de metadata
    const saleNotes = typeof sale.notes === 'string' ? JSON.parse(sale.notes || '{}') : sale.notes || {};
    const paymentId = saleNotes?.mercadoPagoPaymentId;

    if (!paymentId) {
      throw new NotFoundException('Payment ID not found');
    }

    // Procesar reembolso con Mercado Pago
    const refundResult = await this.mercadoPagoProvider.refundPayment(
      paymentId,
      amountCents
    );

    // Actualizar venta
    await this.prisma.sale.update({
      where: { id: saleId },
      data: {
        status: 'REFUNDED',
        notes: {
          ...saleNotes,
          refundId: refundResult.id,
          refundedAt: new Date().toISOString(),
          refundAmount: amountCents || sale.totalCents,
        },
      },
    });

    // TODO: Restaurar stock si es reembolso completo
    if (!amountCents || amountCents === sale.totalCents) {
      // Reembolso completo - restaurar todo el stock
      for (const item of sale.items) {
        await this.prisma.stock.updateMany({
          where: {
            productId: item.productId,
            tenantId,
          },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }
    }

    return {
      success: true,
      refund: refundResult,
      sale: sale,
    };
  }

  /**
   * Webhook handler para notificaciones de Mercado Pago
   */
  async handleWebhook(body: any) {
    const { type, data } = body;

    if (type === 'payment') {
      const paymentId = data.id;

      try {
        const payment = await this.mercadoPagoProvider.getPayment(paymentId);

        // Buscar venta asociada por external_reference o metadata
        const sales = await this.prisma.sale.findMany({
          where: {
            notes: {
              path: ['mercadoPagoPaymentId'],
              equals: paymentId,
            },
          },
        });

        if (sales.length > 0) {
          const sale = sales[0];

          // Actualizar estado según webhook
          if (payment.status === PaymentStatus.APPROVED) {
            await this.prisma.sale.update({
              where: { id: sale.id },
              data: {
                status: 'COMPLETED',
                notes: {
                  ...(typeof sale.notes === 'string' ? JSON.parse(sale.notes) : sale.notes),
                  paymentApprovedAt: new Date().toISOString(),
                  webhookReceived: true,
                },
              },
            });

            // TODO: Generar factura AFIP si está configurado
          } else if (payment.status === PaymentStatus.REJECTED) {
            await this.prisma.sale.update({
              where: { id: sale.id },
              data: {
                status: 'CANCELLED',
                notes: {
                  ...(typeof sale.notes === 'string' ? JSON.parse(sale.notes) : sale.notes),
                  paymentRejectedAt: new Date().toISOString(),
                  webhookReceived: true,
                },
              },
            });
          }
        }
      } catch (error) {
        console.error('Error processing webhook:', error);
      }
    }

    return { success: true };
  }

  /**
   * Calcular comisión de Mercado Pago para un monto
   */
  calculateCommission(
    amountCents: number,
    paymentMethod: string,
    installments: number = 1
  ): number {
    return this.mercadoPagoProvider.calculateCommission(
      amountCents,
      paymentMethod,
      installments
    );
  }

  /**
   * Obtener información de tasas de comisión
   */
  getCommissionRates() {
    return this.mercadoPagoProvider.getCommissionRates();
  }
}
