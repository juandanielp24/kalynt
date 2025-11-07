import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaClient } from '@retail/database';
import { Prisma, DeliveryStatus, DriverStatus } from '@prisma/client';

@Injectable()
export class DeliveryService {
  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Generate delivery number (format: DEL241104XXXX)
   */
  private async generateDeliveryNumber(tenantId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const prefix = `DEL${year}${month}${day}`;

    // Get last delivery number for today
    const lastDelivery = await this.prisma.delivery.findFirst({
      where: {
        tenantId,
        deliveryNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        deliveryNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastDelivery) {
      const lastSequence = parseInt(
        lastDelivery.deliveryNumber.slice(-4),
        10,
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  /**
   * Create delivery from a sale
   */
  async createDeliveryFromSale(
    tenantId: string,
    saleId: string,
    data: {
      address: string;
      addressLine2?: string;
      city: string;
      state: string;
      postalCode?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      contactName: string;
      contactPhone: string;
      deliveryNotes?: string;
      zoneId?: string;
      deliveryCost?: number;
      distance?: number;
      scheduledFor?: Date;
    },
  ) {
    // Verify sale exists and belongs to tenant
    const sale = await this.prisma.sale.findFirst({
      where: {
        id: saleId,
        tenantId,
      },
      include: {
        delivery: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale ${saleId} not found`);
    }

    if (sale.delivery) {
      throw new BadRequestException(
        'Sale already has a delivery assigned',
      );
    }

    // Generate delivery number
    const deliveryNumber = await this.generateDeliveryNumber(tenantId);

    // Calculate estimated arrival if scheduled
    let estimatedArrival: Date | undefined;
    if (data.scheduledFor && data.zoneId) {
      const zone = await this.prisma.deliveryZone.findUnique({
        where: { id: data.zoneId },
      });
      if (zone) {
        estimatedArrival = new Date(
          data.scheduledFor.getTime() + zone.estimatedMinutes * 60000,
        );
      }
    }

    // Create delivery
    const delivery = await this.prisma.delivery.create({
      data: {
        tenantId,
        deliveryNumber,
        saleId,
        zoneId: data.zoneId,
        address: data.address,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country || 'Argentina',
        latitude: data.latitude,
        longitude: data.longitude,
        contactName: data.contactName,
        contactPhone: data.contactPhone,
        deliveryNotes: data.deliveryNotes,
        deliveryCost: data.deliveryCost || 0,
        distance: data.distance,
        scheduledFor: data.scheduledFor,
        estimatedArrival,
        status: DeliveryStatus.PENDING,
      },
      include: {
        sale: true,
        zone: true,
      },
    });

    // Create status history
    await this.createStatusHistory(delivery.id, null, DeliveryStatus.PENDING);

    // Emit event
    this.eventEmitter.emit('delivery.created', {
      tenantId,
      deliveryId: delivery.id,
      saleId,
    });

    return delivery;
  }

  /**
   * Assign driver to delivery
   */
  async assignDriver(
    tenantId: string,
    deliveryId: string,
    driverId: string,
    assignedBy?: string,
  ) {
    // Verify delivery exists
    const delivery = await this.getDelivery(tenantId, deliveryId);

    if (delivery.status !== DeliveryStatus.PENDING) {
      throw new BadRequestException(
        'Can only assign driver to pending deliveries',
      );
    }

    // Verify driver exists and is available
    const driver = await this.prisma.driver.findFirst({
      where: {
        id: driverId,
        tenantId,
        isActive: true,
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver ${driverId} not found`);
    }

    if (driver.status !== DriverStatus.AVAILABLE && driver.status !== DriverStatus.BUSY) {
      throw new BadRequestException(
        `Driver is ${driver.status} and cannot accept deliveries`,
      );
    }

    // Update delivery
    const updatedDelivery = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        driverId,
        assignedAt: new Date(),
        status: DeliveryStatus.ASSIGNED,
      },
      include: {
        sale: true,
        driver: true,
        zone: true,
      },
    });

    // Create status history
    await this.createStatusHistory(
      deliveryId,
      DeliveryStatus.PENDING,
      DeliveryStatus.ASSIGNED,
      undefined,
      undefined,
      assignedBy,
      'user',
    );

    // Update driver status to BUSY
    await this.prisma.driver.update({
      where: { id: driverId },
      data: { status: DriverStatus.BUSY },
    });

    // Emit event
    this.eventEmitter.emit('delivery.assigned', {
      tenantId,
      deliveryId,
      driverId,
      delivery: updatedDelivery,
    });

    return updatedDelivery;
  }

  /**
   * Update delivery status
   */
  async updateStatus(
    tenantId: string,
    deliveryId: string,
    status: DeliveryStatus,
    notes?: string,
    latitude?: number,
    longitude?: number,
    changedBy?: string,
    changedByType?: 'user' | 'driver',
  ) {
    const delivery = await this.getDelivery(tenantId, deliveryId);

    // Validate status transition
    const validTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
      PENDING: [DeliveryStatus.ASSIGNED, DeliveryStatus.CANCELLED],
      ASSIGNED: [DeliveryStatus.PICKED_UP, DeliveryStatus.CANCELLED],
      PICKED_UP: [DeliveryStatus.IN_TRANSIT, DeliveryStatus.CANCELLED],
      IN_TRANSIT: [DeliveryStatus.ARRIVED, DeliveryStatus.FAILED, DeliveryStatus.CANCELLED],
      ARRIVED: [DeliveryStatus.DELIVERED, DeliveryStatus.FAILED],
      DELIVERED: [DeliveryStatus.RETURNED],
      FAILED: [DeliveryStatus.RETURNED, DeliveryStatus.ASSIGNED],
      CANCELLED: [],
      RETURNED: [],
    };

    if (!validTransitions[delivery.status]?.includes(status)) {
      throw new BadRequestException(
        `Invalid status transition from ${delivery.status} to ${status}`,
      );
    }

    // Update delivery with status-specific fields
    const updateData: Prisma.DeliveryUpdateInput = {
      status,
    };

    if (status === DeliveryStatus.PICKED_UP) {
      updateData.pickedUpAt = new Date();
    } else if (status === DeliveryStatus.DELIVERED) {
      updateData.deliveredAt = new Date();

      // Update driver stats
      if (delivery.driverId) {
        await this.prisma.driver.update({
          where: { id: delivery.driverId },
          data: {
            totalDeliveries: { increment: 1 },
            status: DriverStatus.AVAILABLE,
          },
        });
      }
    } else if (status === DeliveryStatus.CANCELLED) {
      updateData.cancelledAt = new Date();

      // Free up driver
      if (delivery.driverId) {
        await this.prisma.driver.update({
          where: { id: delivery.driverId },
          data: { status: DriverStatus.AVAILABLE },
        });
      }
    } else if (status === DeliveryStatus.FAILED) {
      // Free up driver
      if (delivery.driverId) {
        await this.prisma.driver.update({
          where: { id: delivery.driverId },
          data: { status: DriverStatus.AVAILABLE },
        });
      }
    }

    const updatedDelivery = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
      include: {
        sale: true,
        driver: true,
        zone: true,
      },
    });

    // Create status history
    await this.createStatusHistory(
      deliveryId,
      delivery.status,
      status,
      latitude,
      longitude,
      changedBy,
      changedByType,
      notes,
    );

    // Emit event
    this.eventEmitter.emit('delivery.status.updated', {
      tenantId,
      deliveryId,
      fromStatus: delivery.status,
      toStatus: status,
      delivery: updatedDelivery,
    });

    return updatedDelivery;
  }

