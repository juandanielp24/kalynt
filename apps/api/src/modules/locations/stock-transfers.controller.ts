import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Headers,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { StockTransfersService } from './stock-transfers.service';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequirePermission } from '@/rbac/decorators/require-permission.decorator';
import { AuditLog } from '@/rbac/interceptors/audit-log.interceptor';
import { PermissionResource, PermissionAction, TransferStatus } from '@retail/database';

@ApiTags('Stock Transfers')
@Controller('stock-transfers')
@UseGuards(TenantGuard)
@ApiBearerAuth()
export class StockTransfersController {
  constructor(private readonly transfersService: StockTransfersService) {}

  @Get()
  @RequirePermission(PermissionResource.STOCK_MOVEMENTS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get all stock transfers with filters and pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TransferStatus })
  @ApiQuery({ name: 'fromLocationId', required: false })
  @ApiQuery({ name: 'toLocationId', required: false })
  @ApiResponse({ status: 200, description: 'Returns paginated list of transfers' })
  async getTransfers(
    @Headers('x-tenant-id') tenantId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('status') status?: TransferStatus,
    @Query('fromLocationId') fromLocationId?: string,
    @Query('toLocationId') toLocationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.transfersService.getTransfers(tenantId, {
      page,
      limit,
      status,
      fromLocationId,
      toLocationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return {
      success: true,
      ...result,
    };
  }

  @Get('stats')
  @RequirePermission(PermissionResource.STOCK_MOVEMENTS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get transfer statistics' })
  @ApiQuery({ name: 'locationId', required: false, description: 'Filter stats by location' })
  @ApiResponse({ status: 200, description: 'Returns transfer statistics' })
  async getTransferStats(
    @Headers('x-tenant-id') tenantId: string,
    @Query('locationId') locationId?: string,
  ) {
    const stats = await this.transfersService.getTransferStats(tenantId, locationId);

    return {
      success: true,
      data: stats,
    };
  }

  @Get('locations/:locationId/restock-suggestions')
  @RequirePermission(PermissionResource.STOCK_MOVEMENTS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get restock suggestions for a location based on low stock' })
  @ApiResponse({ status: 200, description: 'Returns restock suggestions' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getRestockSuggestions(
    @Headers('x-tenant-id') tenantId: string,
    @Param('locationId') locationId: string,
  ) {
    const suggestions = await this.transfersService.getRestockSuggestions(locationId, tenantId);

    return {
      success: true,
      data: suggestions,
    };
  }

  @Get(':id')
  @RequirePermission(PermissionResource.STOCK_MOVEMENTS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get a transfer by ID' })
  @ApiResponse({ status: 200, description: 'Returns transfer details' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async getTransfer(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    const transfer = await this.transfersService.getTransfer(id, tenantId);

    return {
      success: true,
      data: transfer,
    };
  }

  @Post()
  @RequirePermission(PermissionResource.STOCK_MOVEMENTS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'STOCK_TRANSFER', description: 'Created a stock transfer request' })
  @ApiOperation({ summary: 'Create a new stock transfer request' })
  @ApiResponse({ status: 201, description: 'Transfer created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or insufficient stock' })
  async createTransfer(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: any,
  ) {
    const transfer = await this.transfersService.createTransfer(tenantId, userId, dto);

    return {
      success: true,
      data: transfer,
      message: 'Transfer request created successfully',
    };
  }

  @Put(':id/approve')
  @RequirePermission(PermissionResource.STOCK_MOVEMENTS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'STOCK_TRANSFER', description: 'Approved a stock transfer' })
  @ApiOperation({ summary: 'Approve a pending stock transfer' })
  @ApiResponse({ status: 200, description: 'Transfer approved successfully' })
  @ApiResponse({ status: 400, description: 'Transfer is not in PENDING status or insufficient stock' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async approveTransfer(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto?: any,
  ) {
    const transfer = await this.transfersService.approveTransfer(id, tenantId, userId, dto);

    return {
      success: true,
      data: transfer,
      message: 'Transfer approved successfully',
    };
  }

  @Put(':id/reject')
  @RequirePermission(PermissionResource.STOCK_MOVEMENTS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'STOCK_TRANSFER', description: 'Rejected a stock transfer' })
  @ApiOperation({ summary: 'Reject a pending stock transfer' })
  @ApiResponse({ status: 200, description: 'Transfer rejected successfully' })
  @ApiResponse({ status: 400, description: 'Transfer is not in PENDING status' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async rejectTransfer(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: { rejectionReason: string },
  ) {
    const transfer = await this.transfersService.rejectTransfer(id, tenantId, userId, dto);

    return {
      success: true,
      data: transfer,
      message: 'Transfer rejected successfully',
    };
  }

  @Put(':id/send')
  @RequirePermission(PermissionResource.STOCK_MOVEMENTS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'STOCK_TRANSFER', description: 'Sent a stock transfer' })
  @ApiOperation({ summary: 'Mark transfer as sent and process stock removal from source location' })
  @ApiResponse({ status: 200, description: 'Transfer sent successfully, stock removed from source' })
  @ApiResponse({ status: 400, description: 'Transfer is not in APPROVED status or insufficient stock' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async sendTransfer(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto?: any,
  ) {
    const transfer = await this.transfersService.sendTransfer(id, tenantId, userId, dto);

    return {
      success: true,
      data: transfer,
      message: 'Transfer sent successfully. Stock has been removed from source location.',
    };
  }

  @Put(':id/receive')
  @RequirePermission(PermissionResource.STOCK_MOVEMENTS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'STOCK_TRANSFER', description: 'Received a stock transfer' })
  @ApiOperation({ summary: 'Mark transfer as received and process stock addition to destination location' })
  @ApiResponse({ status: 200, description: 'Transfer received successfully, stock added to destination' })
  @ApiResponse({ status: 400, description: 'Transfer is not in IN_TRANSIT status' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async receiveTransfer(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto?: any,
  ) {
    const transfer = await this.transfersService.receiveTransfer(id, tenantId, userId, dto);

    return {
      success: true,
      data: transfer,
      message: 'Transfer received successfully. Stock has been added to destination location.',
    };
  }

  @Put(':id/cancel')
  @RequirePermission(PermissionResource.STOCK_MOVEMENTS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'STOCK_TRANSFER', description: 'Cancelled a stock transfer' })
  @ApiOperation({ summary: 'Cancel a transfer (only PENDING or APPROVED status)' })
  @ApiResponse({ status: 200, description: 'Transfer cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Transfer cannot be cancelled in current status' })
  @ApiResponse({ status: 404, description: 'Transfer not found' })
  async cancelTransfer(
    @Headers('x-tenant-id') tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: { cancellationReason: string },
  ) {
    const transfer = await this.transfersService.cancelTransfer(id, tenantId, userId, dto);

    return {
      success: true,
      data: transfer,
      message: 'Transfer cancelled successfully',
    };
  }
}
