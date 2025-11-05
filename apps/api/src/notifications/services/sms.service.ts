import { Injectable, Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Twilio } from 'twilio';
import { SmsNotification } from '../notifications.service';

@Injectable()
@Processor('sms')
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private twilioClient: Twilio | null = null;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      this.twilioClient = new Twilio(accountSid, authToken);
    } else {
      this.logger.warn('Twilio credentials not configured. SMS disabled.');
    }
  }

  @Process('send-sms')
  async handleSendSms(job: Job<SmsNotification>) {
    const { data } = job;

    if (!this.twilioClient) {
      this.logger.warn('SMS skipped - Twilio not configured');
      return { success: false, reason: 'not_configured' };
    }

    this.logger.log(`Sending SMS to ${data.to}`);

    try {
      const result = await this.twilioClient.messages.create({
        body: data.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: data.to,
      });

      this.logger.log(`SMS sent successfully to ${data.to}. SID: ${result.sid}`);

      return { success: true, sid: result.sid };
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${data.to}:`, error);
      throw error;
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): boolean {
    // Basic validation for international format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }
}
