import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import { AvailabilityService } from './availability.service';
import { AppointmentsService } from './appointments.service';
import * as dayjs from 'dayjs';

interface BookingRequest {
  serviceId: string;
  date: Date;
  timeSlot?: Date;
  resourceId?: string;
  customerId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
}

interface BookingResult {
  success: boolean;
  appointment?: any;
  availableSlots?: any[];
  message?: string;
}

@Injectable()
export class BookingEngineService {
  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private availabilityService: AvailabilityService,
    private appointmentsService: AppointmentsService,
  ) {}

  /**
   * Main booking flow
   */
  async book(tenantId: string, request: BookingRequest): Promise<BookingResult> {
    // Step 1: Validate service
    const service = await this.prisma.service.findFirst({
      where: { id: request.serviceId, tenantId, isActive: true },
    });

    if (!service) {
      throw new BadRequestException('Service not available');
    }

    // Step 2: If no time slot provided, return available slots
    if (!request.timeSlot) {
      const availableSlots = await this.availabilityService.getAvailableSlots(
        request.serviceId,
        request.date,
        request.resourceId
      );

      return {
        success: false,
        availableSlots: availableSlots.filter((slot) => slot.available),
        message: 'Please select a time slot',
      };
    }

    // Step 3: Validate time slot
    const startTime = dayjs(request.timeSlot);
    const endTime = startTime.add(service.duration, 'minute');

    // Step 4: Find or validate resource
    let resourceId = request.resourceId;

    if (!resourceId) {
      const serviceWithResources = await this.prisma.service.findUnique({
        where: { id: request.serviceId },
        include: {
          resources: {
            include: { resource: true },
          },
        },
      });

      if (serviceWithResources?.resources && serviceWithResources.resources.length > 0) {
        // Find first available resource
        for (const sr of serviceWithResources.resources) {
          const available = await this.availabilityService.isSlotAvailable(
            request.serviceId,
            sr.resource.id,
            startTime.toDate(),
            endTime.toDate(),
            service.maxCapacity
          );

          if (available) {
            resourceId = sr.resource.id;
            break;
          }
        }
      }

      if (!resourceId) {
        return {
          success: false,
          message: 'No available resources for this time',
        };
      }
    }

    // Step 5: Verify availability
    const isAvailable = await this.availabilityService.isSlotAvailable(
      request.serviceId,
      resourceId,
      startTime.toDate(),
      endTime.toDate(),
      service.maxCapacity
    );

    if (!isAvailable) {
      return {
        success: false,
        message: 'Time slot is no longer available',
      };
    }

    // Step 6: Create appointment
    try {
      const appointment = await this.appointmentsService.createAppointment(
        tenantId,
        'system', // Or pass actual user ID
        {
          serviceId: request.serviceId,
          resourceId,
          customerId: request.customerId,
          customerName: request.customerName,
          customerEmail: request.customerEmail,
          customerPhone: request.customerPhone,
          startTime: startTime.toDate(),
          notes: request.notes,
          autoConfirm: true, // Auto-confirm online bookings
        }
      );

      return {
        success: true,
        appointment,
        message: 'Appointment booked successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to book appointment',
      };
    }
  }

  /**
   * Check service availability for a date range
   */
  async checkAvailability(
    serviceId: string,
    startDate: Date,
    endDate: Date,
    resourceId?: string
  ) {
    const days: any[] = [];
    let currentDate = dayjs(startDate);
    const end = dayjs(endDate);

    while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
      const slots = await this.availabilityService.getAvailableSlots(
        serviceId,
        currentDate.toDate(),
        resourceId
      );

      const availableCount = slots.filter((s) => s.available).length;

      days.push({
        date: currentDate.format('YYYY-MM-DD'),
        totalSlots: slots.length,
        availableSlots: availableCount,
        hasAvailability: availableCount > 0,
      });

      currentDate = currentDate.add(1, 'day');
    }

    return days;
  }

  /**
   * Get next available slot for a service
   */
  async getNextAvailableSlot(serviceId: string, resourceId?: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return null;
    }

    // Check next 30 days
    let currentDate = dayjs();
    const maxDate = currentDate.add(30, 'day');

    while (currentDate.isBefore(maxDate)) {
      const slots = await this.availabilityService.getAvailableSlots(
        serviceId,
        currentDate.toDate(),
        resourceId
      );

      const availableSlot = slots.find((s) => s.available);

      if (availableSlot) {
        return {
          date: currentDate.format('YYYY-MM-DD'),
          startTime: availableSlot.startTime,
          endTime: availableSlot.endTime,
          resourceId: availableSlot.resourceId,
        };
      }

      currentDate = currentDate.add(1, 'day');
    }

    return null;
  }

  /**
   * Reschedule appointment
   */
  async reschedule(
    appointmentId: string,
    tenantId: string,
    newStartTime: Date,
    resourceId?: string
  ) {
    const appointment = await this.appointmentsService.getAppointment(
      appointmentId,
      tenantId
    );

    const service = await this.prisma.service.findUnique({
      where: { id: appointment.serviceId },
    });

    if (!service) {
      throw new BadRequestException('Service not found');
    }

    const endTime = dayjs(newStartTime).add(service.duration, 'minute');

    // Use existing resource if not specified
    const targetResourceId = resourceId || appointment.resourceId;

    if (!targetResourceId) {
      throw new BadRequestException('Resource required');
    }

    // Check if new slot is available
    const isAvailable = await this.availabilityService.isSlotAvailable(
      appointment.serviceId,
      targetResourceId,
      newStartTime,
      endTime.toDate(),
      service.maxCapacity
    );

    if (!isAvailable) {
      throw new BadRequestException('New time slot is not available');
    }

    // Update appointment
    const updated = await this.appointmentsService.updateAppointment(
      appointmentId,
      tenantId,
      {
        startTime: newStartTime,
        endTime: endTime.toDate(),
        resourceId: targetResourceId,
      }
    );

    return updated;
  }

  /**
   * Get popular time slots
   */
  async getPopularTimeSlots(serviceId: string, limit: number = 5) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        serviceId,
        status: { in: ['CONFIRMED', 'COMPLETED'] },
      },
      select: {
        startTime: true,
      },
    });

    // Group by hour
    const hourCounts: Record<number, number> = {};

    appointments.forEach((apt) => {
      const hour = dayjs(apt.startTime).hour();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Sort by popularity
    const sorted = Object.entries(hourCounts)
      .map(([hour, count]) => ({
        hour: parseInt(hour),
        timeLabel: `${hour.toString().padStart(2, '0')}:00`,
        bookings: count,
      }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, limit);

    return sorted;
  }

  /**
   * Calculate occupancy rate
   */
  async calculateOccupancy(
    resourceId: string,
    startDate: Date,
    endDate: Date
  ) {
    const schedule = await this.availabilityService.getResourceSchedule(
      resourceId,
      startDate,
      endDate
    );

    const resource = await this.prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        availability: {
          where: { isActive: true },
        },
      },
    });

    if (!resource) {
      return { occupancyRate: 0, totalHours: 0, bookedHours: 0 };
    }

    // Calculate total available hours
    let totalMinutes = 0;
    const days = dayjs(endDate).diff(startDate, 'day') + 1;

    resource.availability.forEach((av) => {
      const [startHour, startMin] = av.startTime.split(':').map(Number);
      const [endHour, endMin] = av.endTime.split(':').map(Number);
      const minutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
      totalMinutes += minutes * days; // Multiply by number of days
    });

    // Calculate booked minutes
    const bookedMinutes = schedule.reduce((sum, apt) => {
      return sum + dayjs(apt.endTime).diff(apt.startTime, 'minute');
    }, 0);

    const occupancyRate = totalMinutes > 0 ? (bookedMinutes / totalMinutes) * 100 : 0;

    return {
      occupancyRate,
      totalHours: totalMinutes / 60,
      bookedHours: bookedMinutes / 60,
      appointmentCount: schedule.length,
    };
  }
}
