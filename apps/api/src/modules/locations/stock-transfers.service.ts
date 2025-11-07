import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaClient, TransferStatus, StockMovementType } from '@retail/database';

interface GetTransfersParams {
  page?: number;
  limit?: number;
  status?: TransferStatus;
  fromLocationId?: string;
  toLocationId?: string;
  startDate?: Date;
  endDate?: Date;
}

interface CreateTransferDto {
  fromLocationId: string;
  toLocationId: string;
  items: Array<{
    productId: string;
    quantityRequested: number;
    notes?: string;
  }>;
  shippingMethod?: string;
  estimatedArrival?: Date;
  notes?: string;
  internalNotes?: string;
}

interface ApproveTransferDto {
  notes?: string;
}

interface RejectTransferDto {
  rejectionReason: string;
}

interface SendTransferDto {
  items?: Array<{
    productId: string;
    quantitySent: number;
  }>;
  trackingNumber?: string;
  shippingMethod?: string;
  notes?: string;
}

interface ReceiveTransferDto {
  items?: Array<{
    productId: string;
    quantityReceived: number;
  }>;
  notes?: string;
}

interface CancelTransferDto {
  cancellationReason: string;
}

@Injectable()
export class StockTransfersService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Generate next transfer number (TRF-00001 format)
   */
  async generateTransferNumber(tenantId: string): Promise<string> {
    // Get the last transfer for this tenant
    const lastTransfer = await this.prisma.stockTransfer.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { transferNumber: true },
    });

    if (!lastTransfer) {
      return 'TRF-00001';
    }

    // Extract number from TRF-00001 format
    const lastNumber = parseInt(lastTransfer.transferNumber.split('-')[1]);
    const nextNumber = lastNumber + 1;

    return `TRF-${String(nextNumber).padStart(5, '0')}`;
  }

  /**
   * Get all transfers with filters and pagination
   */
  async getTransfers(tenantId: string, params: GetTransfersParams = {}) {
    const { page = 1, limit = 50, status, fromLocationId, toLocationId, startDate, endDate } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (fromLocationId) {
      where.fromLocationId = fromLocationId;
    }

    if (toLocationId) {
      where.toLocationId = toLocationId;
    }

    if (startDate || endDate) {
      where.requestedAt = {};
      if (startDate) {
        where.requestedAt.gte = startDate;
      }
      if (endDate) {
        where.requestedAt.lte = endDate;
      }
    }

    const [transfers, total] = await Promise.all([
      this.prisma.stockTransfer.findMany({
        where,
        skip,
        take: limit,
        include: {
          fromLocation: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
          toLocation: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true,
            },
          },
          requestedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          sentBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          receivedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
        orderBy: { requestedAt: 'desc' },
      }),
      this.prisma.stockTransfer.count({ where }),
    ]);

    return {
      data: transfers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single transfer by ID
   */
  async getTransfer(id: string, tenantId: string) {
    const transfer = await this.prisma.stockTransfer.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        fromLocation: true,
        toLocation: true,
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sentBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        receivedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        stockMovements: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
            location: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!transfer) {
      throw new NotFoundException(`Transfer with ID ${id} not found`);
    }

    return transfer;
  }

  /**
   * Create a new transfer request
   */
  async createTransfer(tenantId: string, userId: string, dto: CreateTransferDto) {
    // Validate locations
    if (dto.fromLocationId === dto.toLocationId) {
      throw new BadRequestException('Source and destination locations must be different');
    }

    const [fromLocation, toLocation] = await Promise.all([
      this.prisma.location.findFirst({
        where: { id: dto.fromLocationId, tenantId, isActive: true, deletedAt: null },
      }),
      this.prisma.location.findFirst({
        where: { id: dto.toLocationId, tenantId, isActive: true, deletedAt: null },
      }),
    ]);

    if (!fromLocation) {
      throw new NotFoundException(`Source location not found`);
    }

    if (!toLocation) {
      throw new NotFoundException(`Destination location not found`);
    }

    // Validate products and stock availability
    for (const item of dto.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, tenantId, deletedAt: null },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${item.productId} not found`);
      }

      // Check stock availability
      const stock = await this.prisma.stock.findFirst({
        where: {
          productId: item.productId,
          locationId: dto.fromLocationId,
        },
      });

      if (!stock || stock.quantity < item.quantityRequested) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Available: ${stock?.quantity || 0}, Requested: ${item.quantityRequested}`
        );
      }
    }

    // Generate transfer number
    const transferNumber = await this.generateTransferNumber(tenantId);

    // Create transfer with items
    const transfer = await this.prisma.stockTransfer.create({
      data: {
        tenantId,
        transferNumber,
        fromLocationId: dto.fromLocationId,
        toLocationId: dto.toLocationId,
        status: TransferStatus.PENDING,
        requestedById: userId,
        shippingMethod: dto.shippingMethod,
        estimatedArrival: dto.estimatedArrival,
        notes: dto.notes,
        internalNotes: dto.internalNotes,
        items: {
          create: dto.items.map(item => ({
            productId: item.productId,
            quantityRequested: item.quantityRequested,
            productName: '', // Will be updated in transaction
            productSku: '', // Will be updated in transaction
            notes: item.notes,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Update items with product snapshot data
    await Promise.all(
      transfer.items.map(item =>
        this.prisma.stockTransferItem.update({
          where: { id: item.id },
          data: {
            productName: item.product.name,
            productSku: item.product.sku,
          },
        })
      )
    );

    return this.getTransfer(transfer.id, tenantId);
  }

  /**
   * Approve a pending transfer
   */
  async approveTransfer(id: string, tenantId: string, userId: string, dto?: ApproveTransferDto) {
    const transfer = await this.getTransfer(id, tenantId);

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(`Transfer must be in PENDING status to be approved. Current status: ${transfer.status}`);
    }

    // Re-validate stock availability
    for (const item of transfer.items) {
      const stock = await this.prisma.stock.findFirst({
        where: {
          productId: item.productId,
          locationId: transfer.fromLocationId,
        },
      });

      if (!stock || stock.quantity < item.quantityRequested) {
        throw new BadRequestException(
          `Insufficient stock for product ${item.product.name}. Transfer cannot be approved.`
        );
      }
    }

    // Update transfer status
    const updated = await this.prisma.stockTransfer.update({
      where: { id },
      data: {
        status: TransferStatus.APPROVED,
        approvedById: userId,
        approvedAt: new Date(),
        notes: dto?.notes || transfer.notes,
      },
    });

    return this.getTransfer(updated.id, tenantId);
  }

  /**
   * Reject a pending transfer
   */
  async rejectTransfer(id: string, tenantId: string, userId: string, dto: RejectTransferDto) {
    const transfer = await this.getTransfer(id, tenantId);

    if (transfer.status !== TransferStatus.PENDING) {
      throw new BadRequestException(`Transfer must be in PENDING status to be rejected. Current status: ${transfer.status}`);
    }

    const updated = await this.prisma.stockTransfer.update({
      where: { id },
      data: {
        status: TransferStatus.REJECTED,
        approvedById: userId,
        rejectedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
    });

    return this.getTransfer(updated.id, tenantId);
  }

  /**
   * Send an approved transfer (process stock removal)
   */
  async sendTransfer(id: string, tenantId: string, userId: string, dto?: SendTransferDto) {
    const transfer = await this.getTransfer(id, tenantId);

    if (transfer.status !== TransferStatus.APPROVED) {
      throw new BadRequestException(`Transfer must be in APPROVED status to be sent. Current status: ${transfer.status}`);
    }

    // Process stock movements in a transaction
    await this.prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        // Get quantity to send (from dto or use requested quantity)
        const quantityToSend = dto?.items?.find(i => i.productId === item.productId)?.quantitySent || item.quantityRequested;

        // Verify stock availability
        const stock = await tx.stock.findFirst({
          where: {
            productId: item.productId,
            locationId: transfer.fromLocationId,
          },
        });

        if (!stock || stock.quantity < quantityToSend) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.product.name}. Available: ${stock?.quantity || 0}, Needed: ${quantityToSend}`
          );
        }

        // Update stock (remove from source)
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            quantity: { decrement: quantityToSend },
          },
        });

        // Create TRANSFER_OUT stock movement
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            locationId: transfer.fromLocationId,
            type: StockMovementType.TRANSFER_OUT,
            quantity: -quantityToSend, // Negative for removal
            previousQuantity: stock.quantity,
            newQuantity: stock.quantity - quantityToSend,
            transferId: transfer.id,
            reason: `Transfer to ${transfer.toLocation.name} (${transfer.transferNumber})`,
            createdBy: userId,
          },
        });

        // Update item with sent quantity
        await tx.stockTransferItem.update({
          where: { id: item.id },
          data: {
            quantitySent: quantityToSend,
          },
        });
      }

      // Update transfer status
      await tx.stockTransfer.update({
        where: { id },
        data: {
          status: TransferStatus.IN_TRANSIT,
          sentById: userId,
          sentAt: new Date(),
          trackingNumber: dto?.trackingNumber,
          shippingMethod: dto?.shippingMethod || transfer.shippingMethod,
          notes: dto?.notes || transfer.notes,
        },
      });
    });

    return this.getTransfer(id, tenantId);
  }

  /**
   * Receive a transfer (process stock addition)
   */
  async receiveTransfer(id: string, tenantId: string, userId: string, dto?: ReceiveTransferDto) {
    const transfer = await this.getTransfer(id, tenantId);

    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BadRequestException(`Transfer must be in IN_TRANSIT status to be received. Current status: ${transfer.status}`);
    }

    // Process stock movements in a transaction
    await this.prisma.$transaction(async (tx) => {
      for (const item of transfer.items) {
        // Get quantity to receive (from dto or use sent quantity)
        const quantityToReceive = dto?.items?.find(i => i.productId === item.productId)?.quantityReceived || item.quantitySent || item.quantityRequested;

        // Get or create stock at destination
        let stock = await tx.stock.findFirst({
          where: {
            productId: item.productId,
            locationId: transfer.toLocationId,
          },
        });

        if (!stock) {
          // Create new stock record if it doesn't exist
          stock = await tx.stock.create({
            data: {
              tenantId,
              productId: item.productId,
              locationId: transfer.toLocationId,
              quantity: 0,
              minQuantity: 0,
            },
          });
        }

        const previousQuantity = stock.quantity;

        // Update stock (add to destination)
        await tx.stock.update({
          where: { id: stock.id },
          data: {
            quantity: { increment: quantityToReceive },
          },
        });

        // Create TRANSFER_IN stock movement
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            locationId: transfer.toLocationId,
            type: StockMovementType.TRANSFER_IN,
            quantity: quantityToReceive, // Positive for addition
            previousQuantity,
            newQuantity: previousQuantity + quantityToReceive,
            transferId: transfer.id,
            reason: `Transfer from ${transfer.fromLocation.name} (${transfer.transferNumber})`,
            createdBy: userId,
          },
        });

        // Update item with received quantity
        await tx.stockTransferItem.update({
          where: { id: item.id },
          data: {
            quantityReceived: quantityToReceive,
          },
        });
      }

      // Update transfer status
      await tx.stockTransfer.update({
        where: { id },
        data: {
          status: TransferStatus.RECEIVED,
          receivedById: userId,
          receivedAt: new Date(),
          notes: dto?.notes || transfer.notes,
        },
      });
    });

    return this.getTransfer(id, tenantId);
  }

  /**
   * Cancel a transfer (only if PENDING or APPROVED)
   */
  async cancelTransfer(id: string, tenantId: string, userId: string, dto: CancelTransferDto) {
    const transfer = await this.getTransfer(id, tenantId);

    if (transfer.status !== TransferStatus.PENDING && transfer.status !== TransferStatus.APPROVED) {
      throw new BadRequestException(
        `Transfer can only be cancelled if it's PENDING or APPROVED. Current status: ${transfer.status}`
      );
    }

    const updated = await this.prisma.stockTransfer.update({
      where: { id },
      data: {
        status: TransferStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: dto.cancellationReason,
      },
    });

    return this.getTransfer(updated.id, tenantId);
  }

  /**
   * Get transfer statistics
   */
  async getTransferStats(tenantId: string, locationId?: string) {
    const where: any = { tenantId };

    if (locationId) {
      where.OR = [
        { fromLocationId: locationId },
        { toLocationId: locationId },
      ];
    }

    const [
      totalTransfers,
      pendingCount,
      approvedCount,
      inTransitCount,
      receivedCount,
      cancelledCount,
      rejectedCount,
    ] = await Promise.all([
      this.prisma.stockTransfer.count({ where }),
      this.prisma.stockTransfer.count({ where: { ...where, status: TransferStatus.PENDING } }),
      this.prisma.stockTransfer.count({ where: { ...where, status: TransferStatus.APPROVED } }),
      this.prisma.stockTransfer.count({ where: { ...where, status: TransferStatus.IN_TRANSIT } }),
      this.prisma.stockTransfer.count({ where: { ...where, status: TransferStatus.RECEIVED } }),
      this.prisma.stockTransfer.count({ where: { ...where, status: TransferStatus.CANCELLED } }),
      this.prisma.stockTransfer.count({ where: { ...where, status: TransferStatus.REJECTED } }),
    ]);

    return {
      totalTransfers,
      byStatus: {
        pending: pendingCount,
        approved: approvedCount,
        inTransit: inTransitCount,
        received: receivedCount,
        cancelled: cancelledCount,
        rejected: rejectedCount,
      },
    };
  }

  /**
   * Get restock suggestions for a location based on low stock
   */
  async getRestockSuggestions(locationId: string, tenantId: string) {
    // Verify location exists
    const location = await this.prisma.location.findFirst({
      where: { id: locationId, tenantId, isActive: true, deletedAt: null },
    });

    if (!location) {
      throw new NotFoundException(`Location not found`);
    }

    // Get all low stock items at this location
    const lowStockItems = await this.prisma.stock.findMany({
      where: {
        locationId,
        tenantId,
        quantity: {
          lte: this.prisma.stock.fields.minQuantity,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
      },
    });

    if (lowStockItems.length === 0) {
      return {
        location: {
          id: location.id,
          name: location.name,
          code: location.code,
        },
        suggestions: [],
      };
    }

    // For each low stock item, find locations that have sufficient stock
    const suggestions = await Promise.all(
      lowStockItems.map(async (item) => {
        const availableStock = await this.prisma.stock.findMany({
          where: {
            productId: item.productId,
            tenantId,
            locationId: { not: locationId },
            quantity: { gt: item.minQuantity },
          },
          include: {
            location: {
              select: {
                id: true,
                name: true,
                code: true,
                type: true,
                isWarehouse: true,
              },
            },
          },
          orderBy: [
            { location: { isWarehouse: 'desc' } }, // Prioritize warehouses
            { quantity: 'desc' },
          ],
        });

        const neededQuantity = item.minQuantity - item.quantity;

        return {
          product: item.product,
          currentQuantity: item.quantity,
          minQuantity: item.minQuantity,
          neededQuantity,
          suggestedSources: availableStock.map(stock => ({
            locationId: stock.location.id,
            locationName: stock.location.name,
            locationCode: stock.location.code,
            availableQuantity: stock.quantity,
            isWarehouse: stock.location.isWarehouse,
          })),
        };
      })
    );

    return {
      location: {
        id: location.id,
        name: location.name,
        code: location.code,
      },
      suggestions,
    };
  }
}
