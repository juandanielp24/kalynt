import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { TransferStatus } from '@prisma/client';

@Injectable()
export class StockTransfersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Generate unique transfer number
   */
  private async generateTransferNumber(tenantId: string): Promise<string> {
    const lastTransfer = await this.prisma.stockTransfer.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { transferNumber: true },
    });

    let nextNumber = 1;
    if (lastTransfer?.transferNumber) {
      const match = lastTransfer.transferNumber.match(/TRF-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `TRF-${nextNumber.toString().padStart(5, '0')}`;
  }

  /**
   * Create a new stock transfer
   */
  async createTransfer(
    tenantId: string,
    userId: string,
    data: {
      fromLocationId: string;
      toLocationId: string;
      items: Array<{
        productId: string;
        quantityRequested: number;
        notes?: string;
      }>;
      notes?: string;
      internalNotes?: string;
      shippingMethod?: string;
      estimatedArrival?: Date;
    },
  ) {
    // Validate locations exist
    const [fromLocation, toLocation] = await Promise.all([
      this.prisma.location.findFirst({
        where: { id: data.fromLocationId, tenantId },
      }),
      this.prisma.location.findFirst({
        where: { id: data.toLocationId, tenantId },
      }),
    ]);

    if (!fromLocation) {
      throw new NotFoundException('Source location not found');
    }

    if (!toLocation) {
      throw new NotFoundException('Destination location not found');
    }

    if (data.fromLocationId === data.toLocationId) {
      throw new BadRequestException(
        'Source and destination locations must be different',
      );
    }

    // Validate items and get product info
    if (!data.items || data.items.length === 0) {
      throw new BadRequestException('Transfer must have at least one item');
    }

    const products = await this.prisma.product.findMany({
      where: {
        tenantId,
        id: { in: data.items.map((item) => item.productId) },
      },
    });

    if (products.length !== data.items.length) {
      throw new BadRequestException('One or more products not found');
    }

    // Generate transfer number
    const transferNumber = await this.generateTransferNumber(tenantId);

    // Create transfer with items
    const transfer = await this.prisma.stockTransfer.create({
      data: {
        tenantId,
        transferNumber,
        fromLocationId: data.fromLocationId,
        toLocationId: data.toLocationId,
        requestedById: userId,
        status: TransferStatus.PENDING,
        notes: data.notes,
        internalNotes: data.internalNotes,
        shippingMethod: data.shippingMethod,
        estimatedArrival: data.estimatedArrival,
        items: {
          create: data.items.map((item) => {
            const product = products.find((p) => p.id === item.productId)!;
            return {
              productId: item.productId,
              quantityRequested: item.quantityRequested,
              productName: product.name,
              productSku: product.sku,
              notes: item.notes,
            };
          }),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        fromLocation: {
          select: { id: true, name: true, code: true },
        },
        toLocation: {
          select: { id: true, name: true, code: true },
        },
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Emit event
    this.eventEmitter.emit('transfer.created', {
      transferId: transfer.id,
      tenantId,
      userId,
    });

    return transfer;
  }

  /**
   * Get transfers with filters
   */
  async getTransfers(
    tenantId: string,
    options?: {
      fromLocationId?: string;
      toLocationId?: string;
      status?: TransferStatus;
      requestedById?: string;
      fromDate?: Date;
      toDate?: Date;
    },
  ) {
    const where: any = { tenantId };

    if (options?.fromLocationId) {
      where.fromLocationId = options.fromLocationId;
    }

    if (options?.toLocationId) {
      where.toLocationId = options.toLocationId;
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.requestedById) {
      where.requestedById = options.requestedById;
    }

    if (options?.fromDate || options?.toDate) {
      where.requestedAt = {};
      if (options.fromDate) {
        where.requestedAt.gte = options.fromDate;
      }
      if (options.toDate) {
        where.requestedAt.lte = options.toDate;
      }
    }

    const transfers = await this.prisma.stockTransfer.findMany({
      where,
      include: {
        fromLocation: {
          select: { id: true, name: true, code: true },
        },
        toLocation: {
          select: { id: true, name: true, code: true },
        },
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
        sentBy: {
          select: { id: true, name: true, email: true },
        },
        receivedBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { requestedAt: 'desc' },
    });

    return transfers;
  }

  /**
   * Get transfer by ID
   */
  async getTransferById(id: string, tenantId: string) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        fromLocation: {
          select: { id: true, name: true, code: true, type: true },
        },
        toLocation: {
          select: { id: true, name: true, code: true, type: true },
        },
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
        approvedBy: {
          select: { id: true, name: true, email: true },
        },
        sentBy: {
          select: { id: true, name: true, email: true },
        },
        receivedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    return transfer;
  }

  /**
   * Approve transfer
   */
  async approveTransfer(id: string, tenantId: string, userId: string) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, tenantId },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(
        `Cannot approve transfer with status ${transfer.status}`,
      );
    }

    const updated = await this.prisma.stockTransfer.update({
      where: { id },
      data: {
        status: TransferStatus.APPROVED,
        approvedById: userId,
        approvedAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        fromLocation: true,
        toLocation: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('transfer.approved', {
      transferId: updated.id,
      tenantId,
      userId,
    });

    return updated;
  }

  /**
   * Reject transfer
   */
  async rejectTransfer(
    id: string,
    tenantId: string,
    userId: string,
    reason: string,
  ) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, tenantId },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(
        `Cannot reject transfer with status ${transfer.status}`,
      );
    }

    const updated = await this.prisma.stockTransfer.update({
      where: { id },
      data: {
        status: TransferStatus.REJECTED,
        approvedById: userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        fromLocation: true,
        toLocation: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('transfer.rejected', {
      transferId: updated.id,
      tenantId,
      userId,
      reason,
    });

    return updated;
  }

  /**
   * Ship transfer (mark as in transit)
   */
  async shipTransfer(
    id: string,
    tenantId: string,
    userId: string,
    data: {
      trackingNumber?: string;
      estimatedArrival?: Date;
      quantitiesSent?: Array<{
        itemId: string;
        quantitySent: number;
      }>;
    },
  ) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
      },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    if (transfer.status !== TransferStatus.APPROVED) {
      throw new BadRequestException(
        `Cannot ship transfer with status ${transfer.status}`,
      );
    }

    // Update items with quantities sent if provided
    if (data.quantitiesSent) {
      for (const qty of data.quantitiesSent) {
        const item = transfer.items.find((i) => i.id === qty.itemId);
        if (!item) {
          throw new BadRequestException(`Item ${qty.itemId} not found`);
        }

        await this.prisma.stockTransferItem.update({
          where: { id: qty.itemId },
          data: { quantitySent: qty.quantitySent },
        });
      }
    }

    // Deduct inventory from source location
    for (const item of transfer.items) {
      const quantityToDeduct =
        data.quantitiesSent?.find((q) => q.itemId === item.id)?.quantitySent ||
        item.quantityRequested;

      // Check inventory availability
      const inventory = await this.prisma.locationInventory.findFirst({
        where: {
          tenantId,
          locationId: transfer.fromLocationId,
          productId: item.productId,
        },
      });

      if (!inventory || inventory.availableQuantity < quantityToDeduct) {
        throw new BadRequestException(
          `Insufficient inventory for product ${item.productName} at source location`,
        );
      }

      // Update inventory
      await this.prisma.locationInventory.update({
        where: { id: inventory.id },
        data: {
          quantity: inventory.quantity - quantityToDeduct,
          availableQuantity: inventory.availableQuantity - quantityToDeduct,
        },
      });

      // Create stock movement
      await this.prisma.stockMovement.create({
        data: {
          tenantId,
          productId: item.productId,
          locationId: transfer.fromLocationId,
          type: 'TRANSFER_OUT',
          quantity: -quantityToDeduct,
          previousQuantity: inventory.quantity,
          newQuantity: inventory.quantity - quantityToDeduct,
          transferId: transfer.id,
          reason: `Transfer to ${transfer.toLocation?.name || 'location'}`,
          createdBy: userId,
        },
      });
    }

    const updated = await this.prisma.stockTransfer.update({
      where: { id },
      data: {
        status: TransferStatus.IN_TRANSIT,
        sentById: userId,
        sentAt: new Date(),
        trackingNumber: data.trackingNumber,
        estimatedArrival: data.estimatedArrival,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        fromLocation: true,
        toLocation: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('transfer.shipped', {
      transferId: updated.id,
      tenantId,
      userId,
    });

    return updated;
  }

  /**
   * Receive transfer
   */
  async receiveTransfer(
    id: string,
    tenantId: string,
    userId: string,
    data: {
      quantitiesReceived: Array<{
        itemId: string;
        quantityReceived: number;
      }>;
      notes?: string;
    },
  ) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
      },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BadRequestException(
        `Cannot receive transfer with status ${transfer.status}`,
      );
    }

    // Update items with quantities received and add to destination inventory
    for (const qty of data.quantitiesReceived) {
      const item = transfer.items.find((i) => i.id === qty.itemId);
      if (!item) {
        throw new BadRequestException(`Item ${qty.itemId} not found`);
      }

      // Update transfer item
      await this.prisma.stockTransferItem.update({
        where: { id: qty.itemId },
        data: { quantityReceived: qty.quantityReceived },
      });

      // Update or create destination inventory
      const destInventory = await this.prisma.locationInventory.findFirst({
        where: {
          tenantId,
          locationId: transfer.toLocationId,
          productId: item.productId,
        },
      });

      if (destInventory) {
        await this.prisma.locationInventory.update({
          where: { id: destInventory.id },
          data: {
            quantity: destInventory.quantity + qty.quantityReceived,
            availableQuantity:
              destInventory.availableQuantity + qty.quantityReceived,
          },
        });

        // Create stock movement
        await this.prisma.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            locationId: transfer.toLocationId,
            type: 'TRANSFER_IN',
            quantity: qty.quantityReceived,
            previousQuantity: destInventory.quantity,
            newQuantity: destInventory.quantity + qty.quantityReceived,
            transferId: transfer.id,
            reason: `Transfer from ${transfer.fromLocation?.name || 'location'}`,
            createdBy: userId,
          },
        });
      } else {
        // Create new inventory record
        await this.prisma.locationInventory.create({
          data: {
            tenantId,
            locationId: transfer.toLocationId,
            productId: item.productId,
            quantity: qty.quantityReceived,
            reservedQuantity: 0,
            availableQuantity: qty.quantityReceived,
          },
        });

        // Create stock movement
        await this.prisma.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            locationId: transfer.toLocationId,
            type: 'TRANSFER_IN',
            quantity: qty.quantityReceived,
            previousQuantity: 0,
            newQuantity: qty.quantityReceived,
            transferId: transfer.id,
            reason: `Transfer from ${transfer.fromLocation?.name || 'location'}`,
            createdBy: userId,
          },
        });
      }
    }

    const updated = await this.prisma.stockTransfer.update({
      where: { id },
      data: {
        status: TransferStatus.RECEIVED,
        receivedById: userId,
        receivedAt: new Date(),
        notes: data.notes
          ? `${transfer.notes || ''}\n${data.notes}`.trim()
          : transfer.notes,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        fromLocation: true,
        toLocation: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('transfer.received', {
      transferId: updated.id,
      tenantId,
      userId,
    });

    return updated;
  }

  /**
   * Cancel transfer
   */
  async cancelTransfer(
    id: string,
    tenantId: string,
    userId: string,
    reason: string,
  ) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
      },
    });

    if (!transfer) {
      throw new NotFoundException('Transfer not found');
    }

    if (
      transfer.status === TransferStatus.RECEIVED ||
      transfer.status === TransferStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel transfer with status ${transfer.status}`,
      );
    }

    // If transfer was already shipped, restore inventory at source location
    if (transfer.status === TransferStatus.IN_TRANSIT) {
      for (const item of transfer.items) {
        const quantityToRestore = item.quantitySent || item.quantityRequested;

        const inventory = await this.prisma.locationInventory.findFirst({
          where: {
            tenantId,
            locationId: transfer.fromLocationId,
            productId: item.productId,
          },
        });

        if (inventory) {
          await this.prisma.locationInventory.update({
            where: { id: inventory.id },
            data: {
              quantity: inventory.quantity + quantityToRestore,
              availableQuantity:
                inventory.availableQuantity + quantityToRestore,
            },
          });

          // Create stock movement
          await this.prisma.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              locationId: transfer.fromLocationId,
              type: 'ADJUSTMENT',
              quantity: quantityToRestore,
              previousQuantity: inventory.quantity,
              newQuantity: inventory.quantity + quantityToRestore,
              transferId: transfer.id,
              reason: `Transfer cancelled - inventory restored`,
              createdBy: userId,
            },
          });
        }
      }
    }

    const updated = await this.prisma.stockTransfer.update({
      where: { id },
      data: {
        status: TransferStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      include: {
        fromLocation: true,
        toLocation: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('transfer.cancelled', {
      transferId: updated.id,
      tenantId,
      userId,
      reason,
    });

    return updated;
  }

  /**
   * Get transfer statistics
   */
  async getTransferStatistics(
    tenantId: string,
    options?: {
      fromDate?: Date;
      toDate?: Date;
      locationId?: string;
    },
  ) {
    const where: any = { tenantId };

    if (options?.fromDate || options?.toDate) {
      where.requestedAt = {};
      if (options.fromDate) {
        where.requestedAt.gte = options.fromDate;
      }
      if (options.toDate) {
        where.requestedAt.lte = options.toDate;
      }
    }

    if (options?.locationId) {
      where.OR = [
        { fromLocationId: options.locationId },
        { toLocationId: options.locationId },
      ];
    }

    // Count by status
    const byStatus = await this.prisma.stockTransfer.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    // Total transfers
    const total = byStatus.reduce((sum, item) => sum + item._count, 0);

    // Get all transfers for detailed stats
    const transfers = await this.prisma.stockTransfer.findMany({
      where,
      include: {
        items: true,
      },
    });

    // Calculate total items transferred
    let totalItemsTransferred = 0;
    for (const transfer of transfers) {
      if (transfer.status === TransferStatus.RECEIVED) {
        for (const item of transfer.items) {
          totalItemsTransferred += item.quantityReceived || 0;
        }
      }
    }

    // Average processing time (from requested to received)
    const completedTransfers = transfers.filter(
      (t) => t.status === TransferStatus.RECEIVED && t.receivedAt,
    );

    let avgProcessingDays = 0;
    if (completedTransfers.length > 0) {
      const totalDays = completedTransfers.reduce((sum, transfer) => {
        const days =
          (transfer.receivedAt!.getTime() - transfer.requestedAt.getTime()) /
          (1000 * 60 * 60 * 24);
        return sum + days;
      }, 0);
      avgProcessingDays = totalDays / completedTransfers.length;
    }

    return {
      total,
      byStatus: byStatus.map((item) => ({
        status: item.status,
        count: item._count,
        percentage: (item._count / total) * 100,
      })),
      totalItemsTransferred,
      completedTransfers: completedTransfers.length,
      avgProcessingDays: Math.round(avgProcessingDays * 10) / 10,
    };
  }

  /**
   * Alias for getTransferById (for controller compatibility)
   */
  async getTransfer(id: string, tenantId: string) {
    return this.getTransferById(id, tenantId);
  }

  /**
   * Alias for getTransferStatistics (for controller compatibility)
   */
  async getStatistics(
    tenantId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      locationId?: string;
    },
  ) {
    return this.getTransferStatistics(tenantId, {
      fromDate: options?.startDate,
      toDate: options?.endDate,
      locationId: options?.locationId,
    });
  }

  /**
   * Complete transfer (alias for marking as received)
   * This is for compatibility - transfers are automatically completed when received
   */
  async completeTransfer(id: string, tenantId: string) {
    const transfer = await this.getTransferById(id, tenantId);

    if (transfer.status !== TransferStatus.RECEIVED) {
      throw new BadRequestException(
        'Transfer must be received before it can be completed',
      );
    }

    // Transfer is already complete when received, just return it
    return transfer;
  }
}
