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
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, ProcessMercadoPagoPaymentDto, GeneratePaymentLinkDto } from './dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { RequirePermission } from '@/rbac/decorators/require-permission.decorator';
import { AuditLog } from '@/rbac/interceptors/audit-log.interceptor';
import { PermissionResource, PermissionAction } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(AuthGuard, TenantGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Crea un pago
   */
  @Post()
  @RequirePermission(PermissionResource.PAYMENTS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'PAYMENT', description: 'Created payment' })
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
  @RequirePermission(PermissionResource.PAYMENTS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'PAYMENT', description: 'Generated payment link' })
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
  @RequirePermission(PermissionResource.PAYMENTS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'PAYMENT', description: 'Generated QR payment' })
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
  @RequirePermission(PermissionResource.PAYMENTS, PermissionAction.READ)
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
  @RequirePermission(PermissionResource.PAYMENTS, PermissionAction.EXECUTE)
  @AuditLog({ action: 'EXECUTE', entity: 'PAYMENT', description: 'Refunded payment' })
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
  @RequirePermission(PermissionResource.PAYMENTS, PermissionAction.READ)
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
