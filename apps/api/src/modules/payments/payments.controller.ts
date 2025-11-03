import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentWebhookDto } from './dto';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { AuthGuard } from '@/common/guards/auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(AuthGuard, TenantGuard)
  async createPayment(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreatePaymentDto
  ) {
    return this.paymentsService.createPayment(tenantId, dto);
  }

  @Get(':id')
  @UseGuards(AuthGuard, TenantGuard)
  async getPayment(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.paymentsService.getPayment(tenantId, id);
  }

  @Get('sale/:saleId')
  @UseGuards(AuthGuard, TenantGuard)
  async getPaymentBySale(
    @Headers('x-tenant-id') tenantId: string,
    @Param('saleId') saleId: string
  ) {
    return this.paymentsService.getPaymentBySale(tenantId, saleId);
  }

  @Post('sale/:saleId/refund')
  @UseGuards(AuthGuard, TenantGuard)
  async refundPayment(
    @Headers('x-tenant-id') tenantId: string,
    @Param('saleId') saleId: string,
    @Body() body: { amountCents?: number }
  ) {
    return this.paymentsService.refundPayment(tenantId, saleId, body.amountCents);
  }

  @Get('commission/rates')
  @UseGuards(AuthGuard)
  async getCommissionRates() {
    return this.paymentsService.getCommissionRates();
  }

  @Get('commission/calculate')
  @UseGuards(AuthGuard)
  async calculateCommission(
    @Query('amountCents') amountCents: string,
    @Query('paymentMethod') paymentMethod: string,
    @Query('installments') installments?: string
  ) {
    const commission = this.paymentsService.calculateCommission(
      parseInt(amountCents, 10),
      paymentMethod,
      installments ? parseInt(installments, 10) : 1
    );

    return {
      amountCents: parseInt(amountCents, 10),
      commissionCents: commission,
      netAmountCents: parseInt(amountCents, 10) - commission,
    };
  }

  /**
   * Webhook endpoint (sin autenticación, verificar signature de MP)
   * TODO: Implementar verificación de signature
   */
  @Post('webhooks/mercadopago')
  @HttpCode(HttpStatus.OK)
  async handleMercadoPagoWebhook(@Body() body: PaymentWebhookDto) {
    return this.paymentsService.handleWebhook(body);
  }
}
