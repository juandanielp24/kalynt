import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LocationInventoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get inventory for a location
   */
  async getLocationInventory(
    locationId: string,
    tenantId: string,
    options?: {
      productId?: string;
      lowStock?: boolean;
      search?: string;
    },
  ) {
    const where: any = {
      locationId,
      location: {
        tenantId,
      },
    };

    if (options?.productId) {
      where.productId = options.productId;
    }

    if (options?.search) {
      where.product = {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { sku: { contains: options.search, mode: 'insensitive' } },
        ],
      };
    }

    let inventory = await this.prisma.locationInventory.findMany({
      where,
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        product: {
          name: 'asc',
        },
      },
    });

    // Filter low stock items in memory since Prisma doesn't support comparing fields
    if (options?.lowStock) {
      inventory = inventory.filter(
        (item) =>
          item.reorderPoint !== null &&
          item.quantity <= (item.reorderPoint || 0),
      );
    }

    return inventory;
  }

  /**
   * Get inventory for a specific product across all locations
   */
  async getProductInventoryAcrossLocations(
    productId: string,
    tenantId: string,
  ) {
    const inventory = await this.prisma.locationInventory.findMany({
      where: {
        productId,
        location: {
          tenantId,
        },
      },
      include: {
        location: true,
      },
      orderBy: {
        location: {
          name: 'asc',
        },
      },
    });

    return inventory;
  }

  /**
   * Update inventory for a location
   */
  async updateInventory(
    locationId: string,
    tenantId: string,
    productId: string,
    data: {
      quantity?: number;
      reservedQuantity?: number;
      reorderPoint?: number;
      reorderQuantity?: number;
      aisle?: string;
      shelf?: string;
      bin?: string;
    },
  ) {
    // Verify location exists and belongs to tenant
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, tenantId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    // Calculate available
    const quantity = data.quantity ?? 0;
    const reservedQuantity = data.reservedQuantity ?? 0;
    const availableQuantity = quantity - reservedQuantity;

    const inventory = await this.prisma.locationInventory.upsert({
      where: {
        tenantId_locationId_productId: {
          tenantId,
          locationId,
          productId,
        },
      },
      create: {
        tenantId,
        locationId,
        productId,
        quantity,
        reservedQuantity,
        availableQuantity,
        reorderPoint: data.reorderPoint,
        reorderQuantity: data.reorderQuantity,
        aisle: data.aisle,
        shelf: data.shelf,
        bin: data.bin,
      },
      update: {
        ...data,
        availableQuantity,
        updatedAt: new Date(),
      },
      include: {
        product: true,
      },
    });

    return inventory;
  }

  /**
   * Adjust inventory quantity
   */
  async adjustInventory(
    locationId: string,
    tenantId: string,
    productId: string,
    adjustment: number,
    reason: string,
  ) {
    const inventory = await this.prisma.locationInventory.findFirst({
      where: {
        locationId,
        productId,
        location: {
          tenantId,
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    const newQuantity = inventory.quantity + adjustment;

    if (newQuantity < 0) {
      throw new BadRequestException(
        'Adjustment would result in negative inventory',
      );
    }

    const updated = await this.prisma.locationInventory.update({
      where: { id: inventory.id },
      data: {
        quantity: newQuantity,
        availableQuantity: newQuantity - inventory.reservedQuantity,
      },
      include: {
        product: true,
      },
    });

    // TODO: Log the adjustment in StockMovement table

    return updated;
  }

  /**
   * Reserve inventory
   */
  async reserveInventory(
    locationId: string,
    tenantId: string,
    productId: string,
    quantity: number,
  ) {
    const inventory = await this.prisma.locationInventory.findFirst({
      where: {
        locationId,
        productId,
        location: {
          tenantId,
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    if (inventory.availableQuantity < quantity) {
      throw new BadRequestException('Insufficient available inventory');
    }

    const updated = await this.prisma.locationInventory.update({
      where: { id: inventory.id },
      data: {
        reservedQuantity: inventory.reservedQuantity + quantity,
        availableQuantity: inventory.availableQuantity - quantity,
      },
    });

    return updated;
  }

  /**
   * Release reserved inventory
   */
  async releaseInventory(
    locationId: string,
    tenantId: string,
    productId: string,
    quantity: number,
  ) {
    const inventory = await this.prisma.locationInventory.findFirst({
      where: {
        locationId,
        productId,
        location: {
          tenantId,
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    const updated = await this.prisma.locationInventory.update({
      where: { id: inventory.id },
      data: {
        reservedQuantity: Math.max(0, inventory.reservedQuantity - quantity),
        availableQuantity: Math.min(
          inventory.quantity,
          inventory.availableQuantity + quantity,
        ),
      },
    });

    return updated;
  }

  /**
   * Get low stock items across all locations
   */
  async getLowStockItems(tenantId: string) {
    const locations = await this.prisma.location.findMany({
      where: { tenantId, isActive: true },
    });

    const lowStockItems = [];

    for (const location of locations) {
      const items = await this.prisma.locationInventory.findMany({
        where: {
          locationId: location.id,
          reorderPoint: { not: null },
        },
        include: {
          product: true,
        },
      });

      for (const item of items) {
        if (item.quantity <= (item.reorderPoint || 0)) {
          lowStockItems.push({
            ...item,
            location,
          });
        }
      }
    }

    return lowStockItems;
  }

  /**
   * Sync product to location (add to inventory)
   */
  async syncProductToLocation(
    locationId: string,
    tenantId: string,
    productId: string,
    initialQuantity: number = 0,
  ) {
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, tenantId },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const inventory = await this.prisma.locationInventory.upsert({
      where: {
        tenantId_locationId_productId: {
          tenantId,
          locationId,
          productId,
        },
      },
      create: {
        tenantId,
        locationId,
        productId,
        quantity: initialQuantity,
        reservedQuantity: 0,
        availableQuantity: initialQuantity,
      },
      update: {},
      include: {
        product: true,
      },
    });

    return inventory;
  }

  /**
   * Get inventory valuation for location
   */
  async getInventoryValuation(locationId: string, tenantId: string) {
    const inventory = await this.prisma.locationInventory.findMany({
      where: {
        locationId,
        location: {
          tenantId,
        },
      },
      include: {
        product: true,
      },
    });

    let totalValue = 0;
    let totalUnits = 0;

    const items = inventory.map((item) => {
      const costCents = item.product.costCents || 0;
      const cost = costCents / 100;
      const value = cost * item.quantity;
      totalValue += value;
      totalUnits += item.quantity;

      return {
        productId: item.productId,
        productName: item.product.name,
        quantity: item.quantity,
        cost,
        value,
      };
    });

    return {
      totalValue,
      totalUnits,
      items,
    };
  }

  /**
   * Count inventory (physical count)
   */
  async countInventory(
    locationId: string,
    tenantId: string,
    productId: string,
    countedQuantity: number,
  ) {
    const inventory = await this.prisma.locationInventory.findFirst({
      where: {
        locationId,
        productId,
        location: {
          tenantId,
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    const updated = await this.prisma.locationInventory.update({
      where: { id: inventory.id },
      data: {
        lastCountDate: new Date(),
        lastCountQuantity: countedQuantity,
      },
      include: {
        product: true,
      },
    });

    return updated;
  }
}
