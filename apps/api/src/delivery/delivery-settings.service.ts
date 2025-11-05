import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DeliverySettingsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get delivery settings
   */
  async getSettings(tenantId: string) {
    let settings = await this.prisma.deliverySettings.findUnique({
      where: { tenantId },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await this.prisma.deliverySettings.create({
        data: {
          tenantId,
          enableDelivery: true,
          autoAssign: false,
          defaultBaseCost: parseFloat(process.env.DEFAULT_DELIVERY_COST || '500'),
          defaultCostPerKm: parseFloat(process.env.DEFAULT_COST_PER_KM || '50'),
          freeDeliveryEnabled: false,
          defaultEstimatedTime: 60,
          bufferTime: 15,
          notifyCustomerOnAssign: true,
          notifyCustomerOnPickup: true,
          notifyCustomerOnArrival: true,
          notifyCustomerOnDelivery: true,
        },
      });
    }

    return settings;
  }

  /**
   * Update delivery settings
   */
  async updateSettings(
    tenantId: string,
    data: {
      enableDelivery?: boolean;
      autoAssign?: boolean;
      defaultBaseCost?: number;
      defaultCostPerKm?: number;
      freeDeliveryEnabled?: boolean;
      freeDeliveryMinAmount?: number;
      defaultEstimatedTime?: number;
      bufferTime?: number;
      workingHoursStart?: string;
      workingHoursEnd?: string;
      notifyCustomerOnAssign?: boolean;
      notifyCustomerOnPickup?: boolean;
      notifyCustomerOnArrival?: boolean;
      notifyCustomerOnDelivery?: boolean;
    },
  ) {
    const settings = await this.prisma.deliverySettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        ...data,
      },
      update: data,
    });

    return settings;
  }

  /**
   * Check if within working hours
   */
  async isWithinWorkingHours(tenantId: string): Promise<boolean> {
    const settings = await this.getSettings(tenantId);

    if (!settings.workingHoursStart || !settings.workingHoursEnd) {
      return true; // No restrictions
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

    const [startHour, startMin] = settings.workingHoursStart.split(':').map(Number);
    const [endHour, endMin] = settings.workingHoursEnd.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Should notify customer
   */
  async shouldNotifyCustomer(
    tenantId: string,
    eventType: 'assign' | 'pickup' | 'arrival' | 'delivery',
  ): Promise<boolean> {
    const settings = await this.getSettings(tenantId);

    switch (eventType) {
      case 'assign':
        return settings.notifyCustomerOnAssign;
      case 'pickup':
        return settings.notifyCustomerOnPickup;
      case 'arrival':
        return settings.notifyCustomerOnArrival;
      case 'delivery':
        return settings.notifyCustomerOnDelivery;
      default:
        return false;
    }
  }
}
