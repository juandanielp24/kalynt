import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  available: boolean;
  resourceId?: string;
}

@Injectable()
export class AvailabilityService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get available time slots for a service on a specific date
   */
  async getAvailableSlots(
    serviceId: string,
    date: Date,
    resourceId?: string,
  ): Promise<TimeSlot[]> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        resources: {
          include: {
            resource: {
              include: {
                availability: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
    });

    if (!service) {
      return [];
    }

    // If specific resource requested, filter
    let resources = service.resources.map((sr) => sr.resource);
    if (resourceId) {
      resources = resources.filter((r) => r.id === resourceId);
    }

    if (resources.length === 0) {
      return [];
    }

    const slots: TimeSlot[] = [];
    const targetDate = dayjs(date);
    const dayOfWeek = targetDate.day();

    // For each resource, get their available slots
    for (const resource of resources) {
      // Get availability for this day of week
      const dayAvailability = resource.availability.filter(
        (av) => av.dayOfWeek === dayOfWeek
      );

      if (dayAvailability.length === 0) {
        continue;
      }

      // Check blackout dates
      const isBlackedOut = await this.isDateBlackedOut(
        service.tenantId,
        resource.id,
        date
      );

      if (isBlackedOut) {
        continue;
      }

      // For each availability period
      for (const period of dayAvailability) {
        const [startHour, startMinute] = period.startTime.split(':').map(Number);
        const [endHour, endMinute] = period.endTime.split(':').map(Number);

        let currentSlot = targetDate
          .hour(startHour)
          .minute(startMinute)
          .second(0)
          .millisecond(0);

        const periodEnd = targetDate
          .hour(endHour)
          .minute(endMinute)
          .second(0)
          .millisecond(0);

        // Generate time slots
        while (currentSlot.isBefore(periodEnd)) {
          const slotEnd = currentSlot.add(service.duration, 'minute');

          if (slotEnd.isAfter(periodEnd)) {
            break;
          }

          // Check if slot is in the past
          if (currentSlot.isBefore(dayjs())) {
            currentSlot = slotEnd.add(service.bufferAfter, 'minute');
            continue;
          }

          // Check min/max advance time
          const minutesFromNow = currentSlot.diff(dayjs(), 'minute');

          if (minutesFromNow < service.minAdvanceTime) {
            currentSlot = slotEnd.add(service.bufferAfter, 'minute');
            continue;
          }

          if (
            service.maxAdvanceTime &&
            minutesFromNow > service.maxAdvanceTime
          ) {
            break;
          }

          // Check if slot is available
          const isAvailable = await this.isSlotAvailable(
            serviceId,
            resource.id,
            currentSlot.toDate(),
            slotEnd.toDate(),
            service.maxCapacity
          );

          slots.push({
            startTime: currentSlot.toDate(),
            endTime: slotEnd.toDate(),
            available: isAvailable,
            resourceId: resource.id,
          });

          // Move to next slot (with buffer)
          currentSlot = slotEnd.add(service.bufferAfter, 'minute');
        }
      }
    }

    // Sort by time
    slots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return slots;
  }

  /**
   * Check if a specific time slot is available
   */
  async isSlotAvailable(
    serviceId: string,
    resourceId: string,
    startTime: Date,
    endTime: Date,
    maxCapacity: number = 1,
  ): Promise<boolean> {
    // Count existing appointments in this time range
    const existingCount = await this.prisma.appointment.count({
      where: {
        serviceId,
        resourceId,
        status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        OR: [
          // Overlapping appointments
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gt: startTime } },
            ],
          },
        ],
      },
    });

    return existingCount < maxCapacity;
  }

  /**
   * Check if date is blacked out
   */
  async isDateBlackedOut(
    tenantId: string,
    resourceId: string,
    date: Date,
  ): Promise<boolean> {
    const blackouts = await this.prisma.blackoutDate.count({
      where: {
        tenantId,
        OR: [
          { resourceId },
          { resourceId: null }, // Global blackouts
        ],
        AND: [
          { startDate: { lte: date } },
          { endDate: { gte: date } },
        ],
      },
    });

    return blackouts > 0;
  }

  /**
   * Get resource schedule for a date range
   */
  async getResourceSchedule(
    resourceId: string,
    startDate: Date,
    endDate: Date,
  ) {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        resourceId,
        status: { not: 'CANCELLED' },
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        service: true,
        customer: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return appointments;
  }
}
