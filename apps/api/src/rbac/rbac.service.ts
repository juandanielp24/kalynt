import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { PrismaClient, PermissionResource, PermissionAction } from '@prisma/client';

export interface CheckPermissionOptions {
  userId: string;
  resource: PermissionResource;
  action: PermissionAction;
  tenantId?: string;
  resourceId?: string;
  conditions?: Record<string, any>;
}

@Injectable()
export class RBACService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Check if user has permission
   */
  async hasPermission(options: CheckPermissionOptions): Promise<boolean> {
    const { userId, resource, action, tenantId } = options;

    // Get user with role and permissions
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        rbacRole: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return false;
    }

    // Check tenant match
    if (tenantId && user.tenantId !== tenantId) {
      return false;
    }

    if (!user.rbacRole) {
      return false;
    }

    // Check if role has the specific permission
    const hasPermission = user.rbacRole.permissions.some((rp) => {
      const perm = rp.permission;

      // Check for exact match
      if (perm.resource === resource && perm.action === action && rp.granted) {
        return true;
      }

      // Check for MANAGE permission (implies all actions on resource)
      if (perm.resource === resource && perm.action === PermissionAction.MANAGE && rp.granted) {
        return true;
      }

      // Check for ALL resource with MANAGE action (superadmin)
      if (perm.resource === PermissionResource.ALL && perm.action === PermissionAction.MANAGE && rp.granted) {
        return true;
      }

      return false;
    });

    return hasPermission;
  }

  /**
   * Check permission or throw exception
   */
  async requirePermission(options: CheckPermissionOptions): Promise<void> {
    const hasPermission = await this.hasPermission(options);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions: ${options.action} on ${options.resource}`
      );
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        rbacRole: {
          include: {
            permissions: {
              where: { granted: true },
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user?.rbacRole) {
      return [];
    }

    return user.rbacRole.permissions.map((rp) => ({
      resource: rp.permission.resource,
      action: rp.permission.action,
      description: rp.permission.description,
    }));
  }

  /**
   * Get user role
   */
  async getUserRole(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        rbacRole: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    return user?.rbacRole || null;
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string, assignedBy: string) {
    // Verify role exists and is for the same tenant
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    // Check tenant match (system roles have null tenantId)
    if (role.tenantId && role.tenantId !== user.tenantId) {
      throw new Error('Role does not belong to user tenant');
    }

    // Update user role
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { roleId },
      include: {
        rbacRole: true,
      },
    });

    // Log action
    await this.prisma.auditLog.create({
      data: {
        tenantId: user.tenantId,
        userId: assignedBy,
        roleId: user.roleId,
        action: 'UPDATE',
        entity: 'USER',
        entityId: userId,
        changes: {
          action: 'assign_role',
          roleId,
          roleName: role.name,
        },
      },
    });

    return updated;
  }

  /**
   * Create custom role for tenant
   */
  async createRole(data: {
    name: string;
    description?: string;
    tenantId: string;
    permissionIds: string[];
    createdBy: string;
  }) {
    const { name, description, tenantId, permissionIds, createdBy } = data;

    // Check if role name already exists for tenant
    const existing = await this.prisma.role.findFirst({
      where: {
        tenantId,
        name,
      },
    });

    if (existing) {
      throw new Error('Role with this name already exists');
    }

    // Create role
    const role = await this.prisma.role.create({
      data: {
        name,
        description,
        tenantId,
        isSystem: false,
      },
    });

    // Assign permissions
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId: role.id,
          permissionId,
          granted: true,
        })),
      });
    }

    // Get user for audit log
    const user = await this.prisma.user.findUnique({
      where: { id: createdBy },
    });

    // Log action
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        userId: createdBy,
        roleId: user?.roleId,
        action: 'CREATE',
        entity: 'ROLE',
        entityId: role.id,
        changes: {
          roleName: name,
          permissionsCount: permissionIds.length,
        },
      },
    });

    return this.prisma.role.findUnique({
      where: { id: role.id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Update role permissions
   */
  async updateRolePermissions(
    roleId: string,
    permissionIds: string[],
    updatedBy: string
  ) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystem) {
      throw new Error('Cannot modify system roles');
    }

    // Remove existing permissions
    await this.prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Add new permissions
    if (permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
          granted: true,
        })),
      });
    }

    // Get user for audit log
    const user = await this.prisma.user.findUnique({
      where: { id: updatedBy },
    });

    // Log action
    if (role.tenantId) {
      await this.prisma.auditLog.create({
        data: {
          tenantId: role.tenantId,
          userId: updatedBy,
          roleId: user?.roleId,
          action: 'UPDATE',
          entity: 'ROLE',
          entityId: roleId,
          changes: {
            action: 'update_permissions',
            permissionsCount: permissionIds.length,
          },
        },
      });
    }

    return this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string, deletedBy: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        users: true,
      },
    });

    if (!role) {
      throw new Error('Role not found');
    }

    if (role.isSystem) {
      throw new Error('Cannot delete system roles');
    }

    if (role.users.length > 0) {
      throw new Error('Cannot delete role with assigned users');
    }

    // Get user for audit log
    const user = await this.prisma.user.findUnique({
      where: { id: deletedBy },
    });

    await this.prisma.role.delete({
      where: { id: roleId },
    });

    // Log action
    if (role.tenantId) {
      await this.prisma.auditLog.create({
        data: {
          tenantId: role.tenantId,
          userId: deletedBy,
          roleId: user?.roleId,
          action: 'DELETE',
          entity: 'ROLE',
          entityId: roleId,
          changes: {
            roleName: role.name,
          },
        },
      });
    }

    return { success: true };
  }

  /**
   * Get all roles for tenant (including system roles)
   */
  async getRoles(tenantId: string) {
    const roles = await this.prisma.role.findMany({
      where: {
        OR: [
          { tenantId },
          { isSystem: true, tenantId: null },
        ],
        isActive: true,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: [
        { isSystem: 'desc' },
        { name: 'asc' },
      ],
    });

    return roles;
  }

  /**
   * Get all available permissions
   */
  async getPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [
        { resource: 'asc' },
        { action: 'asc' },
      ],
    });
  }

  /**
   * Get permissions grouped by resource
   */
  async getPermissionsGrouped() {
    const permissions = await this.getPermissions();

    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.resource]) {
        acc[perm.resource] = [];
      }
      acc[perm.resource].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return grouped;
  }
}
