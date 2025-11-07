import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import { LocationType, LocationStatus } from '@prisma/client';

@Injectable()
export class LocationsService {
  constructor(@Inject('PRISMA') private readonly prisma: PrismaClient) {}

  /**
   * Get all locations with optional filters
   */
  async getLocations(
    tenantId: string,
    options?: {
      type?: LocationType;
      status?: LocationStatus;
      franchiseId?: string;
      parentId?: string;
      isActive?: boolean;
    },
  ) {
    const locations = await this.prisma.location.findMany({
      where: {
        tenantId,
        ...(options?.type && { type: options.type }),
        ...(options?.status && { status: options.status }),
        ...(options?.franchiseId && { franchiseId: options.franchiseId }),
        ...(options?.parentId && { parentId: options.parentId }),
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
      },
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
        franchise: {
          select: { id: true, name: true, code: true },
        },
        parent: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            stock: true,
            inventory: true,
            sales: true,
            userLocations: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return locations;
  }

  /**
   * Get a single location by ID
   */
  async getLocation(id: string, tenantId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id, tenantId },
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
        franchise: {
          select: { id: true, name: true, code: true, royaltyPercentage: true },
        },
        parent: {
          select: { id: true, name: true, code: true, type: true },
        },
        children: {
          select: { id: true, name: true, code: true, type: true },
        },
        userLocations: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        _count: {
          select: {
            stock: true,
            inventory: true,
            sales: true,
            transfersFrom: true,
            transfersTo: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return location;
  }

  /**
   * Create a new location
   */
  async createLocation(
    tenantId: string,
    data: {
      name: string;
      code: string;
      type: LocationType;
      status?: LocationStatus;
      managerId?: string;
      franchiseId?: string;
      parentId?: string;
      address?: string;
      city?: string;
      province?: string;
      country?: string;
      postalCode?: string;
      latitude?: number;
      longitude?: number;
      phone?: string;
      email?: string;
      isWarehouse?: boolean;
      openingHours?: any;
      maxCapacity?: number;
      squareMeters?: number;
      isActive?: boolean;
    },
  ) {
    // Validate code uniqueness
    const existing = await this.prisma.location.findFirst({
      where: { tenantId, code: data.code },
    });

    if (existing) {
      throw new BadRequestException(`Location with code ${data.code} already exists`);
    }

    // Validate manager exists
    if (data.managerId) {
      const manager = await this.prisma.user.findFirst({
        where: { id: data.managerId, tenantId },
      });

      if (!manager) {
        throw new NotFoundException(`Manager with ID ${data.managerId} not found`);
      }
    }

    // Validate franchise exists
    if (data.franchiseId) {
      const franchise = await this.prisma.franchise.findFirst({
        where: { id: data.franchiseId, tenantId },
      });

      if (!franchise) {
        throw new NotFoundException(`Franchise with ID ${data.franchiseId} not found`);
      }
    }

    // Validate parent exists
    if (data.parentId) {
      const parent = await this.prisma.location.findFirst({
        where: { id: data.parentId, tenantId },
      });

      if (!parent) {
        throw new NotFoundException(`Parent location with ID ${data.parentId} not found`);
      }
    }

    const location = await this.prisma.location.create({
      data: {
        ...data,
        tenantId,
        latitude: data.latitude ? data.latitude.toString() : undefined,
        longitude: data.longitude ? data.longitude.toString() : undefined,
        squareMeters: data.squareMeters ? data.squareMeters.toString() : undefined,
      },
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
        franchise: {
          select: { id: true, name: true, code: true },
        },
        parent: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return location;
  }

  /**
   * Update a location
   */
  async updateLocation(
    id: string,
    tenantId: string,
    data: {
      name?: string;
      code?: string;
      type?: LocationType;
      status?: LocationStatus;
      managerId?: string;
      franchiseId?: string;
      parentId?: string;
      address?: string;
      city?: string;
      province?: string;
      country?: string;
      postalCode?: string;
      latitude?: number;
      longitude?: number;
      phone?: string;
      email?: string;
      isWarehouse?: boolean;
      openingHours?: any;
      maxCapacity?: number;
      squareMeters?: number;
      isActive?: boolean;
    },
  ) {
    // Check if location exists
    const location = await this.prisma.location.findFirst({
      where: { id, tenantId },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    // Validate code uniqueness if changing
    if (data.code && data.code !== location.code) {
      const existing = await this.prisma.location.findFirst({
        where: { tenantId, code: data.code, id: { not: id } },
      });

      if (existing) {
        throw new BadRequestException(`Location with code ${data.code} already exists`);
      }
    }

    // Validate manager exists
    if (data.managerId) {
      const manager = await this.prisma.user.findFirst({
        where: { id: data.managerId, tenantId },
      });

      if (!manager) {
        throw new NotFoundException(`Manager with ID ${data.managerId} not found`);
      }
    }

    // Validate franchise exists
    if (data.franchiseId) {
      const franchise = await this.prisma.franchise.findFirst({
        where: { id: data.franchiseId, tenantId },
      });

      if (!franchise) {
        throw new NotFoundException(`Franchise with ID ${data.franchiseId} not found`);
      }
    }

    // Validate parent exists and prevent circular reference
    if (data.parentId) {
      if (data.parentId === id) {
        throw new BadRequestException('Location cannot be its own parent');
      }

      const parent = await this.prisma.location.findFirst({
        where: { id: data.parentId, tenantId },
      });

      if (!parent) {
        throw new NotFoundException(`Parent location with ID ${data.parentId} not found`);
      }

      // Check for circular reference
      let currentParent: typeof parent | null = parent;
      while (currentParent?.parentId) {
        if (currentParent.parentId === id) {
          throw new BadRequestException('Circular parent reference detected');
        }
        currentParent = await this.prisma.location.findUnique({
          where: { id: currentParent.parentId },
        });
        if (!currentParent) break;
      }
    }

    const updated = await this.prisma.location.update({
      where: { id },
      data: {
        ...data,
        latitude: data.latitude ? data.latitude.toString() : undefined,
        longitude: data.longitude ? data.longitude.toString() : undefined,
        squareMeters: data.squareMeters ? data.squareMeters.toString() : undefined,
      },
      include: {
        manager: {
          select: { id: true, name: true, email: true },
        },
        franchise: {
          select: { id: true, name: true, code: true },
        },
        parent: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return updated;
  }

  /**
   * Delete a location
   */
  async deleteLocation(id: string, tenantId: string) {
    // Check if location exists
    const location = await this.prisma.location.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            stock: true,
            inventory: true,
            sales: true,
            children: true,
          },
        },
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    // Prevent deletion if location has children
    if (location._count.children > 0) {
      throw new BadRequestException(
        'Cannot delete location with child locations. Remove or reassign child locations first.',
      );
    }

    // Prevent deletion if location has inventory or sales
    if (location._count.stock > 0 || location._count.inventory > 0) {
      throw new BadRequestException(
        'Cannot delete location with existing inventory. Transfer or remove inventory first.',
      );
    }

    if (location._count.sales > 0) {
      // Soft delete if there are sales
      await this.prisma.location.update({
        where: { id },
        data: { isActive: false, deletedAt: new Date() },
      });

      return { message: 'Location soft deleted successfully', deleted: true };
    }

    // Hard delete if no sales
    await this.prisma.location.delete({
      where: { id },
    });

    return { message: 'Location deleted successfully', deleted: true };
  }

  /**
   * Change location status
   */
  async changeStatus(id: string, tenantId: string, status: LocationStatus) {
    const location = await this.prisma.location.findFirst({
      where: { id, tenantId },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    const updated = await this.prisma.location.update({
      where: { id },
      data: { status },
    });

    return updated;
  }

  /**
   * Assign a user to a location
   */
  async assignUser(
    locationId: string,
    tenantId: string,
    userId: string,
    isManager: boolean = false,
  ) {
    // Validate location
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, tenantId },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${locationId} not found`);
    }

    // Validate user
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if assignment already exists
    const existing = await this.prisma.userLocation.findFirst({
      where: { locationId, userId, tenantId },
    });

    if (existing) {
      throw new BadRequestException('User is already assigned to this location');
    }

    // Create assignment
    const assignment = await this.prisma.userLocation.create({
      data: {
        tenantId,
        locationId,
        userId,
        isDefault: false, // Use isDefault instead of isPrimary
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        location: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // If isManager, also update the location's managerId
    if (isManager) {
      await this.prisma.location.update({
        where: { id: locationId },
        data: { managerId: userId },
      });
    }

    return assignment;
  }

  /**
   * Remove user from location
   */
  async removeUser(locationId: string, tenantId: string, userId: string) {
    const assignment = await this.prisma.userLocation.findFirst({
      where: { locationId, userId, tenantId },
    });

    if (!assignment) {
      throw new NotFoundException('User assignment not found');
    }

    await this.prisma.userLocation.delete({
      where: { id: assignment.id },
    });

    // If user was manager, remove from location
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, tenantId, managerId: userId },
    });

    if (location) {
      await this.prisma.location.update({
        where: { id: locationId },
        data: { managerId: null },
      });
    }

    return { message: 'User removed from location successfully' };
  }

  /**
   * Get location statistics
   */
  async getStatistics(id: string, tenantId: string) {
    const location = await this.prisma.location.findFirst({
      where: { id, tenantId },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    // Get inventory count
    const inventoryCount = await this.prisma.locationInventory.count({
      where: { locationId: id, tenantId },
    });

    // Get total inventory value (using Stock as fallback since LocationInventory may be empty)
    const inventoryValue = await this.prisma.stock.aggregate({
      where: { locationId: id, tenantId },
      _sum: { quantity: true },
    });

    // Get sales statistics
    const salesStats = await this.prisma.sale.aggregate({
      where: { locationId: id, tenantId },
      _sum: { totalCents: true },
      _count: true,
    });

    // Get stock transfers
    const transfersFrom = await this.prisma.stockTransfer.count({
      where: { fromLocationId: id, tenantId },
    });

    const transfersTo = await this.prisma.stockTransfer.count({
      where: { toLocationId: id, tenantId },
    });

    // Get assigned users
    const assignedUsers = await this.prisma.userLocation.count({
      where: { locationId: id, tenantId },
    });

    return {
      location: {
        id: location.id,
        name: location.name,
        code: location.code,
        type: location.type,
        status: location.status,
      },
      inventory: {
        uniqueProducts: inventoryCount,
        totalUnits: inventoryValue._sum.quantity || 0,
      },
      sales: {
        totalSales: salesStats._count || 0,
        totalRevenue: (salesStats._sum.totalCents || 0) / 100,
      },
      transfers: {
        outgoing: transfersFrom,
        incoming: transfersTo,
        total: transfersFrom + transfersTo,
      },
      users: {
        assigned: assignedUsers,
      },
    };
  }

  /**
   * Get locations for a specific user
   */
  async getUserLocations(userId: string, tenantId: string) {
    const assignments = await this.prisma.userLocation.findMany({
      where: { userId, tenantId },
      include: {
        location: {
          include: {
            manager: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: {
                stock: true,
                sales: true,
              },
            },
          },
        },
      },
      orderBy: {
        isDefault: 'desc', // Primary locations first
      },
    });

    return assignments.map((a) => ({
      ...a.location,
      isPrimary: a.isDefault,
      assignedAt: a.createdAt,
    }));
  }
}
