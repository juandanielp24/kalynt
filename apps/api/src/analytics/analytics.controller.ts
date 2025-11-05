import {
  Controller,
  Get,
  Query,
  UseGuards,
  Post,
  Body,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { AnalyticsAdvancedService } from './analytics-advanced.service';
import { AnalyticsExportService } from './analytics-export.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RequirePermission } from '@/rbac/decorators/require-permission.decorator';
import { PermissionResource, PermissionAction } from '@retail/database';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly advancedService: AnalyticsAdvancedService,
    private readonly exportService: AnalyticsExportService,
  ) {}

  @Get('dashboard')
  @RequirePermission(PermissionResource.SALES, PermissionAction.READ)
  @ApiOperation({ summary: 'Get comprehensive dashboard data' })
  async getDashboard(
    @CurrentUser() user: any,
    @Query('period') period?: string,
  ) {
    const data = await this.analyticsService.getDashboardData(
      user.tenantId,
      period || '30d'
    );

    return {
      success: true,
      data,
    };
  }

  @Get('trends')
  @RequirePermission(PermissionResource.SALES, PermissionAction.READ)
  @ApiOperation({ summary: 'Get sales trends' })
  async getTrends(
    @CurrentUser() user: any,
    @Query('period') period?: 'week' | 'month' | 'year',
  ) {
    const data = await this.advancedService.getSalesTrends(
      user.tenantId,
      period || 'month'
    );

    return {
      success: true,
      data,
    };
  }

  @Get('customer-segmentation')
  @RequirePermission(PermissionResource.CUSTOMERS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get customer segmentation (RFM)' })
  async getCustomerSegmentation(@CurrentUser() user: any) {
    const data = await this.advancedService.getCustomerSegmentation(user.tenantId);

    return {
      success: true,
      data,
    };
  }

  @Get('product-performance')
  @RequirePermission(PermissionResource.PRODUCTS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get product performance analysis' })
  async getProductPerformance(
    @CurrentUser() user: any,
    @Query('period') period?: string,
  ) {
    const data = await this.advancedService.getProductPerformance(
      user.tenantId,
      period || '90d'
    );

    return {
      success: true,
      data,
    };
  }

  @Get('hourly-pattern')
  @RequirePermission(PermissionResource.SALES, PermissionAction.READ)
  @ApiOperation({ summary: 'Get hourly sales pattern' })
  async getHourlySalesPattern(
    @CurrentUser() user: any,
    @Query('days') days?: string,
  ) {
    const data = await this.advancedService.getHourlySalesPattern(
      user.tenantId,
      days ? parseInt(days) : 30
    );

    return {
      success: true,
      data,
    };
  }

  @Post('export')
  @RequirePermission(PermissionResource.SALES, PermissionAction.READ)
  @ApiOperation({ summary: 'Export analytics data' })
  async exportData(
    @CurrentUser() user: any,
    @Body() body: { type: string; period?: string; format?: 'csv' | 'xlsx' | 'pdf' },
    @Res() res: Response,
  ) {
    const format = body.format || 'xlsx';
    const period = body.period || '30d';

    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    if (body.type === 'dashboard') {
      const data = await this.analyticsService.getDashboardData(user.tenantId, period);

      if (format === 'csv') {
        buffer = await this.exportService.exportDashboardToCSV(data);
        filename = `dashboard-${Date.now()}.csv`;
        contentType = 'text/csv';
      } else if (format === 'xlsx') {
        buffer = await this.exportService.exportDashboardToExcel(data);
        filename = `dashboard-${Date.now()}.xlsx`;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else {
        buffer = await this.exportService.exportDashboardToPDF(data);
        filename = `dashboard-${Date.now()}.pdf`;
        contentType = 'application/pdf';
      }
    } else if (body.type === 'products') {
      const data = await this.advancedService.getProductPerformance(user.tenantId, period);
      buffer = await this.exportService.exportProductsToExcel(data);
      filename = `productos-${Date.now()}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (body.type === 'customers') {
      const data = await this.advancedService.getCustomerSegmentation(user.tenantId);
      buffer = await this.exportService.exportCustomersToExcel(data);
      filename = `clientes-${Date.now()}.xlsx`;
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else {
      throw new Error('Invalid export type');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
