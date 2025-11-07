import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationInventoryService } from './location-inventory.service';
import { StockTransfersService } from './stock-transfers.service';
import { FranchiseService } from './franchise.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { RequirePermission } from '../rbac/decorators/require-permission.decorator';
import { AuditLog } from '../rbac/interceptors/audit-log.interceptor';
import {
  PermissionResource,
  PermissionAction,
  LocationType,
  LocationStatus,
} from '@retail/database';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Locations')
@Controller('locations')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
    private readonly inventoryService: LocationInventoryService,
    private readonly transfersService: StockTransfersService,
    private readonly franchiseService: FranchiseService,
  ) {}

  // ==================== Locations ====================

  @Get()
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get all locations' })
  async getLocations(
    @CurrentUser() user: any,
    @Query('type') type?: LocationType,
    @Query('status') status?: LocationStatus,
  ) {
    const locations = await this.locationsService.getLocations(user.tenantId, {
      type,
      status,
    });

    return {
      success: true,
      data: locations,
    };
  }

  @Get('my-locations')
  @ApiOperation({ summary: 'Get locations accessible by current user' })
  async getMyLocations(@CurrentUser() user: any) {
    const locations = await this.locationsService.getUserLocations(
      user.id,
      user.tenantId,
    );

    return {
      success: true,
      data: locations,
    };
  }

  @Get(':id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get location by ID' })
  async getLocation(@CurrentUser() user: any, @Param('id') id: string) {
    const location = await this.locationsService.getLocation(id, user.tenantId);

    return {
      success: true,
      data: location,
    };
  }

  @Post()
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'LOCATION' })
  @ApiOperation({ summary: 'Create location' })
  async createLocation(@CurrentUser() user: any, @Body() data: any) {
    const location = await this.locationsService.createLocation(
      user.tenantId,
      data,
    );

    return {
      success: true,
      data: location,
      message: 'Location created successfully',
    };
  }

  @Put(':id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'LOCATION' })
  @ApiOperation({ summary: 'Update location' })
  async updateLocation(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    const location = await this.locationsService.updateLocation(
      id,
      user.tenantId,
      data,
    );

    return {
      success: true,
      data: location,
      message: 'Location updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.DELETE)
  @AuditLog({ action: 'DELETE', entity: 'LOCATION' })
  @ApiOperation({ summary: 'Delete location' })
  async deleteLocation(@CurrentUser() user: any, @Param('id') id: string) {
    await this.locationsService.deleteLocation(id, user.tenantId);

    return {
      success: true,
      message: 'Location deleted successfully',
    };
  }

  @Put(':id/status')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'LOCATION' })
  @ApiOperation({ summary: 'Change location status' })
  async changeStatus(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { status: LocationStatus },
  ) {
    const location = await this.locationsService.changeStatus(
      id,
      user.tenantId,
      data.status,
    );

    return {
      success: true,
      data: location,
      message: 'Status updated successfully',
    };
  }

  @Get(':id/statistics')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get location statistics' })
  async getStatistics(@CurrentUser() user: any, @Param('id') id: string) {
    const stats = await this.locationsService.getStatistics(id, user.tenantId);

    return {
      success: true,
      data: stats,
    };
  }

  @Post(':id/users')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'LOCATION' })
  @ApiOperation({ summary: 'Assign user to location' })
  async assignUser(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { userId: string; isManager?: boolean },
  ) {
    const userLocation = await this.locationsService.assignUser(
      id,
      user.tenantId,
      data.userId,
      data.isManager,
    );

    return {
      success: true,
      data: userLocation,
      message: 'User assigned successfully',
    };
  }

  @Delete(':id/users/:userId')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'LOCATION' })
  @ApiOperation({ summary: 'Remove user from location' })
  async removeUser(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    await this.locationsService.removeUser(id, user.tenantId, userId);

    return {
      success: true,
      message: 'User removed successfully',
    };
  }

  // ==================== Inventory ====================

  @Get(':id/inventory')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.READ)
  @ApiOperation({ summary: 'Get inventory for location' })
  async getLocationInventory(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('productId') productId?: string,
    @Query('lowStock') lowStock?: string,
    @Query('search') search?: string,
  ) {
    const inventory = await this.inventoryService.getLocationInventory(
      id,
      user.tenantId,
      {
        productId,
        lowStock: lowStock === 'true',
        search,
      },
    );

    return {
      success: true,
      data: inventory,
    };
  }

  @Get(':id/inventory/valuation')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.READ)
  @ApiOperation({ summary: 'Get inventory valuation for location' })
  async getInventoryValuation(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const valuation = await this.inventoryService.getInventoryValuation(
      id,
      user.tenantId,
    );

    return {
      success: true,
      data: valuation,
    };
  }

  @Put(':id/inventory/:productId')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'INVENTORY' })
  @ApiOperation({ summary: 'Update inventory for product at location' })
  async updateInventory(
    @CurrentUser() user: any,
    @Param('id') locationId: string,
    @Param('productId') productId: string,
    @Body() data: any,
  ) {
    const inventory = await this.inventoryService.updateInventory(
      locationId,
      user.tenantId,
      productId,
      data,
    );

    return {
      success: true,
      data: inventory,
      message: 'Inventory updated successfully',
    };
  }

  @Post(':id/inventory/:productId/adjust')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'INVENTORY' })
  @ApiOperation({ summary: 'Adjust inventory quantity' })
  async adjustInventory(
    @CurrentUser() user: any,
    @Param('id') locationId: string,
    @Param('productId') productId: string,
    @Body() data: { adjustment: number; reason: string },
  ) {
    const inventory = await this.inventoryService.adjustInventory(
      locationId,
      user.tenantId,
      productId,
      data.adjustment,
      data.reason,
    );

    return {
      success: true,
      data: inventory,
      message: 'Inventory adjusted successfully',
    };
  }

  @Post(':id/inventory/sync-product')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'INVENTORY' })
  @ApiOperation({ summary: 'Sync product to location' })
  async syncProduct(
    @CurrentUser() user: any,
    @Param('id') locationId: string,
    @Body() data: { productId: string; initialQuantity?: number },
  ) {
    const inventory = await this.inventoryService.syncProductToLocation(
      locationId,
      user.tenantId,
      data.productId,
      data.initialQuantity,
    );

    return {
      success: true,
      data: inventory,
      message: 'Product synced successfully',
    };
  }

  // ==================== Stock Transfers ====================

  @Get('transfers/all')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.READ)
  @ApiOperation({ summary: 'Get all stock transfers' })
  async getTransfers(
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('fromLocationId') fromLocationId?: string,
    @Query('toLocationId') toLocationId?: string,
  ) {
    const transfers = await this.transfersService.getTransfers(user.tenantId, {
      status: status as any,
      fromLocationId,
      toLocationId,
    });

    return {
      success: true,
      data: transfers,
    };
  }

  @Get('transfers/:id')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.READ)
  @ApiOperation({ summary: 'Get transfer by ID' })
  async getTransfer(@CurrentUser() user: any, @Param('id') id: string) {
    const transfer = await this.transfersService.getTransfer(id, user.tenantId);

    return {
      success: true,
      data: transfer,
    };
  }

  @Post('transfers')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'STOCK_TRANSFER' })
  @ApiOperation({ summary: 'Create stock transfer' })
  async createTransfer(@CurrentUser() user: any, @Body() data: any) {
    const transfer = await this.transfersService.createTransfer(
      user.tenantId,
      user.id,
      data,
    );

    return {
      success: true,
      data: transfer,
      message: 'Transfer created successfully',
    };
  }

  @Put('transfers/:id/approve')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'STOCK_TRANSFER' })
  @ApiOperation({ summary: 'Approve transfer' })
  async approveTransfer(@CurrentUser() user: any, @Param('id') id: string) {
    const transfer = await this.transfersService.approveTransfer(
      id,
      user.tenantId,
      user.id,
    );

    return {
      success: true,
      data: transfer,
      message: 'Transfer approved successfully',
    };
  }

  @Put('transfers/:id/reject')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'STOCK_TRANSFER' })
  @ApiOperation({ summary: 'Reject transfer' })
  async rejectTransfer(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { reason: string },
  ) {
    const transfer = await this.transfersService.rejectTransfer(
      id,
      user.tenantId,
      user.id,
      data.reason,
    );

    return {
      success: true,
      data: transfer,
      message: 'Transfer rejected successfully',
    };
  }

  @Put('transfers/:id/ship')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'STOCK_TRANSFER' })
  @ApiOperation({ summary: 'Ship transfer' })
  async shipTransfer(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data?: any,
  ) {
    const transfer = await this.transfersService.shipTransfer(
      id,
      user.tenantId,
      user.id,
      data,
    );

    return {
      success: true,
      data: transfer,
      message: 'Transfer shipped successfully',
    };
  }

  @Put('transfers/:id/receive')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'STOCK_TRANSFER' })
  @ApiOperation({ summary: 'Receive transfer' })
  async receiveTransfer(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    const transfer = await this.transfersService.receiveTransfer(
      id,
      user.tenantId,
      user.id,
      data,
    );

    return {
      success: true,
      data: transfer,
      message: 'Transfer received successfully',
    };
  }

  @Put('transfers/:id/complete')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'STOCK_TRANSFER' })
  @ApiOperation({ summary: 'Complete transfer' })
  async completeTransfer(@CurrentUser() user: any, @Param('id') id: string) {
    const transfer = await this.transfersService.completeTransfer(
      id,
      user.tenantId,
    );

    return {
      success: true,
      data: transfer,
      message: 'Transfer completed successfully',
    };
  }

  @Put('transfers/:id/cancel')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'STOCK_TRANSFER' })
  @ApiOperation({ summary: 'Cancel transfer' })
  async cancelTransfer(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { reason: string },
  ) {
    const transfer = await this.transfersService.cancelTransfer(
      id,
      user.tenantId,
      user.id,
      data.reason,
    );

    return {
      success: true,
      data: transfer,
      message: 'Transfer cancelled successfully',
    };
  }

  @Get('transfers/statistics')
  @RequirePermission(PermissionResource.INVENTORY, PermissionAction.READ)
  @ApiOperation({ summary: 'Get transfer statistics' })
  async getTransferStatistics(
    @CurrentUser() user: any,
    @Query('locationId') locationId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.transfersService.getStatistics(user.tenantId, {
      locationId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });

    return {
      success: true,
      data: stats,
    };
  }

  // ==================== Franchises ====================

  @Get('franchises/all')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get all franchises' })
  async getFranchises(
    @CurrentUser() user: any,
    @Query('isActive') isActive?: string,
  ) {
    const franchises = await this.franchiseService.getFranchises(
      user.tenantId,
      {
        isActive:
          isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      },
    );

    return {
      success: true,
      data: franchises,
    };
  }

  @Get('franchises/:id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get franchise by ID' })
  async getFranchise(@CurrentUser() user: any, @Param('id') id: string) {
    const franchise = await this.franchiseService.getFranchise(
      id,
      user.tenantId,
    );

    return {
      success: true,
      data: franchise,
    };
  }

  @Post('franchises')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'FRANCHISE' })
  @ApiOperation({ summary: 'Create franchise' })
  async createFranchise(@CurrentUser() user: any, @Body() data: any) {
    const franchise = await this.franchiseService.createFranchise(
      user.tenantId,
      data,
    );

    return {
      success: true,
      data: franchise,
      message: 'Franchise created successfully',
    };
  }

  @Put('franchises/:id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'FRANCHISE' })
  @ApiOperation({ summary: 'Update franchise' })
  async updateFranchise(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    const franchise = await this.franchiseService.updateFranchise(
      id,
      user.tenantId,
      data,
    );

    return {
      success: true,
      data: franchise,
      message: 'Franchise updated successfully',
    };
  }

  @Delete('franchises/:id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.DELETE)
  @AuditLog({ action: 'DELETE', entity: 'FRANCHISE' })
  @ApiOperation({ summary: 'Delete franchise' })
  async deleteFranchise(@CurrentUser() user: any, @Param('id') id: string) {
    await this.franchiseService.deleteFranchise(id, user.tenantId);

    return {
      success: true,
      message: 'Franchise deleted successfully',
    };
  }

  @Get('franchises/:id/statistics')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get franchise statistics' })
  async getFranchiseStatistics(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const stats = await this.franchiseService.getFranchiseStatistics(
      id,
      user.tenantId,
    );

    return {
      success: true,
      data: stats,
    };
  }

  // ==================== Franchisees ====================

  @Get('franchisees/all')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get all franchisees' })
  async getFranchisees(
    @CurrentUser() user: any,
    @Query('franchiseId') franchiseId?: string,
    @Query('status') status?: string,
  ) {
    const franchisees = await this.franchiseService.getFranchisees(
      user.tenantId,
      {
        franchiseId,
        status: status as any,
      },
    );

    return {
      success: true,
      data: franchisees,
    };
  }

  @Get('franchisees/:id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get franchisee by ID' })
  async getFranchisee(@CurrentUser() user: any, @Param('id') id: string) {
    const franchisee = await this.franchiseService.getFranchisee(
      id,
      user.tenantId,
    );

    return {
      success: true,
      data: franchisee,
    };
  }

  @Post('franchisees')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'FRANCHISEE' })
  @ApiOperation({ summary: 'Create franchisee' })
  async createFranchisee(@CurrentUser() user: any, @Body() data: any) {
    const franchisee = await this.franchiseService.createFranchisee(
      user.tenantId,
      data,
    );

    return {
      success: true,
      data: franchisee,
      message: 'Franchisee created successfully',
    };
  }

  @Put('franchisees/:id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'FRANCHISEE' })
  @ApiOperation({ summary: 'Update franchisee' })
  async updateFranchisee(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    const franchisee = await this.franchiseService.updateFranchisee(
      id,
      user.tenantId,
      data,
    );

    return {
      success: true,
      data: franchisee,
      message: 'Franchisee updated successfully',
    };
  }

  @Post('franchisees/:id/calculate-royalties')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'FRANCHISE_ROYALTY' })
  @ApiOperation({ summary: 'Calculate royalties for franchisee' })
  async calculateRoyalties(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { periodStart: string; periodEnd: string },
  ) {
    const royalty = await this.franchiseService.calculateRoyalties(
      id,
      user.tenantId,
      new Date(data.periodStart),
      new Date(data.periodEnd),
    );

    return {
      success: true,
      data: royalty,
      message: 'Royalties calculated successfully',
    };
  }

  @Put('royalties/:id/mark-paid')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'FRANCHISE_ROYALTY' })
  @ApiOperation({ summary: 'Mark royalty as paid' })
  async markRoyaltyPaid(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { paymentMethod: string; transactionId?: string },
  ) {
    const royalty = await this.franchiseService.markRoyaltyPaid(
      id,
      user.tenantId,
      data,
    );

    return {
      success: true,
      data: royalty,
      message: 'Royalty marked as paid',
    };
  }
}
