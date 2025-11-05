import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, LocationType } from '@retail/database';

interface GetLocationsParams {
  includeInactive?: boolean;
  type?: LocationType;
}

interface CreateLocationDto {
  name: string;
  code: string;
  type?: LocationType;
  managerId?: string;
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
}

interface UpdateLocationDto {
  name?: string;
  code?: string;
  type?: LocationType;
  managerId?: string;
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
  isActive?: boolean;
}

@Injectable()
export class LocationsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get all locations with optional filters
   */
  async getLocations(tenantId: string, params?: GetLocationsParams) {
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    // Filter by active status
    if (!params?.includeInactive) {
      where.isActive = true;
    }

    // Filter by type
    if (params?.type) {
      where.type = params.type;
    }

    const locations = await this.prisma.location.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            stock: true,
            sales: true,
            userLocations: true,
            transfersFrom: true,
            transfersTo: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
    });

    return locations;
  }

  /**
   * Get a single location by ID
   */
  async getLocation(id: string, tenantId: string) {
    const location = await this.prisma.location.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            stock: true,
            sales: true,
            userLocations: true,
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
  async createLocation(tenantId: string, dto: CreateLocationDto) {
    // Verify code is unique
    const existing = await this.prisma.location.findFirst({
      where: {
        tenantId,
        code: dto.code,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException(`Location with code ${dto.code} already exists`);
    }

    // Verify manager exists if provided
    if (dto.managerId) {
      const manager = await this.prisma.user.findFirst({
        where: {
          id: dto.managerId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!manager) {
        throw new NotFoundException(`Manager with ID ${dto.managerId} not found`);
      }
    }

    const location = await this.prisma.location.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        type: dto.type || LocationType.STORE,
        managerId: dto.managerId,
        address: dto.address,
        city: dto.city,
        province: dto.province,
        country: dto.country || 'AR',
        postalCode: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        phone: dto.phone,
        email: dto.email,
        isWarehouse: dto.isWarehouse || false,
        openingHours: dto.openingHours,
        maxCapacity: dto.maxCapacity,
        isActive: true,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return location;
  }

  /**
   * Update a location
   */
  async updateLocation(id: string, tenantId: string, dto: UpdateLocationDto) {
    // Verify location exists
    const location = await this.prisma.location.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    // If updating code, verify it's unique
    if (dto.code && dto.code !== location.code) {
      const existing = await this.prisma.location.findFirst({
        where: {
          tenantId,
          code: dto.code,
          deletedAt: null,
          id: { not: id },
        },
      });

      if (existing) {
        throw new BadRequestException(`Location with code ${dto.code} already exists`);
      }
    }

    // If updating manager, verify they exist
    if (dto.managerId) {
      const manager = await this.prisma.user.findFirst({
        where: {
          id: dto.managerId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!manager) {
        throw new NotFoundException(`Manager with ID ${dto.managerId} not found`);
      }
    }

    const updated = await this.prisma.location.update({
      where: { id },
      data: {
        ...dto,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updated;
  }

  /**
   * Soft delete a location
   */
  async deleteLocation(id: string, tenantId: string) {
    // Verify location exists
    const location = await this.prisma.location.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    // Check if location has active stock
    const stockCount = await this.prisma.stock.count({
      where: {
        locationId: id,
        quantity: { gt: 0 },
      },
    });

    if (stockCount > 0) {
      throw new BadRequestException(
        `Cannot delete location with active stock. Please transfer all stock before deleting.`
      );
    }

    // Check if location has pending transfers
    const pendingTransfersCount = await this.prisma.stockTransfer.count({
      where: {
        OR: [
          { fromLocationId: id },
          { toLocationId: id },
        ],
        status: {
          in: ['PENDING', 'APPROVED', 'IN_TRANSIT'],
        },
      },
    });

    if (pendingTransfersCount > 0) {
      throw new BadRequestException(
        `Cannot delete location with pending transfers. Please complete or cancel all transfers first.`
      );
    }

    // Soft delete
    await this.prisma.location.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return { message: 'Location deleted successfully' };
  }

  /**
   * Get stock summary for a location
   */
  async getLocationStockSummary(id: string, tenantId: string) {
    // Verify location exists
    const location = await this.getLocation(id, tenantId);

    // Get all stock for this location
    const stock = await this.prisma.stock.findMany({
      where: {
        locationId: id,
        tenantId,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            priceCents: true,
          },
        },
      },
    });

    // Calculate metrics
    const totalUnits = stock.reduce((sum, s) => sum + s.quantity, 0);
    const totalProducts = stock.length;
    const lowStock = stock.filter(s => s.quantity > 0 && s.quantity <= s.minQuantity).length;
    const outOfStock = stock.filter(s => s.quantity === 0).length;
    const inStock = stock.filter(s => s.quantity > 0).length;

    // Calculate total value (in cents)
    const totalValueCents = stock.reduce((sum, s) => {
      return sum + (s.quantity * s.product.priceCents);
    }, 0);

    return {
      location: {
        id: location.id,
        name: location.name,
        code: location.code,
        type: location.type,
      },
      summary: {
        totalProducts,
        totalUnits,
        inStock,
        lowStock,
        outOfStock,
        totalValueCents,
      },
      stock: stock.map(s => ({
        productId: s.product.id,
        productName: s.product.name,
        productSku: s.product.sku,
        quantity: s.quantity,
        minQuantity: s.minQuantity,
        maxQuantity: s.maxQuantity,
        status: s.quantity === 0 ? 'out_of_stock' : s.quantity <= s.minQuantity ? 'low_stock' : 'in_stock',
      })),
    };
  }

  /**
   * Assign a user to multiple locations
   */
  async assignUserToLocations(
    userId: string,
    tenantId: string,
    locationIds: string[],
    defaultLocationId?: string
  ) {
    // Verify user exists
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Verify all locations exist
    const locations = await this.prisma.location.findMany({
      where: {
        id: { in: locationIds },
        tenantId,
        deletedAt: null,
        isActive: true,
      },
    });

    if (locations.length !== locationIds.length) {
      throw new BadRequestException('One or more location IDs are invalid');
    }

    // If defaultLocationId provided, verify it's in the list
    if (defaultLocationId && !locationIds.includes(defaultLocationId)) {
      throw new BadRequestException('Default location must be in the list of assigned locations');
    }

    // Remove existing assignments
    await this.prisma.userLocation.deleteMany({
      where: {
        userId,
        tenantId,
      },
    });

    // Create new assignments
    const userLocations = await Promise.all(
      locationIds.map(locationId =>
        this.prisma.userLocation.create({
          data: {
            userId,
            tenantId,
            locationId,
            isDefault: locationId === defaultLocationId,
          },
          include: {
            location: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
              },
            },
          },
        })
      )
    );

    return userLocations;
  }

  /**
   * Get all locations assigned to a user
   */
  async getUserLocations(userId: string, tenantId: string) {
    const userLocations = await this.prisma.userLocation.findMany({
      where: {
        userId,
        tenantId,
      },
      include: {
        location: {
          include: {
            manager: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { location: { name: 'asc' } },
      ],
    });

    return userLocations;
  }

  /**
   * Set the default location for a user
   */
  async setDefaultLocation(userId: string, tenantId: string, locationId: string) {
    // Verify the user-location assignment exists
    const userLocation = await this.prisma.userLocation.findFirst({
      where: {
        userId,
        tenantId,
        locationId,
      },
    });

    if (!userLocation) {
      throw new NotFoundException(
        `User is not assigned to location with ID ${locationId}. Please assign the user to the location first.`
      );
    }

    // Remove default flag from all user's locations
    await this.prisma.userLocation.updateMany({
      where: {
        userId,
        tenantId,
      },
      data: {
        isDefault: false,
      },
    });

    // Set the new default location
    const updated = await this.prisma.userLocation.update({
      where: {
        id: userLocation.id,
      },
      data: {
        isDefault: true,
      },
      include: {
        location: {
          select: {
            id: true,
            name: true,
            code: true,
            type: true,
          },
        },
      },
    });

    return updated;
  }
}
