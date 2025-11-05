import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  ValidationPipe,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { ReportOptions } from './report.types';
import { RequirePermission } from '@/rbac/decorators/require-permission.decorator';
import { AuditLog } from '@/rbac/interceptors/audit-log.interceptor';
import { PermissionResource, PermissionAction } from '@prisma/client';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(AuthGuard, TenantGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('generate')
  @RequirePermission(PermissionResource.REPORTS, PermissionAction.READ)
  @AuditLog({ action: 'EXECUTE', entity: 'REPORT', description: 'Generated report' })
  async generateReport(
    @Query(new ValidationPipe({ transform: true })) dto: GenerateReportDto,
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Res() res: Response,
  ): Promise<void> {
    const options: ReportOptions = {
      type: dto.type,
      format: dto.format,
      tenantId,
      userId,
      filters: {
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        locationId: dto.locationId,
        categoryId: dto.categoryId,
        productId: dto.productId,
        status: dto.status,
      },
    };

    const { buffer, filename, mimeType } =
      await this.reportsService.generateReport(options);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  }

  @Get('sales')
  @RequirePermission(PermissionResource.REPORTS, PermissionAction.READ)
  @AuditLog({ action: 'EXECUTE', entity: 'REPORT', description: 'Generated sales report' })
  async salesReport(
    @Query('format') format: string = 'excel',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('locationId') locationId?: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const dto: GenerateReportDto = {
      type: 'sales' as any,
      format: format as any,
      startDate,
      endDate,
      locationId,
    };

    return this.generateReport(dto, tenantId!, userId!, res!);
  }

  @Get('inventory')
  @RequirePermission(PermissionResource.REPORTS, PermissionAction.READ)
  @AuditLog({ action: 'EXECUTE', entity: 'REPORT', description: 'Generated inventory report' })
  async inventoryReport(
    @Query('format') format: string = 'excel',
    @Query('locationId') locationId?: string,
    @Query('categoryId') categoryId?: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const dto: GenerateReportDto = {
      type: 'inventory' as any,
      format: format as any,
      locationId,
      categoryId,
    };

    return this.generateReport(dto, tenantId!, userId!, res!);
  }

  @Get('financial')
  @RequirePermission(PermissionResource.REPORTS, PermissionAction.READ)
  @AuditLog({ action: 'EXECUTE', entity: 'REPORT', description: 'Generated financial report' })
  async financialReport(
    @Query('format') format: string = 'excel',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const dto: GenerateReportDto = {
      type: 'financial' as any,
      format: format as any,
      startDate,
      endDate,
    };

    return this.generateReport(dto, tenantId!, userId!, res!);
  }

  @Get('products')
  @RequirePermission(PermissionResource.REPORTS, PermissionAction.READ)
  @AuditLog({ action: 'EXECUTE', entity: 'REPORT', description: 'Generated products report' })
  async productsReport(
    @Query('format') format: string = 'excel',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('categoryId') categoryId?: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const dto: GenerateReportDto = {
      type: 'products' as any,
      format: format as any,
      startDate,
      endDate,
      categoryId,
    };

    return this.generateReport(dto, tenantId!, userId!, res!);
  }

  @Get('customers')
  @RequirePermission(PermissionResource.REPORTS, PermissionAction.READ)
  @AuditLog({ action: 'EXECUTE', entity: 'REPORT', description: 'Generated customers report' })
  async customersReport(
    @Query('format') format: string = 'excel',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const dto: GenerateReportDto = {
      type: 'customers' as any,
      format: format as any,
      startDate,
      endDate,
    };

    return this.generateReport(dto, tenantId!, userId!, res!);
  }

  @Get('tax')
  @RequirePermission(PermissionResource.REPORTS, PermissionAction.READ)
  @AuditLog({ action: 'EXECUTE', entity: 'REPORT', description: 'Generated tax report' })
  async taxReport(
    @Query('format') format: string = 'excel',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Headers('x-tenant-id') tenantId?: string,
    @Headers('x-user-id') userId?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const dto: GenerateReportDto = {
      type: 'tax' as any,
      format: format as any,
      startDate,
      endDate,
    };

    return this.generateReport(dto, tenantId!, userId!, res!);
  }
}
