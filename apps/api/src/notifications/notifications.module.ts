import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailProcessor } from './processors/email.processor';
import { SmsService } from './services/sms.service';
import { PushService } from './services/push.service';
import { InAppService } from './services/in-app.service';
import { NotificationsGateway } from './notifications.gateway';
import { JwtModule } from '@nestjs/jwt';
import { join } from 'path';
import { handlebarsHelpers } from './helpers/handlebars-helpers';

@Module({
  imports: [
    // Mailer configuration
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      defaults: {
        from: `"${process.env.SMTP_FROM_NAME || 'Retail Super App'}" <${process.env.SMTP_FROM_EMAIL}>`,
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(handlebarsHelpers),
        options: {
          strict: true,
        },
      },
    }),

    // Bull Queue for async email processing
    BullModule.registerQueue({
      name: 'email',
    }),
    BullModule.registerQueue({
      name: 'sms',
    }),
    BullModule.registerQueue({
      name: 'push',
    }),

    // JWT for WebSocket authentication
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    EmailProcessor,
    SmsService,
    PushService,
    InAppService,
    NotificationsGateway,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
