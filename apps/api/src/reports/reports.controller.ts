import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard } from '../rbac/guards/permission.guard';
import { RequirePermission, Permissions } from '../rbac/decorators/require-permission.decorator';
import { PermissionAction, PermissionResource } from '@retail/database';
import { AuditLog } from '../common/decorators/audit-log.decorator';
import { ReportsService } from './reports.service';
import * as path from 'path';
import * as fs from 'fs';

@Controller('reports')
@UseGuards(AuthGuard, PermissionGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Get all reports
   * GET /reports
   */
  @Get()
  @Permissions({
    resource: PermissionResource.REPORTS,
    action: PermissionAction.READ,
  })
  @AuditLog('reports', 'list')
  async getReports(
    @Req() req: any,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string
  ) {
    const tenantId = req.user.tenantId;

    return this.reportsService.getReports(tenantId, {
      type: type as any,
      status: status as any,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  /**
   * Get report by ID
   * GET /reports/:id
   */
  @Get(':id')
  @Permissions({
    resource: PermissionResource.REPORTS,
    action: PermissionAction.READ,
  })
  @AuditLog('reports', 'view')
  async getReport(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.reportsService.getReport(id, tenantId);
  }

  /**
   * Create new report
   * POST /reports
   */
  @Post()
  @Permissions({
    resource: PermissionResource.REPORTS,
    action: PermissionAction.CREATE,
  })
  @AuditLog('reports', 'create')
  async createReport(
    @Req() req: any,
    @Body()
    body: {
      name: string;
      type: string;
      format: string;
      filters?: any;
    }
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;

    return this.reportsService.createReport(tenantId, userId, {
      name: body.name,
      type: body.type as any,
      format: body.format as any,
      filters: body.filters,
    });
  }

  /**
   * Download report file
   * GET /reports/:id/download
   */
  @Get(':id/download')
  @Permissions({
    resource: PermissionResource.REPORTS,
    action: PermissionAction.READ,
  })
  @AuditLog('reports', 'download')
  async downloadReport(
    @Req() req: any,
    @Param('id') id: string,
    @Res() res: Response
  ) {
    const tenantId = req.user.tenantId;
    const report = await this.reportsService.getReport(id, tenantId);

    if (!report.fileUrl) {
      throw new NotFoundException('Report file not available');
    }

    const filePath = path.join(process.cwd(), 'public', report.fileUrl);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Report file not found');
    }

    const fileName = path.basename(report.fileUrl);
    const mimeType =
      report.format === 'PDF'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }

  /**
   * Delete report
   * DELETE /reports/:id
   */
  @Delete(':id')
  @Permissions({
    resource: PermissionResource.REPORTS,
    action: PermissionAction.DELETE,
  })
  @AuditLog('reports', 'delete')
  async deleteReport(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.reportsService.deleteReport(id, tenantId);
  }
}
