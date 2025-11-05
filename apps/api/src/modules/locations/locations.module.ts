import { Module } from '@nestjs/common';
import { LocationsController } from './locations.controller';
import { StockTransfersController } from './stock-transfers.controller';
import { LocationAnalyticsController } from './location-analytics.controller';
import { LocationsService } from './locations.service';
import { StockTransfersService } from './stock-transfers.service';
import { LocationAnalyticsService } from './location-analytics.service';

@Module({
  controllers: [
    LocationsController,
    StockTransfersController,
    LocationAnalyticsController,
  ],
  providers: [
    LocationsService,
    StockTransfersService,
    LocationAnalyticsService,
  ],
  exports: [
    LocationsService,
    StockTransfersService,
    LocationAnalyticsService,
  ],
})
export class LocationsModule {}
