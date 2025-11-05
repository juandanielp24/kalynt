import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WhatsAppNotificationsService } from './whatsapp-notifications.service';

@Injectable()
export class WhatsAppCronService {
  private readonly logger = new Logger(WhatsAppCronService.name);

  constructor(
    private notificationsService: WhatsAppNotificationsService,
  ) {}

  /**
   * Send payment reminders every day at 9 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendPaymentReminders() {
    this.logger.log('Starting scheduled payment reminders...');
    try {
      await this.notificationsService.schedulePaymentReminders();
      this.logger.log('Scheduled payment reminders completed');
    } catch (error) {
      this.logger.error(`Failed to send scheduled payment reminders: ${error.message}`);
    }
  }
}
