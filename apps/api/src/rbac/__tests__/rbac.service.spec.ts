import { Test, TestingModule } from '@nestjs/testing';
import { RBACService } from '../rbac.service';
import { PrismaClient, PermissionResource, PermissionAction } from '@prisma/client';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('RBACService', () => {
  let service: RBACService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RBACService,
        {
          provide: 'PRISMA',
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            role: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              count: jest.fn(),
            },
            permission: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
            },
            rolePermission: {
              createMany: jest.fn(),
              deleteMany: jest.fn(),
              upsert: jest.fn(),
            },
            auditLog: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<RBACService>(RBACService);
    prisma = module.get('PRISMA');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hasPermission', () => {
    it('should return true for user with specific permission', async () => {
      const mockUser = {
        id: 'user-1',
        tenantId: 'tenant-1',
        isActive: true,
        rbacRole: {
          permissions: [
            {
              permission: {
                resource: PermissionResource.PRODUCTS,
                action: PermissionAction.CREATE,
              },
              granted: true,
            },
          ],
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.hasPermission({
        userId: 'user-1',
        resource: PermissionResource.PRODUCTS,
        action: PermissionAction.CREATE,
      });

      expect(result).toBe(true);
    });

    it('should return true for user with MANAGE permission', async () => {
      const mockUser = {
        id: 'user-1',
        tenantId: 'tenant-1',
        isActive: true,
        rbacRole: {
          permissions: [
            {
              permission: {
                resource: PermissionResource.PRODUCTS,
                action: PermissionAction.MANAGE,
              },
              granted: true,
            },
          ],
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.hasPermission({
        userId: 'user-1',
        resource: PermissionResource.PRODUCTS,
        action: PermissionAction.CREATE,
      });

      expect(result).toBe(true);
    });

    it('should return true for user with ALL:MANAGE permission', async () => {
      const mockUser = {
        id: 'user-1',
        tenantId: 'tenant-1',
        isActive: true,
        rbacRole: {
          permissions: [
            {
              permission: {
                resource: PermissionResource.ALL,
                action: PermissionAction.MANAGE,
              },
              granted: true,
            },
          ],
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.hasPermission({
        userId: 'user-1',
        resource: PermissionResource.PRODUCTS,
        action: PermissionAction.CREATE,
      });

      expect(result).toBe(true);
    });

    it('should return false for user without permission', async () => {
      const mockUser = {
        id: 'user-1',
        tenantId: 'tenant-1',
        isActive: true,
        rbacRole: {
          permissions: [
            {
              permission: {
                resource: PermissionResource.SALES,
                action: PermissionAction.READ,
              },
              granted: true,
            },
          ],
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.hasPermission({
        userId: 'user-1',
        resource: PermissionResource.PRODUCTS,
        action: PermissionAction.CREATE,
      });

      expect(result).toBe(false);
    });

    it('should return false for inactive user', async () => {
      const mockUser = {
        id: 'user-1',
        tenantId: 'tenant-1',
        isActive: false,
        rbacRole: {
          permissions: [],
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.hasPermission({
        userId: 'user-1',
        resource: PermissionResource.PRODUCTS,
        action: PermissionAction.CREATE,
      });

      expect(result).toBe(false);
    });

    it('should return false for user without role', async () => {
      const mockUser = {
        id: 'user-1',
        tenantId: 'tenant-1',
        isActive: true,
        rbacRole: null,
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      const result = await service.hasPermission({
        userId: 'user-1',
        resource: PermissionResource.PRODUCTS,
        action: PermissionAction.CREATE,
      });

      expect(result).toBe(false);
    });
  });

  describe('requirePermission', () => {
    it('should not throw for user with permission', async () => {
      const mockUser = {
        id: 'user-1',
        tenantId: 'tenant-1',
        isActive: true,
        rbacRole: {
          permissions: [
            {
              permission: {
                resource: PermissionResource.PRODUCTS,
                action: PermissionAction.CREATE,
              },
              granted: true,
            },
          ],
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        service.requirePermission({
          userId: 'user-1',
          resource: PermissionResource.PRODUCTS,
          action: PermissionAction.CREATE,
        })
      ).resolves.not.toThrow();
    });

    it('should throw ForbiddenException for user without permission', async () => {
      const mockUser = {
        id: 'user-1',
        tenantId: 'tenant-1',
        isActive: true,
        rbacRole: {
          permissions: [],
        },
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser as any);

      await expect(
        service.requirePermission({
          userId: 'user-1',
          resource: PermissionResource.PRODUCTS,
          action: PermissionAction.CREATE,
        })
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createRole', () => {
    it('should create role with permissions', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'Custom Role',
        tenantId: 'tenant-1',
        isSystem: false,
      };

      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prisma.role, 'create').mockResolvedValue(mockRole as any);
      jest.spyOn(prisma.rolePermission, 'createMany').mockResolvedValue({ count: 5 } as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.createRole({
        name: 'Custom Role',
        tenantId: 'tenant-1',
        permissionIds: ['perm-1', 'perm-2'],
        createdBy: 'user-1',
      });

      expect(prisma.role.create).toHaveBeenCalled();
      expect(prisma.rolePermission.createMany).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(result).toEqual(mockRole);
    });

    it('should throw error if role name exists', async () => {
      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue({} as any);

      await expect(
        service.createRole({
          name: 'Existing Role',
          tenantId: 'tenant-1',
          permissionIds: [],
          createdBy: 'user-1',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteRole', () => {
    it('should delete custom role', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'Custom Role',
        tenantId: 'tenant-1',
        isSystem: false,
      };

      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue(mockRole as any);
      jest.spyOn(prisma.user, 'count').mockResolvedValue(0);
      jest.spyOn(prisma.role, 'delete').mockResolvedValue(mockRole as any);
      jest.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);

      const result = await service.deleteRole('role-1', 'user-1');

      expect(prisma.role.delete).toHaveBeenCalledWith({ where: { id: 'role-1' } });
      expect(result).toEqual(mockRole);
    });

    it('should throw error when deleting system role', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'Owner',
        tenantId: null,
        isSystem: true,
      };

      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue(mockRole as any);

      await expect(service.deleteRole('role-1', 'user-1')).rejects.toThrow(BadRequestException);
    });

    it('should throw error when role has users', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'Custom Role',
        tenantId: 'tenant-1',
        isSystem: false,
      };

      jest.spyOn(prisma.role, 'findUnique').mockResolvedValue(mockRole as any);
      jest.spyOn(prisma.user, 'count').mockResolvedValue(5);

      await expect(service.deleteRole('role-1', 'user-1')).rejects.toThrow(BadRequestException);
    });
  });
});
