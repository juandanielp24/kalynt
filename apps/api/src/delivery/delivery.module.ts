import { Module } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { DeliveryZonesService } from './delivery-zones.service';
import { DriversService } from './drivers.service';
import { DeliverySettingsService } from './delivery-settings.service';
import { DeliveryEventsListener } from './delivery-events.listener';
import { DeliveryController } from './delivery.controller';

@Module({
  controllers: [DeliveryController],
  providers: [
    DeliveryService,
    DeliveryZonesService,
    DriversService,
    DeliverySettingsService,
    DeliveryEventsListener,
  ],
  exports: [
    DeliveryService,
    DeliveryZonesService,
    DriversService,
    DeliverySettingsService,
  ],
})
export class DeliveryModule {}
