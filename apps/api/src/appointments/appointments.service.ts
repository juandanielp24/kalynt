import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient, AppointmentStatus } from '@retail/database';
import { AvailabilityService } from './availability.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as dayjs from 'dayjs';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private availabilityService: AvailabilityService,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Get all appointments
   */
  async getAppointments(tenantId: string, options?: {
    status?: AppointmentStatus;
    serviceId?: string;
    resourceId?: string;
    customerId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { tenantId };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.serviceId) {
      where.serviceId = options.serviceId;
    }

    if (options?.resourceId) {
      where.resourceId = options.resourceId;
    }

    if (options?.customerId) {
      where.customerId = options.customerId;
    }

    if (options?.startDate || options?.endDate) {
      where.startTime = {};
      if (options.startDate) {
        where.startTime.gte = options.startDate;
      }
      if (options.endDate) {
        where.startTime.lte = options.endDate;
      }
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        service: true,
        resource: true,
        customer: true,
        location: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return appointments;
  }

  /**
   * Get appointment by ID
   */
  async getAppointment(id: string, tenantId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id, tenantId },
      include: {
        service: true,
        resource: true,
        customer: true,
        location: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return appointment;
  }

  /**
   * Create appointment
   */
  async createAppointment(tenantId: string, userId: string, data: {
    serviceId: string;
    resourceId?: string;
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    locationId?: string;
    startTime: Date;
    notes?: string;
    internalNotes?: string;
    autoConfirm?: boolean;
  }) {
    // Get service
    const service = await this.prisma.service.findFirst({
      where: { id: data.serviceId, tenantId },
    });

    if (!service || !service.isActive) {
      throw new BadRequestException('Service not available');
    }

    // Calculate end time
    const startTime = dayjs(data.startTime);
    const endTime = startTime.add(service.duration, 'minute');

    // Determine resource
    let resourceId: string | null | undefined = data.resourceId;

    if (!resourceId) {
      // Find available resource
      resourceId = await this.findAvailableResource(
        data.serviceId,
        data.startTime,
        endTime.toDate()
      );

      if (!resourceId) {
        throw new BadRequestException('No available resources for this time');
      }
    }

    // Verify slot is available
    const isAvailable = await this.availabilityService.isSlotAvailable(
      data.serviceId,
      resourceId,
      data.startTime,
      endTime.toDate(),
      service.maxCapacity
    );

    if (!isAvailable) {
      throw new BadRequestException('Time slot is not available');
    }

    // Check blackout dates
    const isBlackedOut = await this.availabilityService.isDateBlackedOut(
      tenantId,
      resourceId,
      data.startTime
    );

    if (isBlackedOut) {
      throw new BadRequestException('This date is not available');
    }

    // Validate customer info
    if (!data.customerId && !data.customerName) {
      throw new BadRequestException('Customer information is required');
    }

    // Create appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        tenantId,
        serviceId: data.serviceId,
        resourceId,
        customerId: data.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        locationId: data.locationId,
        startTime: data.startTime,
        endTime: endTime.toDate(),
        notes: data.notes,
        internalNotes: data.internalNotes,
        status: data.autoConfirm ? AppointmentStatus.CONFIRMED : AppointmentStatus.PENDING,
        confirmedAt: data.autoConfirm ? new Date() : undefined,
      },
      include: {
        service: true,
        resource: true,
        customer: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('appointment.created', {
      appointmentId: appointment.id,
      tenantId,
      customerId: data.customerId,
      status: appointment.status,
    });

    this.logger.log(`Appointment created: ${appointment.id}`);

    return appointment;
  }

  /**
   * Update appointment
   */
  async updateAppointment(id: string, tenantId: string, data: any) {
    const existing = await this.getAppointment(id, tenantId);

    // If rescheduling, validate new time
    if (data.startTime && data.startTime !== existing.startTime) {
      const service = await this.prisma.service.findUnique({
        where: { id: existing.serviceId },
      });

      if (!service) {
        throw new BadRequestException('Service not found');
      }

      const endTime = dayjs(data.startTime).add(service.duration, 'minute');

      const isAvailable = await this.availabilityService.isSlotAvailable(
        existing.serviceId,
        existing.resourceId!,
        data.startTime,
        endTime.toDate(),
        service.maxCapacity
      );

      if (!isAvailable) {
        throw new BadRequestException('New time slot is not available');
      }

      data.endTime = endTime.toDate();
    }

    const appointment = await this.prisma.appointment.update({
      where: { id },
      data,
      include: {
        service: true,
        resource: true,
        customer: true,
      },
    });

    // Emit event if rescheduled
    if (data.startTime) {
      this.eventEmitter.emit('appointment.rescheduled', {
        appointmentId: appointment.id,
        tenantId,
        oldStartTime: existing.startTime,
        newStartTime: appointment.startTime,
      });
    }

    return appointment;
  }

  /**
   * Cancel appointment
   */
  async cancelAppointment(id: string, tenantId: string, userId: string, reason?: string) {
    const appointment = await this.getAppointment(id, tenantId);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Appointment already cancelled');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel completed appointment');
    }

    // Check cancellation deadline
    const service = await this.prisma.service.findUnique({
      where: { id: appointment.serviceId },
    });

    if (service?.cancellationDeadline) {
      const hoursUntil = dayjs(appointment.startTime).diff(dayjs(), 'hour');
      if (hoursUntil < service.cancellationDeadline) {
        throw new BadRequestException(
          `Cancellation must be made at least ${service.cancellationDeadline} hours in advance`
        );
      }
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancellationReason: reason,
        cancelledBy: userId,
      },
      include: {
        service: true,
        resource: true,
        customer: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('appointment.cancelled', {
      appointmentId: updated.id,
      tenantId,
      customerId: updated.customerId,
    });

    this.logger.log(`Appointment cancelled: ${id}`);

    return updated;
  }

  /**
   * Confirm appointment
   */
  async confirmAppointment(id: string, tenantId: string) {
    const appointment = await this.getAppointment(id, tenantId);

    if (appointment.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Only pending appointments can be confirmed');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CONFIRMED,
        confirmedAt: new Date(),
      },
      include: {
        service: true,
        resource: true,
        customer: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('appointment.confirmed', {
      appointmentId: updated.id,
      tenantId,
      customerId: updated.customerId,
    });

    return updated;
  }

  /**
   * Check in appointment
   */
  async checkInAppointment(id: string, tenantId: string) {
    const appointment = await this.getAppointment(id, tenantId);

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Appointment already completed');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot check in cancelled appointment');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CHECKED_IN,
      },
      include: {
        service: true,
        resource: true,
        customer: true,
      },
    });

    return updated;
  }

  /**
   * Complete appointment
   */
  async completeAppointment(id: string, tenantId: string) {
    const appointment = await this.getAppointment(id, tenantId);

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('Appointment already completed');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot complete cancelled appointment');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.COMPLETED,
      },
      include: {
        service: true,
        resource: true,
        customer: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('appointment.completed', {
      appointmentId: updated.id,
      tenantId,
      customerId: updated.customerId,
      serviceId: updated.serviceId,
    });

    return updated;
  }

  /**
   * Mark as no-show
   */
  async markNoShow(id: string, tenantId: string) {
    const appointment = await this.getAppointment(id, tenantId);

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.NO_SHOW,
        noShow: true,
      },
    });

    // Emit event
    this.eventEmitter.emit('appointment.noshow', {
      appointmentId: updated.id,
      tenantId,
      customerId: updated.customerId,
    });

    return updated;
  }

  /**
   * Find available resource for a service at a specific time
   */
  private async findAvailableResource(
    serviceId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<string | null> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        resources: {
          include: {
            resource: true,
          },
        },
      },
    });

    if (!service || service.resources.length === 0) {
      return null;
    }

    // Check each resource
    for (const sr of service.resources) {
      const resource = sr.resource;

      if (!resource.isActive) {
        continue;
      }

      const isAvailable = await this.availabilityService.isSlotAvailable(
        serviceId,
        resource.id,
        startTime,
        endTime,
        service.maxCapacity
      );

      if (isAvailable) {
        return resource.id;
      }
    }

    return null;
  }

  /**
   * Get appointment statistics
   */
  async getStatistics(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };

    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = startDate;
      if (endDate) where.startTime.lte = endDate;
    }

    const [
      total,
      byStatus,
      byService,
      byResource,
      noShowCount,
    ] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
      this.prisma.appointment.groupBy({
        by: ['serviceId'],
        where,
        _count: true,
      }),
      this.prisma.appointment.groupBy({
        by: ['resourceId'],
        where: { ...where, resourceId: { not: null } },
        _count: true,
      }),
      this.prisma.appointment.count({
        where: { ...where, noShow: true },
      }),
    ]);

    // Calculate no-show rate
    const noShowRate = total > 0 ? (noShowCount / total) * 100 : 0;

    return {
      total,
      byStatus,
      byService,
      byResource,
      noShowCount,
      noShowRate,
    };
  }

  /**
   * Get upcoming appointments for a customer
   */
  async getCustomerUpcomingAppointments(customerId: string, limit: number = 5) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        customerId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startTime: { gte: new Date() },
      },
      include: {
        service: true,
        resource: true,
        location: true,
      },
      orderBy: { startTime: 'asc' },
      take: limit,
    });

    return appointments;
  }

  /**
   * Send appointment reminders
   */
  async sendReminders(hoursBeforeAppointment: number = 24) {
    const reminderTime = dayjs().add(hoursBeforeAppointment, 'hour');
    const startRange = reminderTime.startOf('hour').toDate();
    const endRange = reminderTime.endOf('hour').toDate();

    const appointments = await this.prisma.appointment.findMany({
      where: {
        status: { in: ['PENDING', 'CONFIRMED'] },
        startTime: {
          gte: startRange,
          lte: endRange,
        },
        reminderSentAt: null,
      },
      include: {
        service: true,
        resource: true,
        customer: true,
      },
    });

    for (const appointment of appointments) {
      // Emit event for reminder (to be handled by notification service)
      this.eventEmitter.emit('appointment.reminder', {
        appointmentId: appointment.id,
        customerId: appointment.customerId,
        customerEmail: appointment.customerEmail || appointment.customer?.email,
        customerPhone: appointment.customerPhone || appointment.customer?.phone,
        startTime: appointment.startTime,
        serviceName: appointment.service.name,
        resourceName: appointment.resource?.name,
      });

      // Mark reminder as sent
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { reminderSentAt: new Date() },
      });

      this.logger.log(`Reminder sent for appointment: ${appointment.id}`);
    }

    return appointments.length;
  }
}
