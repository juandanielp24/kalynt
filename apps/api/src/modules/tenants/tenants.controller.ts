import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';
import { RequirePermission } from '@/rbac/decorators/require-permission.decorator';
import { PermissionResource, PermissionAction } from '@prisma/client';

@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(AuthGuard, TenantGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get(':id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  async findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }
}
