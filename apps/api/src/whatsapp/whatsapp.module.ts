import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppConfigService } from './whatsapp-config.service';
import { WhatsAppNotificationsService } from './whatsapp-notifications.service';
import { WhatsAppEventsListener } from './whatsapp-events.listener';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppCronService } from './whatsapp.cron';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppService,
    WhatsAppConfigService,
    WhatsAppNotificationsService,
    WhatsAppEventsListener,
    WhatsAppCronService,
  ],
  exports: [
    WhatsAppService,
    WhatsAppConfigService,
    WhatsAppNotificationsService,
  ],
})
export class WhatsAppModule {}
