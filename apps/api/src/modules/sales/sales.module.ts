import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
// TODO: Create @retail/ar package for AFIP integration
// import { AFIPService } from '@retail/ar';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  imports: [ConfigModule, forwardRef(() => NotificationsModule)],
  controllers: [SalesController],
  providers: [
    SalesService,
    // TODO: Re-enable when @retail/ar package is created
    // AFIPService,
    {
      provide: 'NOTIFICATIONS_SERVICE',
      useExisting: NotificationsService,
    },
  ],
  exports: [SalesService],
})
export class SalesModule {}
