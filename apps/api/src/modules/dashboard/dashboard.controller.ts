import { Controller, Get, Query, Headers, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@Controller('dashboard')
@UseGuards(AuthGuard, TenantGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboardData(
    @Headers('x-tenant-id') tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    const data = await this.dashboardService.getDashboardData(
      tenantId,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined
    );

    return {
      success: true,
      data,
    };
  }
}
