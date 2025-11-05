import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, DriverStatus, VehicleType } from '@prisma/client';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all drivers for a tenant
   */
  async getDrivers(
    tenantId: string,
    filters?: {
      status?: DriverStatus;
      isActive?: boolean;
      vehicleType?: VehicleType;
    },
  ) {
    const where: Prisma.DriverWhereInput = {
      tenantId,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters?.vehicleType && { vehicleType: filters.vehicleType }),
    };

    return this.prisma.driver.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
      orderBy: [{ status: 'asc' }, { firstName: 'asc' }],
    });
  }

  /**
   * Get a single driver by ID
   */
  async getDriver(tenantId: string, driverId: string) {
    const driver = await this.prisma.driver.findFirst({
      where: {
        id: driverId,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        deliveries: {
          where: {
            status: {
              in: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver ${driverId} not found`);
    }

    return driver;
  }

  /**
   * Create a new driver
   */
  async createDriver(
    tenantId: string,
    data: {
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      documentType?: string;
      documentNumber?: string;
      vehicleType: VehicleType;
      vehiclePlate?: string;
      vehicleModel?: string;
      userId?: string;
      isActive?: boolean;
    },
  ) {
    // If userId provided, check if user exists and doesn't already have a driver profile
    if (data.userId) {
      const existingDriver = await this.prisma.driver.findUnique({
        where: { userId: data.userId },
      });

      if (existingDriver) {
        throw new BadRequestException(
          'User already has a driver profile',
        );
      }

      const user = await this.prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user || user.tenantId !== tenantId) {
        throw new BadRequestException('Invalid user');
      }
    }

    return this.prisma.driver.create({
      data: {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        vehicleType: data.vehicleType,
        vehiclePlate: data.vehiclePlate,
        vehicleModel: data.vehicleModel,
        userId: data.userId,
        isActive: data.isActive !== undefined ? data.isActive : true,
        status: DriverStatus.OFFLINE,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Update a driver
   */
  async updateDriver(
    tenantId: string,
    driverId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      documentType?: string;
      documentNumber?: string;
      vehicleType?: VehicleType;
      vehiclePlate?: string;
      vehicleModel?: string;
      isActive?: boolean;
    },
  ) {
    // Verify driver exists
    await this.getDriver(tenantId, driverId);

    return this.prisma.driver.update({
      where: {
        id: driverId,
      },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Update driver status
   */
  async updateDriverStatus(
    tenantId: string,
    driverId: string,
    status: DriverStatus,
  ) {
    // Verify driver exists
    await this.getDriver(tenantId, driverId);

    // If changing to BUSY or AVAILABLE, check active deliveries
    if (status === DriverStatus.BUSY) {
      const activeDeliveries = await this.prisma.delivery.count({
        where: {
          driverId,
          status: {
            in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'],
          },
        },
      });

      if (activeDeliveries === 0) {
        throw new BadRequestException(
          'Cannot set status to BUSY without active deliveries',
        );
      }
    }

    return this.prisma.driver.update({
      where: {
        id: driverId,
      },
      data: {
        status,
      },
    });
  }

  /**
   * Update driver location
   */
  async updateDriverLocation(
    tenantId: string,
    driverId: string,
    latitude: number,
    longitude: number,
  ) {
    // Verify driver exists
    await this.getDriver(tenantId, driverId);

    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      throw new BadRequestException('Invalid latitude');
    }
    if (longitude < -180 || longitude > 180) {
      throw new BadRequestException('Invalid longitude');
    }

    return this.prisma.driver.update({
      where: {
        id: driverId,
      },
      data: {
        currentLat: latitude,
        currentLng: longitude,
        lastLocationUpdate: new Date(),
      },
    });
  }

  /**
   * Delete a driver
   */
  async deleteDriver(tenantId: string, driverId: string) {
    // Verify driver exists
    await this.getDriver(tenantId, driverId);

    // Check for active deliveries
    const activeDeliveries = await this.prisma.delivery.count({
      where: {
        driverId,
        status: {
          in: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'ARRIVED'],
        },
      },
    });

    if (activeDeliveries > 0) {
      throw new BadRequestException(
        `Cannot delete driver with ${activeDeliveries} active deliveries`,
      );
    }

    return this.prisma.driver.delete({
      where: {
        id: driverId,
      },
    });
  }

  /**
   * Get available drivers (sorted by workload)
   */
  async getAvailableDrivers(tenantId: string) {
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

    // Sort by workload (fewer active deliveries first)
    return drivers.sort(
      (a, b) => a._count.deliveries - b._count.deliveries,
    );
  }

  /**
   * Get driver statistics
   */
  async getDriverStatistics(tenantId: string, driverId: string) {
    // Verify driver exists
    const driver = await this.getDriver(tenantId, driverId);

    // Get delivery counts by status
    const deliveriesByStatus = await this.prisma.delivery.groupBy({
      by: ['status'],
      where: {
        driverId,
      },
      _count: {
        status: true,
      },
    });

    // Calculate success rate
    const completed = deliveriesByStatus.find(
      (d) => d.status === 'DELIVERED',
    )?._count.status || 0;
    const failed = deliveriesByStatus.find(
      (d) => d.status === 'FAILED',
    )?._count.status || 0;
    const cancelled = deliveriesByStatus.find(
      (d) => d.status === 'CANCELLED',
    )?._count.status || 0;

    const total = driver.totalDeliveries;
    const successRate = total > 0 ? (completed / total) * 100 : 0;

    // Get average rating
    const ratingsData = await this.prisma.delivery.aggregate({
      where: {
        driverId,
        rating: { not: null },
      },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    // Get recent deliveries
    const recentDeliveries = await this.prisma.delivery.findMany({
      where: {
        driverId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        sale: {
          select: {
            saleNumber: true,
          },
        },
      },
    });

    return {
      driver: {
        id: driver.id,
        name: `${driver.firstName} ${driver.lastName}`,
        rating: driver.rating,
        totalDeliveries: driver.totalDeliveries,
        status: driver.status,
      },
      statistics: {
        totalDeliveries: total,
        completed,
        failed,
        cancelled,
        successRate: Math.round(successRate * 100) / 100,
        averageRating: ratingsData._avg.rating || driver.rating || 5.0,
        totalRatings: ratingsData._count.rating,
      },
      deliveriesByStatus: deliveriesByStatus.map((d) => ({
        status: d.status,
        count: d._count.status,
      })),
      recentDeliveries,
    };
  }
}
