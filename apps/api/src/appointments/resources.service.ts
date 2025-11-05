import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient, ResourceType } from '@retail/database';

@Injectable()
export class ResourcesService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get all resources
   */
  async getResources(tenantId: string, options?: {
    isActive?: boolean;
    type?: ResourceType;
  }) {
    const where: any = { tenantId };

    if (options?.isActive !== undefined) {
      where.isActive = options.isActive;
    }

    if (options?.type) {
      where.type = options.type;
    }

    const resources = await this.prisma.resource.findMany({
      where,
      include: {
        services: {
          include: {
            service: true,
          },
        },
        availability: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return resources;
  }

  /**
   * Get resource by ID
   */
  async getResource(id: string, tenantId: string) {
    const resource = await this.prisma.resource.findFirst({
      where: { id, tenantId },
      include: {
        services: {
          include: {
            service: true,
          },
        },
        availability: {
          where: { isActive: true },
          orderBy: { dayOfWeek: 'asc' },
        },
        blackoutDates: {
          where: {
            endDate: { gte: new Date() },
          },
          orderBy: { startDate: 'asc' },
        },
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    });

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
  }

  /**
   * Create resource
   */
  async createResource(tenantId: string, data: {
    name: string;
    type: ResourceType;
    description?: string;
    imageUrl?: string;
    email?: string;
    phone?: string;
  }) {
    const resource = await this.prisma.resource.create({
      data: {
        tenantId,
        ...data,
      },
    });

    return resource;
  }

  /**
   * Update resource
   */
  async updateResource(id: string, tenantId: string, data: any) {
    await this.getResource(id, tenantId); // Verify exists

    const resource = await this.prisma.resource.update({
      where: { id },
      data,
    });

    return resource;
  }

  /**
   * Delete resource
   */
  async deleteResource(id: string, tenantId: string) {
    await this.getResource(id, tenantId); // Verify exists

    // Check if resource has appointments
    const appointmentCount = await this.prisma.appointment.count({
      where: {
        resourceId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (appointmentCount > 0) {
      throw new BadRequestException(
        'Cannot delete resource with active appointments. Deactivate instead.'
      );
    }

    await this.prisma.resource.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Toggle resource status
   */
  async toggleResourceStatus(id: string, tenantId: string) {
    const resource = await this.getResource(id, tenantId);

    const updated = await this.prisma.resource.update({
      where: { id },
      data: { isActive: !resource.isActive },
    });

    return updated;
  }

  /**
   * Set resource availability
   */
  async setAvailability(resourceId: string, tenantId: string, availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>) {
    await this.getResource(resourceId, tenantId); // Verify exists

    // Delete existing availability
    await this.prisma.resourceAvailability.deleteMany({
      where: { resourceId },
    });

    // Create new availability
    if (availability.length > 0) {
      await this.prisma.resourceAvailability.createMany({
        data: availability.map((slot) => ({
          resourceId,
          ...slot,
        })),
      });
    }

    return { success: true };
  }

  /**
   * Get resource availability
   */
  async getAvailability(resourceId: string, tenantId: string) {
    await this.getResource(resourceId, tenantId); // Verify exists

    const availability = await this.prisma.resourceAvailability.findMany({
      where: {
        resourceId,
        isActive: true,
      },
      orderBy: { dayOfWeek: 'asc' },
    });

    return availability;
  }

  /**
   * Add blackout date
   */
  async addBlackoutDate(tenantId: string, data: {
    resourceId?: string;
    startDate: Date;
    endDate: Date;
    reason: string;
  }) {
    // Validate dates
    if (data.endDate < data.startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const blackoutDate = await this.prisma.blackoutDate.create({
      data: {
        tenantId,
        ...data,
      },
    });

    return blackoutDate;
  }

  /**
   * Get blackout dates
   */
  async getBlackoutDates(tenantId: string, resourceId?: string) {
    const where: any = {
      tenantId,
      endDate: { gte: new Date() },
    };

    if (resourceId) {
      where.OR = [
        { resourceId },
        { resourceId: null }, // Global blackouts
      ];
    }

    const blackoutDates = await this.prisma.blackoutDate.findMany({
      where,
      include: {
        resource: true,
      },
      orderBy: { startDate: 'asc' },
    });

    return blackoutDates;
  }

  /**
   * Delete blackout date
   */
  async deleteBlackoutDate(id: string, tenantId: string) {
    const blackoutDate = await this.prisma.blackoutDate.findFirst({
      where: { id, tenantId },
    });

    if (!blackoutDate) {
      throw new NotFoundException('Blackout date not found');
    }

    await this.prisma.blackoutDate.delete({
      where: { id },
    });

    return { success: true };
  }
}
