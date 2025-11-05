import { Module } from '@nestjs/common';
import { PlansService } from './plans.service';
import { SubscriptionsService } from './subscriptions.service';
import { BillingService } from './billing.service';
import { UsageService } from './usage.service';
import { SubscriptionsController } from './subscriptions.controller';
import { BillingCronService } from './billing-cron.service';

@Module({
  controllers: [SubscriptionsController],
  providers: [
    PlansService,
    SubscriptionsService,
    BillingService,
    UsageService,
    BillingCronService,
  ],
  exports: [
    PlansService,
    SubscriptionsService,
    BillingService,
    UsageService,
  ],
})
export class SubscriptionsModule {}
