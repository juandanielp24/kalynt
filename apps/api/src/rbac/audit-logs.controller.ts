import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RequirePermission } from './decorators/require-permission.decorator';
import { PermissionResource, PermissionAction } from '@prisma/client';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @RequirePermission(PermissionResource.AUDIT_LOGS, PermissionAction.READ)
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'resource', required: false, type: String })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getAuditLogs(@CurrentUser() user: any, @Query() query: any) {
    const logs = await this.auditLogsService.getAuditLogs(user.tenantId, {
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
      userId: query.userId,
      resource: query.resource,
      action: query.action,
      startDate: query.startDate,
      endDate: query.endDate,
    });

    return {
      success: true,
      data: logs,
    };
  }

  @Get('stats')
  @RequirePermission(PermissionResource.AUDIT_LOGS, PermissionAction.READ)
  async getAuditStats(@CurrentUser() user: any) {
    const stats = await this.auditLogsService.getStats(user.tenantId);

    return {
      success: true,
      data: stats,
    };
  }
}
