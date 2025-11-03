import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { AFIPService } from '@retail/ar';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [ConfigModule, forwardRef(() => NotificationsModule)],
  controllers: [SalesController],
  providers: [
    SalesService,
    AFIPService,
    {
      provide: 'NOTIFICATIONS_SERVICE',
      useExisting: NotificationsService,
    },
  ],
  exports: [SalesService],
})
export class SalesModule {}
