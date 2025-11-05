import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { LocationAnalyticsService } from './location-analytics.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { RequirePermission } from '@/rbac/decorators/require-permission.decorator';
import { PermissionResource, PermissionAction } from '@retail/database';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { subDays } from 'date-fns';

@ApiTags('Location Analytics')
@Controller('location-analytics')
@UseGuards(AuthGuard, TenantGuard)
@ApiBearerAuth()
export class LocationAnalyticsController {
  constructor(private readonly analyticsService: LocationAnalyticsService) {}

  @Get('sales-comparison')
  @RequirePermission(PermissionResource.ANALYTICS, PermissionAction.READ)
  @ApiOperation({ summary: 'Compare sales across locations' })
  async getSalesComparison(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : subDays(new Date(), 30);
    const end = endDate ? new Date(endDate) : new Date();

    const comparison = await this.analyticsService.getSalesComparison(user.tenantId, {
      startDate: start,
      endDate: end,
    });

    return {
      success: true,
      data: comparison,
    };
  }

  @Get('stock-distribution')
  @RequirePermission(PermissionResource.ANALYTICS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get stock distribution across locations' })
  async getStockDistribution(
    @CurrentUser() user: any,
    @Query('productId') productId?: string,
  ) {
    const distribution = await this.analyticsService.getStockDistribution(
      user.tenantId,
      productId,
    );

    return {
      success: true,
      data: distribution,
    };
  }

  @Get('locations/:locationId/performance')
  @RequirePermission(PermissionResource.ANALYTICS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get location performance metrics' })
  async getLocationPerformance(
    @CurrentUser() user: any,
    @Param('locationId') locationId: string,
    @Query('days') days?: string,
  ) {
    const performance = await this.analyticsService.getLocationPerformance(
      locationId,
      user.tenantId,
      days ? parseInt(days) : 30,
    );

    return {
      success: true,
      data: performance,
    };
  }

  @Get('locations/:locationId/sales-trend')
  @RequirePermission(PermissionResource.ANALYTICS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get daily sales trend for location' })
  async getSalesTrend(
    @CurrentUser() user: any,
    @Param('locationId') locationId: string,
    @Query('days') days?: string,
  ) {
    const trend = await this.analyticsService.getDailySalesTrend(
      locationId,
      user.tenantId,
      days ? parseInt(days) : 30,
    );

    return {
      success: true,
      data: trend,
    };
  }

  @Get('locations/:locationId/top-products')
  @RequirePermission(PermissionResource.ANALYTICS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get top selling products for location' })
  async getTopProducts(
    @CurrentUser() user: any,
    @Param('locationId') locationId: string,
    @Query('limit') limit?: string,
  ) {
    const topProducts = await this.analyticsService.getTopProducts(
      locationId,
      user.tenantId,
      limit ? parseInt(limit) : 10,
    );

    return {
      success: true,
      data: topProducts,
    };
  }
}
