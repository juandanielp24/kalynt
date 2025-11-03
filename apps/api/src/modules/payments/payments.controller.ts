import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, ProcessMercadoPagoPaymentDto, GeneratePaymentLinkDto } from './dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Crea un pago
   */
  @Post()
  @UseGuards(AuthGuard, TenantGuard)
  @HttpCode(HttpStatus.OK)
  async createPayment(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: CreatePaymentDto
  ) {
    const result = await this.paymentsService.createPayment(tenantId, dto);

    return {
      success: result.success,
      data: result,
    };
  }

  /**
   * Genera un link de pago con Mercado Pago
   */
  @Post('generate-link')
  @UseGuards(AuthGuard, TenantGuard)
  @HttpCode(HttpStatus.OK)
  async generatePaymentLink(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: GeneratePaymentLinkDto
  ) {
    const result = await this.paymentsService.generatePaymentLink(tenantId, dto.saleId);

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Genera un QR code para pago presencial
   */
  @Post('generate-qr')
  @UseGuards(AuthGuard, TenantGuard)
  @HttpCode(HttpStatus.OK)
  async generateQRPayment(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: { saleId: string }
  ) {
    const result = await this.paymentsService.createPayment(tenantId, {
      saleId: dto.saleId,
      method: 'qr_code' as any,
      amountCents: 0, // Se obtiene de la venta
    });

    return {
      success: true,
      data: result,
    };
  }

  /**
   * Obtiene el estado de un pago
   */
  @Get(':id/status')
  @UseGuards(AuthGuard, TenantGuard)
  async getPaymentStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') paymentId: string
  ) {
    const payment = await this.paymentsService.getPaymentStatus(tenantId, paymentId);

    return {
      success: true,
      data: payment,
    };
  }

  /**
   * Reembolsa un pago
   */
  @Post(':id/refund')
  @UseGuards(AuthGuard, TenantGuard)
  @HttpCode(HttpStatus.OK)
  async refundPayment(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') paymentId: string,
    @Body() body: { amount?: number }
  ) {
    const result = await this.paymentsService.refundPayment(
      tenantId,
      paymentId,
      body.amount
    );

    return result;
  }

  /**
   * Lista pagos de un tenant (con filtros)
   */
  @Get()
  @UseGuards(AuthGuard, TenantGuard)
  async listPayments(
    @Headers('x-tenant-id') tenantId: string,
    @Query('saleId') saleId?: string,
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    // TODO: Implementar en PaymentsService
    return {
      success: true,
      data: [],
      meta: { page, limit, total: 0 },
    };
  }
}
