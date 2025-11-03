import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@retail/database';

export enum StockMovementType {
  SALE = 'sale',
  PURCHASE = 'purchase',
  ADJUSTMENT = 'adjustment',
  TRANSFER = 'transfer',
  RETURN = 'return',
}

@Injectable()
export class InventoryService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Ajuste manual de stock
   */
  async adjustStock(
    tenantId: string,
    productId: string,
    locationId: string,
    quantity: number,
    reason: string,
    userId: string
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // Obtener stock actual
      const stock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId,
            locationId,
          },
        },
      });

      if (!stock) {
        throw new BadRequestException('Stock record not found');
      }

      const newQuantity = stock.quantity + quantity;

      if (newQuantity < 0) {
        throw new BadRequestException('Resulting stock cannot be negative');
      }

      // Actualizar stock
      const updatedStock = await tx.stock.update({
        where: {
          productId_locationId: {
            productId,
            locationId,
          },
        },
        data: {
          quantity: newQuantity,
        },
      });

      // Registrar movimiento en audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'stock_adjustment',
          entity: 'stock',
          entityId: stock.id,
          changes: {
            productId,
            locationId,
            previousQuantity: stock.quantity,
            newQuantity,
            adjustment: quantity,
            reason,
          },
        },
      });

      return updatedStock;
    });
  }

  /**
   * Transferir stock entre ubicaciones
   */
  async transferStock(
    tenantId: string,
    productId: string,
    fromLocationId: string,
    toLocationId: string,
    quantity: number,
    userId: string
  ) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be positive');
    }

    if (fromLocationId === toLocationId) {
      throw new BadRequestException('Source and destination locations must be different');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Verificar stock origen
      const fromStock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId,
            locationId: fromLocationId,
          },
        },
      });

      if (!fromStock || fromStock.quantity < quantity) {
        throw new BadRequestException('Insufficient stock in source location');
      }

      // Decrementar origen
      await tx.stock.update({
        where: {
          productId_locationId: {
            productId,
            locationId: fromLocationId,
          },
        },
        data: {
          quantity: {
            decrement: quantity,
          },
        },
      });

      // Incrementar destino (o crear si no existe)
      await tx.stock.upsert({
        where: {
          productId_locationId: {
            productId,
            locationId: toLocationId,
          },
        },
        create: {
          tenantId,
          productId,
          locationId: toLocationId,
          quantity,
          minQuantity: 0,
        },
        update: {
          quantity: {
            increment: quantity,
          },
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'stock_transfer',
          entity: 'stock',
          entityId: productId,
          changes: {
            productId,
            fromLocationId,
            toLocationId,
            quantity,
          },
        },
      });

      return { success: true, quantity, fromLocationId, toLocationId };
    });
  }

  /**
   * Obtener movimientos de stock
   */
  async getStockMovements(
    tenantId: string,
    productId?: string,
    locationId?: string,
    dateFrom?: Date,
    dateTo?: Date
  ) {
    const where: any = {
      tenantId,
      entity: 'stock',
    };

    if (productId) {
      where.entityId = productId;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = dateFrom;
      if (dateTo) where.createdAt.lte = dateTo;
    }

    return await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Verificar productos con stock bajo
   */
  async getLowStockProducts(tenantId: string, locationId?: string) {
    const where: any = {
      tenantId,
      deletedAt: null,
      trackStock: true,
    };

    const products = await this.prisma.product.findMany({
      where,
      include: {
        stock: {
          where: locationId ? { locationId } : undefined,
          include: {
            location: true,
          },
        },
      },
    });

    // Filtrar productos con stock bajo
    const lowStock = products.filter((product) =>
      product.stock.some((s) => s.quantity <= s.minQuantity)
    );

    return lowStock.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock: product.stock.map((s) => ({
        locationId: s.locationId,
        locationName: s.location.name,
        currentStock: s.quantity,
        minStock: s.minQuantity,
        deficit: s.minQuantity - s.quantity,
      })),
    }));
  }

  /**
   * Obtener resumen de inventario por ubicación
   */
  async getInventorySummary(tenantId: string, locationId?: string) {
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    const products = await this.prisma.product.findMany({
      where,
      include: {
        stock: {
          where: locationId ? { locationId } : undefined,
          include: {
            location: true,
          },
        },
      },
    });

    const summary = {
      totalProducts: products.length,
      totalStockValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      byLocation: {} as Record<string, any>,
    };

    products.forEach((product) => {
      product.stock.forEach((stock) => {
        const locationName = stock.location.name;

        if (!summary.byLocation[locationName]) {
          summary.byLocation[locationName] = {
            locationId: stock.locationId,
            totalItems: 0,
            totalQuantity: 0,
            totalValue: 0,
            lowStockCount: 0,
            outOfStockCount: 0,
          };
        }

        const loc = summary.byLocation[locationName];
        loc.totalItems++;
        loc.totalQuantity += stock.quantity;
        loc.totalValue += (product.costCents / 100) * stock.quantity;

        if (stock.quantity === 0) {
          loc.outOfStockCount++;
          summary.outOfStockCount++;
        } else if (stock.quantity <= stock.minQuantity) {
          loc.lowStockCount++;
          summary.lowStockCount++;
        }

        summary.totalStockValue += (product.costCents / 100) * stock.quantity;
      });
    });

    return summary;
  }
}
