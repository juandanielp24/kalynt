import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RBACService } from './rbac.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { PermissionGuard } from './guards/permission.guard';
import { RequirePermission } from './decorators/require-permission.decorator';
import { AuditLog, AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User, PermissionResource, PermissionAction } from '@prisma/client';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Roles & Permissions')
@Controller('roles')
@UseGuards(AuthGuard, PermissionGuard)
@UseInterceptors(AuditLogInterceptor)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rbacService: RBACService) {}

  @Get()
  @RequirePermission(PermissionResource.ROLES, PermissionAction.READ)
  @ApiOperation({ summary: 'Get all roles for tenant' })
  async getRoles(@CurrentUser() user: User) {
    const roles = await this.rbacService.getRoles(user.tenantId);

    return {
      success: true,
      data: roles,
    };
  }

  @Get('permissions')
  @RequirePermission(PermissionResource.PERMISSIONS, PermissionAction.READ)
  @ApiOperation({ summary: 'Get all available permissions' })
  async getPermissions() {
    const permissions = await this.rbacService.getPermissionsGrouped();

    return {
      success: true,
      data: permissions,
    };
  }

  @Post()
  @RequirePermission(PermissionResource.ROLES, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'ROLE', description: 'Created new role' })
  @ApiOperation({ summary: 'Create custom role' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        permissionIds: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async createRole(
    @CurrentUser() user: User,
    @Body() body: { name: string; description?: string; permissionIds: string[] },
  ) {
    const role = await this.rbacService.createRole({
      name: body.name,
      description: body.description,
      tenantId: user.tenantId,
      permissionIds: body.permissionIds,
      createdBy: user.id,
    });

    return {
      success: true,
      data: role,
      message: 'Role created successfully',
    };
  }

  @Put(':id/permissions')
  @RequirePermission(PermissionResource.ROLES, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'ROLE', description: 'Updated role permissions' })
  @ApiOperation({ summary: 'Update role permissions' })
  async updateRolePermissions(
    @CurrentUser() user: User,
    @Param('id') roleId: string,
    @Body() body: { permissionIds: string[] },
  ) {
    const role = await this.rbacService.updateRolePermissions(
      roleId,
      body.permissionIds,
      user.id,
    );

    return {
      success: true,
      data: role,
      message: 'Role permissions updated successfully',
    };
  }

  @Delete(':id')
  @RequirePermission(PermissionResource.ROLES, PermissionAction.DELETE)
  @AuditLog({ action: 'DELETE', entity: 'ROLE', description: 'Deleted role' })
  @ApiOperation({ summary: 'Delete custom role' })
  async deleteRole(@CurrentUser() user: User, @Param('id') roleId: string) {
    await this.rbacService.deleteRole(roleId, user.id);

    return {
      success: true,
      message: 'Role deleted successfully',
    };
  }

  @Post(':id/assign')
  @RequirePermission(PermissionResource.USERS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'USER', description: 'Assigned role to user' })
  @ApiOperation({ summary: 'Assign role to user' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
      },
    },
  })
  async assignRole(
    @CurrentUser() user: User,
    @Param('id') roleId: string,
    @Body() body: { userId: string },
  ) {
    const updatedUser = await this.rbacService.assignRole(
      body.userId,
      roleId,
      user.id,
    );

    return {
      success: true,
      data: updatedUser,
      message: 'Role assigned successfully',
    };
  }

  @Get('my-permissions')
  @ApiOperation({ summary: 'Get current user permissions' })
  async getMyPermissions(@CurrentUser() user: User) {
    const permissions = await this.rbacService.getUserPermissions(user.id);

    return {
      success: true,
      data: permissions,
    };
  }
}
