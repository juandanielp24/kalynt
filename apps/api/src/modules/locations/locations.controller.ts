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
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { RequirePermission } from '@/rbac/decorators/require-permission.decorator';
import { AuditLog } from '@/rbac/interceptors/audit-log.interceptor';
import { PermissionResource, PermissionAction, LocationType } from '@retail/database';

@ApiTags('Locations')
@Controller('locations')
@UseGuards(TenantGuard)
@ApiBearerAuth()
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  @RequirePermission(PermissionResource.LOCATIONS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get all locations' })
  @ApiResponse({ status: 200, description: 'Returns list of locations' })
  async getLocations(
    @Headers('x-tenant-id') tenantId: string,
    @Query('includeInactive') includeInactive?: boolean,
    @Query('type') type?: LocationType,
  ) {
    const locations = await this.locationsService.getLocations(tenantId, {
      includeInactive: includeInactive === true || includeInactive === 'true' as any,
      type,
    });

    return {
      success: true,
      data: locations,
    };
  }

  @Get(':id')
  @RequirePermission(PermissionResource.LOCATIONS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get a location by ID' })
  @ApiResponse({ status: 200, description: 'Returns location details' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getLocation(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    const location = await this.locationsService.getLocation(id, tenantId);

    return {
      success: true,
      data: location,
    };
  }

  @Post()
  @RequirePermission(PermissionResource.LOCATIONS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'LOCATION', description: 'Created a new location' })
  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({ status: 201, description: 'Location created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data or code already exists' })
  async createLocation(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: any,
  ) {
    const location = await this.locationsService.createLocation(tenantId, dto);

    return {
      success: true,
      data: location,
      message: 'Location created successfully',
    };
  }

  @Put(':id')
  @RequirePermission(PermissionResource.LOCATIONS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'LOCATION', description: 'Updated a location' })
  @ApiOperation({ summary: 'Update a location' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async updateLocation(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const location = await this.locationsService.updateLocation(id, tenantId, dto);

    return {
      success: true,
      data: location,
      message: 'Location updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission(PermissionResource.LOCATIONS, PermissionAction.DELETE)
  @AuditLog({ action: 'DELETE', entity: 'LOCATION', description: 'Deleted a location' })
  @ApiOperation({ summary: 'Delete a location (soft delete)' })
  @ApiResponse({ status: 200, description: 'Location deleted successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete location with active stock or pending transfers' })
  async deleteLocation(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    const result = await this.locationsService.deleteLocation(id, tenantId);

    return {
      success: true,
      message: result.message,
    };
  }

  @Get(':id/stock-summary')
  @RequirePermission(PermissionResource.STOCK, PermissionAction.READ)
  @ApiOperation({ summary: 'Get stock summary for a location' })
  @ApiResponse({ status: 200, description: 'Returns stock summary with metrics' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async getLocationStockSummary(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    const summary = await this.locationsService.getLocationStockSummary(id, tenantId);

    return {
      success: true,
      data: summary,
    };
  }

  @Post('users/:userId/assign')
  @RequirePermission(PermissionResource.USERS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'USER', description: 'Assigned user to locations' })
  @ApiOperation({ summary: 'Assign a user to multiple locations' })
  @ApiResponse({ status: 200, description: 'User assigned to locations successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async assignUserToLocations(
    @Headers('x-tenant-id') tenantId: string,
    @Param('userId') userId: string,
    @Body() dto: { locationIds: string[]; defaultLocationId?: string },
  ) {
    const userLocations = await this.locationsService.assignUserToLocations(
      userId,
      tenantId,
      dto.locationIds,
      dto.defaultLocationId,
    );

    return {
      success: true,
      data: userLocations,
      message: 'User assigned to locations successfully',
    };
  }

  @Get('users/:userId')
  @RequirePermission(PermissionResource.USERS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get all locations assigned to a user' })
  @ApiResponse({ status: 200, description: 'Returns user locations' })
  async getUserLocations(
    @Headers('x-tenant-id') tenantId: string,
    @Param('userId') userId: string,
  ) {
    const userLocations = await this.locationsService.getUserLocations(userId, tenantId);

    return {
      success: true,
      data: userLocations,
    };
  }
}
