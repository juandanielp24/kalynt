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
import { AppointmentsService } from './appointments.service';
import { ServicesService } from './services.service';
import { ResourcesService } from './resources.service';
import { AvailabilityService } from './availability.service';
import { BookingEngineService } from './booking-engine.service';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RequirePermission } from '@/rbac/decorators/require-permission.decorator';
import { AuditLog } from '@/rbac/interceptors/audit-log.interceptor';
import { PermissionResource, PermissionAction, ResourceType, AppointmentStatus } from '@retail/database';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('appointments')
@UseGuards(AuthGuard)
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly servicesService: ServicesService,
    private readonly resourcesService: ResourcesService,
    private readonly availabilityService: AvailabilityService,
    private readonly bookingEngine: BookingEngineService,
  ) {}

  // ==================== Services ====================

  @Get('services')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  async getServices(
    @CurrentUser() user: any,
    @Query('isActive') isActive?: string,
    @Query('category') category?: string,
  ) {
    const services = await this.servicesService.getServices(user.tenantId, {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      category,
    });

    return {
      success: true,
      data: services,
    };
  }

  @Get('services/:id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  async getService(@CurrentUser() user: any, @Param('id') id: string) {
    const service = await this.servicesService.getService(id, user.tenantId);

    return {
      success: true,
      data: service,
    };
  }

  @Post('services')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'SERVICE' })
  async createService(@CurrentUser() user: any, @Body() data: any) {
    const service = await this.servicesService.createService(user.tenantId, data);

    return {
      success: true,
      data: service,
      message: 'Service created successfully',
    };
  }

  @Put('services/:id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'SERVICE' })
  async updateService(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    const service = await this.servicesService.updateService(id, user.tenantId, data);

    return {
      success: true,
      data: service,
      message: 'Service updated successfully',
    };
  }

  @Delete('services/:id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.DELETE)
  @AuditLog({ action: 'DELETE', entity: 'SERVICE' })
  async deleteService(@CurrentUser() user: any, @Param('id') id: string) {
    await this.servicesService.deleteService(id, user.tenantId);

    return {
      success: true,
      message: 'Service deleted successfully',
    };
  }

  @Put('services/:id/toggle')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'SERVICE' })
  async toggleServiceStatus(@CurrentUser() user: any, @Param('id') id: string) {
    const service = await this.servicesService.toggleServiceStatus(id, user.tenantId);

    return {
      success: true,
      data: service,
      message: `Service ${service.isActive ? 'activated' : 'deactivated'}`,
    };
  }

  @Get('services/categories/list')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  async getServiceCategories(@CurrentUser() user: any) {
    const categories = await this.servicesService.getCategories(user.tenantId);

    return {
      success: true,
      data: categories,
    };
  }

  // ==================== Resources ====================

  @Get('resources')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  async getResources(
    @CurrentUser() user: any,
    @Query('isActive') isActive?: string,
    @Query('type') type?: ResourceType,
  ) {
    const resources = await this.resourcesService.getResources(user.tenantId, {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      type,
    });

    return {
      success: true,
      data: resources,
    };
  }

  @Get('resources/:id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  async getResource(@CurrentUser() user: any, @Param('id') id: string) {
    const resource = await this.resourcesService.getResource(id, user.tenantId);

    return {
      success: true,
      data: resource,
    };
  }

  @Post('resources')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'RESOURCE' })
  async createResource(@CurrentUser() user: any, @Body() data: any) {
    const resource = await this.resourcesService.createResource(user.tenantId, data);

    return {
      success: true,
      data: resource,
      message: 'Resource created successfully',
    };
  }

  @Put('resources/:id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'RESOURCE' })
  async updateResource(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    const resource = await this.resourcesService.updateResource(id, user.tenantId, data);

    return {
      success: true,
      data: resource,
      message: 'Resource updated successfully',
    };
  }

  @Delete('resources/:id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.DELETE)
  @AuditLog({ action: 'DELETE', entity: 'RESOURCE' })
  async deleteResource(@CurrentUser() user: any, @Param('id') id: string) {
    await this.resourcesService.deleteResource(id, user.tenantId);

    return {
      success: true,
      message: 'Resource deleted successfully',
    };
  }

  @Put('resources/:id/toggle')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'RESOURCE' })
  async toggleResourceStatus(@CurrentUser() user: any, @Param('id') id: string) {
    const resource = await this.resourcesService.toggleResourceStatus(id, user.tenantId);

    return {
      success: true,
      data: resource,
      message: `Resource ${resource.isActive ? 'activated' : 'deactivated'}`,
    };
  }

  @Post('resources/:id/availability')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'RESOURCE_AVAILABILITY' })
  async setResourceAvailability(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { availability: any[] },
  ) {
    await this.resourcesService.setAvailability(id, user.tenantId, data.availability);

    return {
      success: true,
      message: 'Availability updated successfully',
    };
  }

  @Get('resources/:id/availability')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  async getResourceAvailability(@CurrentUser() user: any, @Param('id') id: string) {
    const availability = await this.resourcesService.getAvailability(id, user.tenantId);

    return {
      success: true,
      data: availability,
    };
  }

  // ==================== Blackout Dates ====================

  @Get('blackout-dates')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  async getBlackoutDates(
    @CurrentUser() user: any,
    @Query('resourceId') resourceId?: string,
  ) {
    const blackoutDates = await this.resourcesService.getBlackoutDates(
      user.tenantId,
      resourceId
    );

    return {
      success: true,
      data: blackoutDates,
    };
  }

  @Post('blackout-dates')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'BLACKOUT_DATE' })
  async addBlackoutDate(@CurrentUser() user: any, @Body() data: any) {
    const blackoutDate = await this.resourcesService.addBlackoutDate(
      user.tenantId,
      data
    );

    return {
      success: true,
      data: blackoutDate,
      message: 'Blackout date added successfully',
    };
  }

  @Delete('blackout-dates/:id')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.DELETE)
  @AuditLog({ action: 'DELETE', entity: 'BLACKOUT_DATE' })
  async deleteBlackoutDate(@CurrentUser() user: any, @Param('id') id: string) {
    await this.resourcesService.deleteBlackoutDate(id, user.tenantId);

    return {
      success: true,
      message: 'Blackout date deleted successfully',
    };
  }

  // ==================== Appointments ====================

  @Get()
  @RequirePermission(PermissionResource.SALES, PermissionAction.READ)
  async getAppointments(
    @CurrentUser() user: any,
    @Query('status') status?: AppointmentStatus,
    @Query('serviceId') serviceId?: string,
    @Query('resourceId') resourceId?: string,
    @Query('customerId') customerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const appointments = await this.appointmentsService.getAppointments(
      user.tenantId,
      {
        status,
        serviceId,
        resourceId,
        customerId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      }
    );

    return {
      success: true,
      data: appointments,
    };
  }

  @Get(':id')
  @RequirePermission(PermissionResource.SALES, PermissionAction.READ)
  async getAppointment(@CurrentUser() user: any, @Param('id') id: string) {
    const appointment = await this.appointmentsService.getAppointment(id, user.tenantId);

    return {
      success: true,
      data: appointment,
    };
  }

  @Post()
  @RequirePermission(PermissionResource.SALES, PermissionAction.CREATE)
  @AuditLog({ action: 'CREATE', entity: 'APPOINTMENT' })
  async createAppointment(@CurrentUser() user: any, @Body() data: any) {
    const appointment = await this.appointmentsService.createAppointment(
      user.tenantId,
      user.id,
      data
    );

    return {
      success: true,
      data: appointment,
      message: 'Appointment created successfully',
    };
  }

  @Put(':id')
  @RequirePermission(PermissionResource.SALES, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'APPOINTMENT' })
  async updateAppointment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    const appointment = await this.appointmentsService.updateAppointment(
      id,
      user.tenantId,
      data
    );

    return {
      success: true,
      data: appointment,
      message: 'Appointment updated successfully',
    };
  }

  @Put(':id/cancel')
  @RequirePermission(PermissionResource.SALES, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'APPOINTMENT' })
  async cancelAppointment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() data: { reason?: string },
  ) {
    const appointment = await this.appointmentsService.cancelAppointment(
      id,
      user.tenantId,
      user.id,
      data.reason
    );

    return {
      success: true,
      data: appointment,
      message: 'Appointment cancelled successfully',
    };
  }

  @Put(':id/confirm')
  @RequirePermission(PermissionResource.SALES, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'APPOINTMENT' })
  async confirmAppointment(@CurrentUser() user: any, @Param('id') id: string) {
    const appointment = await this.appointmentsService.confirmAppointment(
      id,
      user.tenantId
    );

    return {
      success: true,
      data: appointment,
      message: 'Appointment confirmed successfully',
    };
  }

  @Put(':id/checkin')
  @RequirePermission(PermissionResource.SALES, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'APPOINTMENT' })
  async checkInAppointment(@CurrentUser() user: any, @Param('id') id: string) {
    const appointment = await this.appointmentsService.checkInAppointment(
      id,
      user.tenantId
    );

    return {
      success: true,
      data: appointment,
      message: 'Customer checked in successfully',
    };
  }

  @Put(':id/complete')
  @RequirePermission(PermissionResource.SALES, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'APPOINTMENT' })
  async completeAppointment(@CurrentUser() user: any, @Param('id') id: string) {
    const appointment = await this.appointmentsService.completeAppointment(
      id,
      user.tenantId
    );

    return {
      success: true,
      data: appointment,
      message: 'Appointment completed successfully',
    };
  }

  @Put(':id/no-show')
  @RequirePermission(PermissionResource.SALES, PermissionAction.UPDATE)
  @AuditLog({ action: 'UPDATE', entity: 'APPOINTMENT' })
  async markNoShow(@CurrentUser() user: any, @Param('id') id: string) {
    const appointment = await this.appointmentsService.markNoShow(id, user.tenantId);

    return {
      success: true,
      data: appointment,
      message: 'Appointment marked as no-show',
    };
  }

  // ==================== Availability & Booking ====================

  @Get('services/:serviceId/availability')
  async getAvailableSlots(
    @Param('serviceId') serviceId: string,
    @Query('date') date: string,
    @Query('resourceId') resourceId?: string,
  ) {
    const slots = await this.availabilityService.getAvailableSlots(
      serviceId,
      new Date(date),
      resourceId
    );

    return {
      success: true,
      data: slots,
    };
  }

  @Post('book')
  async book(@CurrentUser() user: any, @Body() data: any) {
    const result = await this.bookingEngine.book(user.tenantId, data);

    return result;
  }

  @Get('statistics')
  @RequirePermission(PermissionResource.SALES, PermissionAction.READ)
  async getStatistics(
    @CurrentUser() user: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.appointmentsService.getStatistics(
      user.tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return {
      success: true,
      data: stats,
    };
  }

  @Get('resources/:resourceId/occupancy')
  @RequirePermission(PermissionResource.SETTINGS, PermissionAction.READ)
  async getOccupancy(
    @Param('resourceId') resourceId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const occupancy = await this.bookingEngine.calculateOccupancy(
      resourceId,
      new Date(startDate),
      new Date(endDate)
    );

    return {
      success: true,
      data: occupancy,
    };
  }
}
