import { Module } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { LocationInventoryService } from './location-inventory.service';
import { StockTransfersService } from './stock-transfers.service';
import { FranchiseService } from './franchise.service';
import { LocationsController } from './locations.controller';

@Module({
  controllers: [LocationsController],
  providers: [
    LocationsService,
    LocationInventoryService,
    StockTransfersService,
    FranchiseService,
  ],
  exports: [
    LocationsService,
    LocationInventoryService,
    StockTransfersService,
    FranchiseService,
  ],
})
export class LocationsModule {}
