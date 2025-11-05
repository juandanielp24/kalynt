import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient, InvoiceStatus, SubscriptionStatus } from '@retail/database';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as dayjs from 'dayjs';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Generate invoice for subscription
   */
  async generateInvoice(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        plan: true,
        customer: true,
        addons: {
          where: { isActive: true },
          include: {
            addon: true,
          },
        },
      },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(subscription.tenantId);

    // Calculate amounts
    const items: any[] = [];
    let subtotal = 0;

    // Add subscription line item
    items.push({
      type: 'subscription',
      description: subscription.plan.name,
      quantity: 1,
      unitPrice: subscription.price,
      amount: subscription.price,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
    });
    subtotal += subscription.price;

    // Add addons
    for (const subscriptionAddon of subscription.addons) {
      const amount = subscriptionAddon.price * subscriptionAddon.quantity;
      items.push({
        type: 'addon',
        description: subscriptionAddon.addon.name,
        quantity: subscriptionAddon.quantity,
        unitPrice: subscriptionAddon.price,
        amount,
      });
      subtotal += amount;
    }

    // Calculate tax (simple 10% for demo, should be configurable)
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    // Create invoice
    const invoice = await this.prisma.subscriptionInvoice.create({
      data: {
        tenantId: subscription.tenantId,
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        invoiceNumber,
        amount: subtotal,
        tax,
        total,
        currency: subscription.currency,
        periodStart: subscription.currentPeriodStart,
        periodEnd: subscription.currentPeriodEnd,
        status: InvoiceStatus.PENDING,
        issueDate: new Date(),
        dueDate: dayjs().add(7, 'day').toDate(), // 7 days to pay
        items,
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

    // Emit event
    this.eventEmitter.emit('invoice.created', {
      invoiceId: invoice.id,
      tenantId: invoice.tenantId,
      customerId: invoice.customerId,
      amount: invoice.total,
    });

    this.logger.log(`Invoice generated: ${invoice.invoiceNumber}`);

    return invoice;
  }

  /**
   * Process payment for invoice
   */
  async processPayment(invoiceId: string, paymentData: {
    paymentMethod: string;
    transactionId: string;
  }) {
    const invoice = await this.prisma.subscriptionInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        subscription: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new Error('Invoice already paid');
    }

    // Update invoice
    const updatedInvoice = await this.prisma.subscriptionInvoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        paymentMethod: paymentData.paymentMethod,
        transactionId: paymentData.transactionId,
      },
    });

    // Update subscription period
    await this.prisma.subscriptionPeriod.updateMany({
      where: {
        subscriptionId: invoice.subscriptionId,
        invoiceId: invoiceId,
      },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Emit event
    this.eventEmitter.emit('invoice.paid', {
      invoiceId: invoice.id,
      tenantId: invoice.tenantId,
      customerId: invoice.customerId,
      amount: invoice.total,
    });

    this.logger.log(`Invoice paid: ${invoice.invoiceNumber}`);

    return updatedInvoice;
  }

  /**
   * Mark invoice as failed
   */
  async markInvoiceFailed(invoiceId: string) {
    const invoice = await this.prisma.subscriptionInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        subscription: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Update invoice
    await this.prisma.subscriptionInvoice.update({
      where: { id: invoiceId },
      data: {
        status: InvoiceStatus.FAILED,
      },
    });

    // Update subscription status to PAST_DUE
    await this.prisma.subscription.update({
      where: { id: invoice.subscriptionId },
      data: {
        status: SubscriptionStatus.PAST_DUE,
      },
    });

    // Emit event
    this.eventEmitter.emit('invoice.failed', {
      invoiceId: invoice.id,
      tenantId: invoice.tenantId,
      customerId: invoice.customerId,
      subscriptionId: invoice.subscriptionId,
    });

    this.logger.warn(`Invoice payment failed: ${invoice.invoiceNumber}`);
  }

  /**
   * Get invoices for customer
   */
  async getCustomerInvoices(customerId: string, tenantId: string) {
    const invoices = await this.prisma.subscriptionInvoice.findMany({
      where: {
        customerId,
        tenantId,
      },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: { issueDate: 'desc' },
    });

    return invoices;
  }

  /**
   * Get invoice by ID
   */
  async getInvoice(id: string, tenantId: string) {
    const invoice = await this.prisma.subscriptionInvoice.findFirst({
      where: { id, tenantId },
      include: {
        subscription: {
          include: {
            plan: true,
          },
        },
        customer: true,
      },
    });

    return invoice;
  }

  /**
   * Generate invoice number
   */
  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.subscriptionInvoice.count({
      where: { tenantId },
    });

    const year = new Date().getFullYear();
    const number = (count + 1).toString().padStart(6, '0');

    return `INV-${year}-${number}`;
  }

  /**
   * Process all due invoices (should be run by cron)
   */
  async processDueInvoices() {
    const dueSubscriptions = await this.prisma.subscription.findMany({
      where: {
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL] },
        nextBillingDate: {
          lte: new Date(),
        },
      },
      include: {
        plan: true,
      },
    });

    this.logger.log(`Processing ${dueSubscriptions.length} due subscriptions`);

    for (const subscription of dueSubscriptions) {
      try {
        // If trial is ending, convert to active
        if (subscription.status === SubscriptionStatus.TRIAL) {
          await this.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
              status: SubscriptionStatus.ACTIVE,
            },
          });
        }

        // Generate invoice
        const invoice = await this.generateInvoice(subscription.id);

        // In a real application, you would trigger payment processing here
        // For now, we'll just create the invoice

        // Calculate next period
        const nextPeriodStart = subscription.currentPeriodEnd;
        const nextPeriodEnd = this.calculateNextPeriodEnd(
          nextPeriodStart,
          subscription.interval,
          subscription.intervalCount
        );

        // Update subscription
        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            currentPeriodStart: nextPeriodStart,
            currentPeriodEnd: nextPeriodEnd,
            nextBillingDate: nextPeriodEnd,
          },
        });

        // Create new period
        await this.prisma.subscriptionPeriod.create({
          data: {
            subscriptionId: subscription.id,
            startDate: nextPeriodStart,
            endDate: nextPeriodEnd,
            amount: subscription.price,
            status: 'BILLED',
            invoiceId: invoice.id,
          },
        });

        this.logger.log(`Processed billing for subscription: ${subscription.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to process subscription ${subscription.id}:`,
          error
        );
      }
    }

    return dueSubscriptions.length;
  }

  /**
   * Calculate next period end
   */
  private calculateNextPeriodEnd(startDate: Date, interval: string, intervalCount: number): Date {
    let endDate = dayjs(startDate);

    switch (interval) {
      case 'DAILY':
        endDate = endDate.add(intervalCount, 'day');
        break;
      case 'WEEKLY':
        endDate = endDate.add(intervalCount, 'week');
        break;
      case 'MONTHLY':
        endDate = endDate.add(intervalCount, 'month');
        break;
      case 'QUARTERLY':
        endDate = endDate.add(intervalCount * 3, 'month');
        break;
      case 'YEARLY':
        endDate = endDate.add(intervalCount, 'year');
        break;
    }

    return endDate.toDate();
  }

  /**
   * Get billing statistics
   */
  async getBillingStatistics(tenantId: string, startDate?: Date, endDate?: Date) {
    const where: any = { tenantId };

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) where.issueDate.gte = startDate;
      if (endDate) where.issueDate.lte = endDate;
    }

    const [
      totalInvoices,
      paidInvoices,
      revenue,
      pending,
    ] = await Promise.all([
      this.prisma.subscriptionInvoice.count({ where }),
      this.prisma.subscriptionInvoice.count({
        where: { ...where, status: InvoiceStatus.PAID },
      }),
      this.prisma.subscriptionInvoice.aggregate({
        where: { ...where, status: InvoiceStatus.PAID },
        _sum: { total: true },
      }),
      this.prisma.subscriptionInvoice.aggregate({
        where: { ...where, status: InvoiceStatus.PENDING },
        _sum: { total: true },
      }),
    ]);

    return {
      totalInvoices,
      paidInvoices,
      failedInvoices: totalInvoices - paidInvoices,
      totalRevenue: revenue._sum.total || 0,
      pendingAmount: pending._sum.total || 0,
      collectionRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
    };
  }
}
