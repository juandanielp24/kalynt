import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryZonesService } from './delivery-zones.service';
import { DriversService } from './drivers.service';
import { DeliverySettingsService } from './delivery-settings.service';
import { DeliveryStatus, DriverStatus } from '@prisma/client';

// Note: These decorators and guards should be implemented in your project
// If they don't exist, you can remove them temporarily
// @UseGuards(AuthGuard)
// @RequirePermission(...)
// @AuditLog(...)
// @CurrentUser()

@Controller('delivery')
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly zonesService: DeliveryZonesService,
    private readonly driversService: DriversService,
    private readonly settingsService: DeliverySettingsService,
  ) {}

  // ==================== Deliveries ====================

  @Get()
  async getDeliveries(
    @Query('tenantId') tenantId: string,
    @Query('status') status?: DeliveryStatus,
    @Query('driverId') driverId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const result = await this.deliveryService.getDeliveries(tenantId, {
      status,
      driverId,
      zoneId,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });

    return {
      success: true,
      data: result,
    };
  }

  @Get('stats')
  async getStatistics(
    @Query('tenantId') tenantId: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const stats = await this.deliveryService.getStatistics(
      tenantId,
      dateFrom ? new Date(dateFrom) : undefined,
      dateTo ? new Date(dateTo) : undefined,
    );

    return {
      success: true,
      data: stats,
    };
  }

  @Get(':id')
  async getDelivery(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
  ) {
    const delivery = await this.deliveryService.getDelivery(tenantId, id);

    return {
      success: true,
      data: delivery,
    };
  }

  @Post()
  async createDelivery(
    @Body()
    data: {
      tenantId: string;
      saleId: string;
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
      scheduledFor?: string;
    },
  ) {
    const delivery = await this.deliveryService.createDeliveryFromSale(
      data.tenantId,
      data.saleId,
      {
        ...data,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined,
      },
    );

    return {
      success: true,
      data: delivery,
      message: 'Delivery created successfully',
    };
  }

  @Put(':id/assign')
  async assignDriver(
    @Param('id') id: string,
    @Body() data: { tenantId: string; driverId: string; assignedBy?: string },
  ) {
    const delivery = await this.deliveryService.assignDriver(
      data.tenantId,
      id,
      data.driverId,
      data.assignedBy,
    );

    return {
      success: true,
      data: delivery,
      message: 'Driver assigned successfully',
    };
  }

  @Put(':id/auto-assign')
  async autoAssign(
    @Param('id') id: string,
    @Body() data: { tenantId: string },
  ) {
    const delivery = await this.deliveryService.autoAssignDelivery(
      data.tenantId,
      id,
    );

    return {
      success: true,
      data: delivery,
      message: 'Delivery auto-assigned successfully',
    };
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body()
    data: {
      tenantId: string;
      status: DeliveryStatus;
      notes?: string;
      latitude?: number;
      longitude?: number;
      changedBy?: string;
      changedByType?: 'user' | 'driver';
    },
  ) {
    const delivery = await this.deliveryService.updateStatus(
      data.tenantId,
      id,
      data.status,
      data.notes,
      data.latitude,
      data.longitude,
      data.changedBy,
      data.changedByType,
    );

    return {
      success: true,
      data: delivery,
      message: 'Delivery status updated successfully',
    };
  }

  // ==================== Zones ====================

  @Get('zones/all')
  async getZones(
    @Query('tenantId') tenantId: string,
    @Query('isActive') isActive?: string,
  ) {
    const zones = await this.zonesService.getZones(
      tenantId,
      isActive !== undefined ? isActive === 'true' : undefined,
    );

    return {
      success: true,
      data: zones,
    };
  }

  @Get('zones/:id')
  async getZone(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
  ) {
    const zone = await this.zonesService.getZone(tenantId, id);

    return {
      success: true,
      data: zone,
    };
  }

  @Post('zones')
  async createZone(
    @Body()
    data: {
      tenantId: string;
      name: string;
      description?: string;
      postalCodes?: string[];
      neighborhoods?: string[];
      baseCost?: number;
      costPerKm?: number;
      freeDeliveryMin?: number;
      estimatedMinutes?: number;
      maxDeliveryTime?: number;
      isActive?: boolean;
      priority?: number;
    },
  ) {
    const { tenantId, ...zoneData } = data;
    const zone = await this.zonesService.createZone(tenantId, zoneData);

    return {
      success: true,
      data: zone,
      message: 'Delivery zone created successfully',
    };
  }

  @Put('zones/:id')
  async updateZone(
    @Param('id') id: string,
    @Body()
    data: {
      tenantId: string;
      name?: string;
      description?: string;
      postalCodes?: string[];
      neighborhoods?: string[];
      baseCost?: number;
      costPerKm?: number;
      freeDeliveryMin?: number;
      estimatedMinutes?: number;
      maxDeliveryTime?: number;
      isActive?: boolean;
      priority?: number;
    },
  ) {
    const { tenantId, ...zoneData } = data;
    const zone = await this.zonesService.updateZone(tenantId, id, zoneData);

    return {
      success: true,
      data: zone,
      message: 'Delivery zone updated successfully',
    };
  }

  @Delete('zones/:id')
  async deleteZone(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
  ) {
    await this.zonesService.deleteZone(tenantId, id);

    return {
      success: true,
      message: 'Delivery zone deleted successfully',
    };
  }

  @Post('zones/calculate-cost')
  async calculateDeliveryCost(
    @Body()
    data: {
      tenantId: string;
      zoneId: string;
      orderTotal: number;
      distance?: number;
    },
  ) {
    const cost = await this.zonesService.calculateDeliveryCost(
      data.tenantId,
      data.zoneId,
      data.orderTotal,
      data.distance,
    );

    return {
      success: true,
      data: { cost },
    };
  }

  // ==================== Drivers ====================

  @Get('drivers/all')
  async getDrivers(
    @Query('tenantId') tenantId: string,
    @Query('status') status?: DriverStatus,
    @Query('isActive') isActive?: string,
  ) {
    const drivers = await this.driversService.getDrivers(tenantId, {
      status,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });

    return {
      success: true,
      data: drivers,
    };
  }

  @Get('drivers/available')
  async getAvailableDrivers(@Query('tenantId') tenantId: string) {
    const drivers = await this.driversService.getAvailableDrivers(tenantId);

    return {
      success: true,
      data: drivers,
    };
  }

  @Get('drivers/:id')
  async getDriver(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
  ) {
    const driver = await this.driversService.getDriver(tenantId, id);

    return {
      success: true,
      data: driver,
    };
  }

  @Get('drivers/:id/stats')
  async getDriverStatistics(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
  ) {
    const stats = await this.driversService.getDriverStatistics(tenantId, id);

    return {
      success: true,
      data: stats,
    };
  }

  @Post('drivers')
  async createDriver(
    @Body()
    data: {
      tenantId: string;
      firstName: string;
      lastName: string;
      phone: string;
      email?: string;
      documentType?: string;
      documentNumber?: string;
      vehicleType: string;
      vehiclePlate?: string;
      vehicleModel?: string;
      userId?: string;
      isActive?: boolean;
    },
  ) {
    const { tenantId, ...driverData } = data;
    const driver = await this.driversService.createDriver(tenantId, driverData as any);

    return {
      success: true,
      data: driver,
      message: 'Driver created successfully',
    };
  }

  @Put('drivers/:id')
  async updateDriver(
    @Param('id') id: string,
    @Body()
    data: {
      tenantId: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      documentType?: string;
      documentNumber?: string;
      vehicleType?: string;
      vehiclePlate?: string;
      vehicleModel?: string;
      isActive?: boolean;
    },
  ) {
    const { tenantId, ...driverData } = data;
    const driver = await this.driversService.updateDriver(tenantId, id, driverData as any);

    return {
      success: true,
      data: driver,
      message: 'Driver updated successfully',
    };
  }

  @Put('drivers/:id/status')
  async updateDriverStatus(
    @Param('id') id: string,
    @Body() data: { tenantId: string; status: DriverStatus },
  ) {
    const driver = await this.driversService.updateDriverStatus(
      data.tenantId,
      id,
      data.status,
    );

    return {
      success: true,
      data: driver,
      message: 'Driver status updated successfully',
    };
  }

  @Put('drivers/:id/location')
  async updateDriverLocation(
    @Param('id') id: string,
    @Body()
    data: {
      tenantId: string;
      latitude: number;
      longitude: number;
    },
  ) {
    const driver = await this.driversService.updateDriverLocation(
      data.tenantId,
      id,
      data.latitude,
      data.longitude,
    );

    return {
      success: true,
      data: driver,
      message: 'Driver location updated successfully',
    };
  }

  @Delete('drivers/:id')
  async deleteDriver(
    @Param('id') id: string,
    @Query('tenantId') tenantId: string,
  ) {
    await this.driversService.deleteDriver(tenantId, id);

    return {
      success: true,
      message: 'Driver deleted successfully',
    };
  }

  // ==================== Settings ====================

  @Get('settings')
  async getSettings(@Query('tenantId') tenantId: string) {
    const settings = await this.settingsService.getSettings(tenantId);

    return {
      success: true,
      data: settings,
    };
  }

  @Put('settings')
  async updateSettings(
    @Body()
    data: {
      tenantId: string;
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
    const { tenantId, ...settingsData } = data;
    const settings = await this.settingsService.updateSettings(
      tenantId,
      settingsData,
    );

    return {
      success: true,
      data: settings,
      message: 'Delivery settings updated successfully',
    };
  }

  @Get('settings/working-hours-check')
  async checkWorkingHours(@Query('tenantId') tenantId: string) {
    const isWithinHours = await this.settingsService.isWithinWorkingHours(
      tenantId,
    );

    return {
      success: true,
      data: { isWithinHours },
    };
  }
}
