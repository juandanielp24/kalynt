import { Controller, Post, Get, Body, Query, Headers, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AdjustStockDto, TransferStockDto } from './dto';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RequirePermission } from '@/rbac/decorators/require-permission.decorator';
import { AuditLog } from '@/rbac/interceptors/audit-log.interceptor';
import { PermissionResource, PermissionAction } from '@prisma/client';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(AuthGuard, TenantGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjust')
  @RequirePermission(PermissionResource.STOCK, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'STOCK', description: 'Adjusted stock quantity' })
  async adjustStock(
    @Headers('x-tenant-id') tenantId: string,
    @Req() req: any,
    @Body() dto: AdjustStockDto
  ) {
    // Extract user from request (assumes AuthGuard is also applied or user is set)
    const userId = req.user?.id || 'system';

    return this.inventoryService.adjustStock(
      tenantId,
      dto.productId,
      dto.locationId,
      dto.quantity,
      dto.reason,
      userId
    );
  }

  @Post('transfer')
  @RequirePermission(PermissionResource.STOCK, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'STOCK', description: 'Transferred stock between locations' })
  async transferStock(
    @Headers('x-tenant-id') tenantId: string,
    @Req() req: any,
    @Body() dto: TransferStockDto
  ) {
    const userId = req.user?.id || 'system';

    return this.inventoryService.transferStock(
      tenantId,
      dto.productId,
      dto.fromLocationId,
      dto.toLocationId,
      dto.quantity,
      userId
    );
  }

  @Get('movements')
  @RequirePermission(PermissionResource.STOCK, PermissionAction.READ)
  async getMovements(
    @Headers('x-tenant-id') tenantId: string,
    @Query('productId') productId?: string,
    @Query('locationId') locationId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    return this.inventoryService.getStockMovements(
      tenantId,
      productId,
      locationId,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined
    );
  }

  @Get('low-stock')
  @RequirePermission(PermissionResource.STOCK, PermissionAction.READ)
  async getLowStock(
    @Headers('x-tenant-id') tenantId: string,
    @Query('locationId') locationId?: string
  ) {
    return this.inventoryService.getLowStockProducts(tenantId, locationId);
  }

  @Get('summary')
  @RequirePermission(PermissionResource.STOCK, PermissionAction.READ)
  async getSummary(
    @Headers('x-tenant-id') tenantId: string,
    @Query('locationId') locationId?: string
  ) {
    return this.inventoryService.getInventorySummary(tenantId, locationId);
  }
}
