import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Headers,
  Query,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { AuthGuard } from '@/common/guards/auth.guard';
import { CreateSaleDto, CompleteSaleDto, QuerySalesDto } from './dto';
import { RequirePermission } from '@/rbac/decorators/require-permission.decorator';
import { AuditLog } from '@/rbac/interceptors/audit-log.interceptor';
import { PermissionResource, PermissionAction } from '@prisma/client';

@ApiTags('Sales')
@Controller('sales')
@UseGuards(AuthGuard, TenantGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  /**
   * Lista todas las ventas con filtros
   * GET /sales?page=1&limit=50&status=COMPLETED
   */
  @Get()
  @RequirePermission(PermissionResource.SALES, PermissionAction.READ)
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: QuerySalesDto
  ) {
    return this.salesService.findAll(tenantId, query);
  }

  /**
   * Obtiene una venta por ID
   * GET /sales/:id
   */
  @Get(':id')
  @RequirePermission(PermissionResource.SALES, PermissionAction.READ)
  async findOne(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.salesService.findOne(tenantId, id);
  }

  /**
   * Crea una nueva venta (borrador)
   * POST /sales
   */
  @Post()
  @RequirePermission(PermissionResource.SALES, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'SALE', description: 'Created new sale' })
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() createDto: CreateSaleDto
  ) {
    return this.salesService.create(tenantId, userId, createDto);
  }

  /**
   * Completa una venta y genera factura AFIP
   * POST /sales/:id/complete
   */
  @Post(':id/complete')
  @RequirePermission(PermissionResource.SALES, PermissionAction.EXECUTE)
  @AuditLog({ action: 'EXECUTE', entity: 'SALE', description: 'Completed sale and generated AFIP invoice' })
  async complete(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto?: CompleteSaleDto
  ) {
    return this.salesService.complete(tenantId, id, dto);
  }

  /**
   * Cancela una venta y restaura stock
   * DELETE /sales/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PermissionResource.SALES, PermissionAction.DELETE)
  @AuditLog({ action: 'DELETE', entity: 'SALE', description: 'Cancelled sale and restored stock' })
  async cancel(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    return this.salesService.cancel(tenantId, id);
  }

  /**
   * Obtiene el estado del servidor AFIP
   * GET /sales/afip/status
   */
  @Get('afip/status')
  @RequirePermission(PermissionResource.SALES, PermissionAction.READ)
  async getAFIPStatus() {
    return this.salesService.getAFIPStatus();
  }
}
