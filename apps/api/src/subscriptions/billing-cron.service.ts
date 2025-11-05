import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BillingService } from './billing.service';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaClient, SubscriptionStatus } from '@retail/database';
import { Inject } from '@nestjs/common';
import * as dayjs from 'dayjs';

@Injectable()
export class BillingCronService {
  private readonly logger = new Logger(BillingCronService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private billingService: BillingService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  /**
   * Process due invoices - runs every day at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async processDueInvoices() {
    this.logger.log('Starting daily billing process...');

    try {
      const processed = await this.billingService.processDueInvoices();
      this.logger.log(`Processed ${processed} due subscriptions`);
    } catch (error) {
      this.logger.error('Failed to process due invoices:', error);
    }
  }

  /**
   * Process trial expirations - runs every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processTrialExpirations() {
    this.logger.log('Checking for trial expirations...');

    try {
      const expiredTrials = await this.prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.TRIAL,
          trialEndDate: {
            lte: new Date(),
          },
        },
      });

      for (const subscription of expiredTrials) {
        try {
          // Convert trial to active and generate first invoice
          await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: SubscriptionStatus.ACTIVE,
            },
          });

          // Generate first invoice
          await this.billingService.generateInvoice(subscription.id);

          this.logger.log(
            `Trial expired for subscription ${subscription.id}, converted to active`
          );
        } catch (error) {
          this.logger.error(
            `Failed to process trial expiration for subscription ${subscription.id}:`,
            error
          );
        }
      }

      this.logger.log(`Processed ${expiredTrials.length} trial expirations`);
    } catch (error) {
      this.logger.error('Failed to process trial expirations:', error);
    }
  }

  /**
   * Process cancelled subscriptions - runs daily at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async processCancelledSubscriptions() {
    this.logger.log('Processing cancelled subscriptions...');

    try {
      const expiredCancellations = await this.prisma.subscription.findMany({
        where: {
          status: SubscriptionStatus.CANCELLED,
          cancelAtPeriodEnd: true,
          currentPeriodEnd: {
            lte: new Date(),
          },
        },
      });

      for (const subscription of expiredCancellations) {
        try {
          await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: SubscriptionStatus.EXPIRED,
              endedAt: new Date(),
            },
          });

          this.logger.log(`Expired cancelled subscription: ${subscription.id}`);
        } catch (error) {
          this.logger.error(
            `Failed to expire subscription ${subscription.id}:`,
            error
          );
        }
      }

      this.logger.log(
        `Processed ${expiredCancellations.length} cancelled subscriptions`
      );
    } catch (error) {
      this.logger.error('Failed to process cancelled subscriptions:', error);
    }
  }

  /**
   * Check for past due subscriptions - runs every 6 hours
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async checkPastDueSubscriptions() {
    this.logger.log('Checking for past due subscriptions...');

    try {
      // Find subscriptions with unpaid invoices older than 7 days
      const pastDueDate = dayjs().subtract(7, 'day').toDate();

      const pastDueInvoices = await this.prisma.subscriptionInvoice.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            lte: pastDueDate,
          },
        },
        include: {
          subscription: true,
        },
      });

      for (const invoice of pastDueInvoices) {
        try {
          // Mark invoice as failed
          await this.billingService.markInvoiceFailed(invoice.id);

          this.logger.warn(
            `Marked invoice ${invoice.invoiceNumber} as failed (past due)`
          );
        } catch (error) {
          this.logger.error(
            `Failed to mark invoice ${invoice.id} as failed:`,
            error
          );
        }
      }

      this.logger.log(`Processed ${pastDueInvoices.length} past due invoices`);
    } catch (error) {
      this.logger.error('Failed to check past due subscriptions:', error);
    }
  }

  /**
   * Send payment reminders - runs daily at 10 AM
   */
  @Cron('0 10 * * *')
  async sendPaymentReminders() {
    this.logger.log('Sending payment reminders...');

    try {
      // Find invoices due in 3 days
      const reminderDate = dayjs().add(3, 'day').toDate();
      const reminderStart = dayjs(reminderDate).startOf('day').toDate();
      const reminderEnd = dayjs(reminderDate).endOf('day').toDate();

      const upcomingInvoices = await this.prisma.subscriptionInvoice.findMany({
        where: {
          status: 'PENDING',
          dueDate: {
            gte: reminderStart,
            lte: reminderEnd,
          },
        },
        include: {
          subscription: {
            include: {
              plan: true,
            },
          },
          customer: true,
        },
      });

      for (const invoice of upcomingInvoices) {
        // In a real application, you would send email/notification here
        this.logger.log(
          `Payment reminder for invoice ${invoice.invoiceNumber} (customer: ${invoice.customer.name})`
        );
      }

      this.logger.log(`Sent ${upcomingInvoices.length} payment reminders`);
    } catch (error) {
      this.logger.error('Failed to send payment reminders:', error);
    }
  }

  /**
   * Clean up expired usage records - runs weekly on Sunday at 4 AM
   */
  @Cron('0 4 * * 0')
  async cleanupUsageRecords() {
    this.logger.log('Cleaning up old usage records...');

    try {
      // Delete usage records older than 90 days
      const cutoffDate = dayjs().subtract(90, 'day').toDate();

      const result = await this.prisma.usageRecord.deleteMany({
        where: {
          recordDate: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Deleted ${result.count} old usage records`);
    } catch (error) {
      this.logger.error('Failed to clean up usage records:', error);
    }
  }
}
