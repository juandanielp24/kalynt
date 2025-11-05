import { Module } from '@nestjs/common';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { CouponsService } from './coupons.service';
import { DiscountEngineService } from './discount-engine.service';

@Module({
  controllers: [PromotionsController],
  providers: [
    PromotionsService,
    CouponsService,
    DiscountEngineService,
  ],
  exports: [
    PromotionsService,
    CouponsService,
    DiscountEngineService,
  ],
})
export class PromotionsModule {}
