import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@retail/database';

@Injectable()
export class ServicesService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get all services
   */
  async getServices(tenantId: string, options?: {
    isActive?: boolean;
    category?: string;
  }) {
    const where: any = { tenantId };

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.category) {
      where.category = options.category;
    }

    const services = await this.prisma.service.findMany({
      where,
      include: {
        resources: {
          include: {
            resource: true,
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return services;
  }

  /**
   * Get service by ID
   */
  async getService(id: string, tenantId: string) {
    const service = await this.prisma.service.findFirst({
      where: { id, tenantId },
      include: {
        resources: {
          include: {
            resource: {
              include: {
                availability: {
                  where: { isActive: true },
                  orderBy: { dayOfWeek: 'asc' },
                },
              },
            },
          },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  /**
   * Create service
   */
  async createService(tenantId: string, data: {
    name: string;
    description?: string;
    imageUrl?: string;
    duration: number;
    price: number;
    bufferBefore?: number;
    bufferAfter?: number;
    maxCapacity?: number;
    minAdvanceTime?: number;
    maxAdvanceTime?: number;
    cancellationPolicy?: string;
    cancellationDeadline?: number;
    category?: string;
    resourceIds?: string[];
  }) {
    const { resourceIds, ...serviceData } = data;

    const service = await this.prisma.service.create({
      data: {
        tenantId,
        ...serviceData,
      },
    });

    // Assign resources
    if (resourceIds && resourceIds.length > 0) {
      await this.assignResources(service.id, resourceIds);
    }

    return service;
  }

  /**
   * Update service
   */
  async updateService(id: string, tenantId: string, data: any) {
    await this.getService(id, tenantId); // Verify exists

    const { resourceIds, ...serviceData } = data;

    const service = await this.prisma.service.update({
      where: { id },
      data: serviceData,
    });

    // Update resources if provided
    if (resourceIds !== undefined) {
      // Remove existing
      await this.prisma.serviceResource.deleteMany({
        where: { serviceId: id },
      });

      // Add new
      if (resourceIds.length > 0) {
        await this.assignResources(id, resourceIds);
      }
    }

    return service;
  }

  /**
   * Delete service
   */
  async deleteService(id: string, tenantId: string) {
    await this.getService(id, tenantId); // Verify exists

    // Check if service has appointments
    const appointmentCount = await this.prisma.appointment.count({
      where: {
        serviceId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (appointmentCount > 0) {
      throw new BadRequestException(
        'Cannot delete service with active appointments. Deactivate instead.'
      );
    }

    await this.prisma.service.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Toggle service status
   */
  async toggleServiceStatus(id: string, tenantId: string) {
    const service = await this.getService(id, tenantId);

    const updated = await this.prisma.service.update({
      where: { id },
      data: { isActive: !service.isActive },
    });

    return updated;
  }

  /**
   * Assign resources to service
   */
  private async assignResources(serviceId: string, resourceIds: string[]) {
    await this.prisma.serviceResource.createMany({
      data: resourceIds.map((resourceId) => ({
        serviceId,
        resourceId,
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Get service categories
   */
  async getCategories(tenantId: string) {
    const services = await this.prisma.service.findMany({
      where: { tenantId },
      select: { category: true },
      distinct: ['category'],
    });

    return services
      .map((s) => s.category)
      .filter(Boolean)
      .sort();
  }
}
