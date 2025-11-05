import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DeliveryZonesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all delivery zones for a tenant
   */
  async getZones(tenantId: string, isActive?: boolean) {
    const where: Prisma.DeliveryZoneWhereInput = {
      tenantId,
      ...(isActive !== undefined && { isActive }),
    };

    return this.prisma.deliveryZone.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Get a single delivery zone by ID
   */
  async getZone(tenantId: string, zoneId: string) {
    const zone = await this.prisma.deliveryZone.findFirst({
      where: {
        id: zoneId,
        tenantId,
      },
      include: {
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    });

    if (!zone) {
      throw new NotFoundException(`Delivery zone ${zoneId} not found`);
    }

    return zone;
  }

  /**
   * Create a new delivery zone
   */
  async createZone(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      postalCodes?: string[];
      neighborhoods?: string[];
      baseCost?: number;
      costPerKm?: number;
      freeDeliveryMin?: number;
      estimatedMinutes?: number;
      maxDeliveryTime?: number;
      isActive?: boolean;
      priority?: number;
    },
  ) {
    return this.prisma.deliveryZone.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        postalCodes: data.postalCodes || [],
        neighborhoods: data.neighborhoods || [],
        baseCost: data.baseCost || 0,
        costPerKm: data.costPerKm || 0,
        freeDeliveryMin: data.freeDeliveryMin,
        estimatedMinutes: data.estimatedMinutes || 60,
        maxDeliveryTime: data.maxDeliveryTime || 120,
        isActive: data.isActive !== undefined ? data.isActive : true,
        priority: data.priority || 0,
      },
    });
  }

  /**
   * Update a delivery zone
   */
  async updateZone(
    tenantId: string,
    zoneId: string,
    data: {
      name?: string;
      description?: string;
      postalCodes?: string[];
      neighborhoods?: string[];
      baseCost?: number;
      costPerKm?: number;
      freeDeliveryMin?: number;
      estimatedMinutes?: number;
      maxDeliveryTime?: number;
      isActive?: boolean;
      priority?: number;
    },
  ) {
    // Verify zone exists
    await this.getZone(tenantId, zoneId);

    return this.prisma.deliveryZone.update({
      where: {
        id: zoneId,
      },
      data,
    });
  }

  /**
   * Delete a delivery zone
   */
  async deleteZone(tenantId: string, zoneId: string) {
    // Verify zone exists
    const zone = await this.getZone(tenantId, zoneId);

    // Check if zone has active deliveries
    const activeDeliveries = await this.prisma.delivery.count({
      where: {
        zoneId,
        status: {
          in: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'],
        },
      },
    });

    if (activeDeliveries > 0) {
      throw new BadRequestException(
        `Cannot delete zone with ${activeDeliveries} active deliveries`,
      );
    }

    return this.prisma.deliveryZone.delete({
      where: {
        id: zoneId,
      },
    });
  }

  /**
   * Find zone by postal code
   */
  async findZoneByPostalCode(tenantId: string, postalCode: string) {
    const zones = await this.prisma.deliveryZone.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });

    // Find zone that includes this postal code
    for (const zone of zones) {
      const postalCodes = (zone.postalCodes as string[]) || [];
      if (postalCodes.includes(postalCode)) {
        return zone;
      }
    }

    return null;
  }

  /**
   * Find zone by neighborhood
   */
  async findZoneByNeighborhood(tenantId: string, neighborhood: string) {
    const zones = await this.prisma.deliveryZone.findMany({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });

    // Find zone that includes this neighborhood (case-insensitive)
    const normalizedNeighborhood = neighborhood.toLowerCase();

    for (const zone of zones) {
      const neighborhoods = (zone.neighborhoods as string[]) || [];
      const match = neighborhoods.find(
        (n) => n.toLowerCase() === normalizedNeighborhood,
      );
      if (match) {
        return zone;
      }
    }

    return null;
  }

  /**
   * Calculate delivery cost for a zone
   */
  async calculateDeliveryCost(
    tenantId: string,
    zoneId: string,
    orderTotal: number,
    distance?: number,
  ): Promise<number> {
    const zone = await this.getZone(tenantId, zoneId);

    // Check for free delivery
    if (
      zone.freeDeliveryMin !== null &&
      orderTotal >= zone.freeDeliveryMin
    ) {
      return 0;
    }

    // Calculate cost
    let cost = zone.baseCost;

    if (distance && zone.costPerKm > 0) {
      cost += distance * zone.costPerKm;
    }

    return Math.max(0, cost); // Ensure non-negative
  }

  /**
   * Find best zone for an address (by postal code or neighborhood)
   */
  async findBestZone(
    tenantId: string,
    postalCode?: string,
    neighborhood?: string,
  ) {
    // Try postal code first (more specific)
    if (postalCode) {
      const zoneByPostal = await this.findZoneByPostalCode(tenantId, postalCode);
      if (zoneByPostal) {
        return zoneByPostal;
      }
    }

    // Try neighborhood
    if (neighborhood) {
      const zoneByNeighborhood = await this.findZoneByNeighborhood(
        tenantId,
        neighborhood,
      );
      if (zoneByNeighborhood) {
        return zoneByNeighborhood;
      }
    }

    // Return default zone (highest priority active zone)
    const defaultZone = await this.prisma.deliveryZone.findFirst({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: { priority: 'desc' },
    });

    return defaultZone;
  }
}
