import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { EmailProvider } from './providers/email/email.provider';

@Module({
  imports: [ConfigModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
