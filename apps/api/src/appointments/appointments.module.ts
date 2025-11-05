import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { ServicesService } from './services.service';
import { ResourcesService } from './resources.service';
import { AvailabilityService } from './availability.service';
import { BookingEngineService } from './booking-engine.service';
import { AppointmentsController } from './appointments.controller';

@Module({
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    ServicesService,
    ResourcesService,
    AvailabilityService,
    BookingEngineService,
  ],
  exports: [
    AppointmentsService,
    ServicesService,
    ResourcesService,
    AvailabilityService,
    BookingEngineService,
  ],
})
export class AppointmentsModule {}
