import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoyaltyController } from './loyalty.controller';
import { LoyaltyProgramService } from './loyalty-program.service';
import { LoyaltyTiersService } from './loyalty-tiers.service';
import { LoyaltyMembersService } from './loyalty-members.service';
import { LoyaltyRewardsService } from './loyalty-rewards.service';
import { PointsEngineService } from './points-engine.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  controllers: [LoyaltyController],
  providers: [
    LoyaltyProgramService,
    LoyaltyTiersService,
    LoyaltyMembersService,
    LoyaltyRewardsService,
    PointsEngineService,
  ],
  exports: [
    LoyaltyProgramService,
    LoyaltyTiersService,
    LoyaltyMembersService,
    LoyaltyRewardsService,
    PointsEngineService,
  ],
})
export class LoyaltyModule {}
