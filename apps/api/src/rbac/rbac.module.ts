import { Module, Global } from '@nestjs/common';
import { RBACService } from './rbac.service';
import { PermissionGuard } from './guards/permission.guard';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { RolesController } from './roles.controller';
import { AuditLogsController } from './audit-logs.controller';
import { AuditLogsService } from './audit-logs.service';

@Global()
@Module({
  controllers: [RolesController, AuditLogsController],
  providers: [
    RBACService,
    AuditLogsService,
    PermissionGuard,
    AuditLogInterceptor,
  ],
  exports: [RBACService, AuditLogsService, PermissionGuard, AuditLogInterceptor],
})
export class RBACModule {}