  /**
   * Get delivery by ID
   */
  async getDelivery(tenantId: string, deliveryId: string) {
    const delivery = await this.prisma.delivery.findFirst({
      where: {
        id: deliveryId,
        tenantId,
      },
      include: {
        sale: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        driver: true,
        zone: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException(`Delivery ${deliveryId} not found`);
    }

    return delivery;
  }

  /**
   * Get deliveries with filters
   */
  async getDeliveries(
    tenantId: string,
    filters?: {
      status?: DeliveryStatus;
      driverId?: string;
      zoneId?: string;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: Prisma.DeliveryWhereInput = {
      tenantId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.driverId && { driverId: filters.driverId }),
      ...(filters?.zoneId && { zoneId: filters.zoneId }),
      ...(filters?.dateFrom && {
        createdAt: { gte: filters.dateFrom },
      }),
      ...(filters?.dateTo && {
        createdAt: { lte: filters.dateTo },
      }),
    };

    const [deliveries, total] = await Promise.all([
      this.prisma.delivery.findMany({
        where,
        include: {
          sale: {
            select: {
              saleNumber: true,
              totalCents: true,
            },
          },
          driver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          zone: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.delivery.count({ where }),
    ]);

    return {
      deliveries,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    };
  }

  /**
   * Create status history entry
   */
  private async createStatusHistory(
    deliveryId: string,
    fromStatus: DeliveryStatus | null,
    toStatus: DeliveryStatus,
    latitude?: number,
    longitude?: number,
    changedBy?: string,
    changedByType?: 'user' | 'driver',
    notes?: string,
  ) {
    return this.prisma.deliveryStatusHistory.create({
      data: {
        deliveryId,
        fromStatus,
        toStatus,
        latitude,
        longitude,
        changedBy,
        changedByType,
        notes,
      },
    });
  }

  /**
   * Get delivery statistics
   */
  async getStatistics(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date,
  ) {
    const where: Prisma.DeliveryWhereInput = {
      tenantId,
      ...(dateFrom && { createdAt: { gte: dateFrom } }),
      ...(dateTo && { createdAt: { lte: dateTo } }),
    };

    // Get counts by status
    const deliveriesByStatus = await this.prisma.delivery.groupBy({
      by: ['status'],
      where,
      _count: {
        status: true,
      },
    });

    // Get totals
    const totals = await this.prisma.delivery.aggregate({
      where,
      _count: { id: true },
      _avg: {
        deliveryCost: true,
        distance: true,
        rating: true,
      },
      _sum: {
        deliveryCost: true,
        distance: true,
      },
    });

    // Get top zones
    const topZones = await this.prisma.delivery.groupBy({
      by: ['zoneId'],
      where: {
        ...where,
        zoneId: { not: null },
      },
      _count: {
        zoneId: true,
      },
      orderBy: {
        _count: {
          zoneId: 'desc',
        },
      },
      take: 5,
    });

    // Get zone details
    const zoneIds = topZones.map((z) => z.zoneId!);
    const zones = await this.prisma.deliveryZone.findMany({
      where: { id: { in: zoneIds } },
      select: { id: true, name: true },
    });

    // Get top drivers
    const topDrivers = await this.prisma.delivery.groupBy({
      by: ['driverId'],
      where: {
        ...where,
        driverId: { not: null },
        status: DeliveryStatus.DELIVERED,
      },
      _count: {
        driverId: true,
      },
      orderBy: {
        _count: {
          driverId: 'desc',
        },
      },
      take: 5,
    });

    // Get driver details
    const driverIds = topDrivers.map((d) => d.driverId!);
    const drivers = await this.prisma.driver.findMany({
      where: { id: { in: driverIds } },
      select: { id: true, firstName: true, lastName: true, rating: true },
    });

    return {
      totals: {
        total: totals._count.id,
        averageCost: totals._avg.deliveryCost || 0,
        averageDistance: totals._avg.distance || 0,
        averageRating: totals._avg.rating || 0,
        totalRevenue: totals._sum.deliveryCost || 0,
        totalDistance: totals._sum.distance || 0,
      },
      byStatus: deliveriesByStatus.map((d) => ({
        status: d.status,
        count: d._count.status,
      })),
      topZones: topZones.map((z) => ({
        zone: zones.find((zone) => zone.id === z.zoneId),
        count: z._count.zoneId,
      })),
      topDrivers: topDrivers.map((d) => ({
        driver: drivers.find((driver) => driver.id === d.driverId),
        deliveries: d._count.driverId,
      })),
    };
  }

  /**
   * Auto-assign delivery to available driver
   */
  async autoAssignDelivery(tenantId: string, deliveryId: string) {
    const delivery = await this.getDelivery(tenantId, deliveryId);

    if (delivery.status !== DeliveryStatus.PENDING) {
      throw new BadRequestException(
        'Can only auto-assign pending deliveries',
      );
    }

    // Get available drivers sorted by workload
    const drivers = await this.prisma.driver.findMany({
      where: {
        tenantId,
        status: DriverStatus.AVAILABLE,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            deliveries: {
              where: {
                status: {
                  in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'],
                },
              },
            },
          },
        },
      },
    });

    if (drivers.length === 0) {
      throw new BadRequestException('No available drivers');
    }

    // Sort by workload (fewer active deliveries first)
    const sortedDrivers = drivers.sort(
      (a, b) => a._count.deliveries - b._count.deliveries,
    );

    // Assign to first available driver
    const selectedDriver = sortedDrivers[0];

    return this.assignDriver(tenantId, deliveryId, selectedDriver.id, 'system');
  }
}
