import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';
import { EmailNotification } from '../notifications.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailerService: MailerService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailNotification>) {
    const { data } = job;

    this.logger.log(
      `Sending email to ${data.to} with template ${data.template}`,
    );

    try {
      await this.mailerService.sendMail({
        to: data.to,
        from: data.from,
        subject: data.subject,
        template: data.template,
        context: data.context,
        attachments: data.attachments,
      });

      this.logger.log(`Email sent successfully to ${data.to}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send email to ${data.to}:`, error);
      throw error;
    }
  }
}
