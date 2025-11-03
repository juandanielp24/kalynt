import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  ValidationPipe,
  Headers,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { ReportOptions } from './report.types';

@Controller('reports')
@UseGuards(AuthGuard, TenantGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('generate')
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
