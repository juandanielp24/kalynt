export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
  IN_APP = 'in_app',
  SMS = 'sms',
}

export enum NotificationTemplate {
  WELCOME = 'welcome',
  SALE_RECEIPT = 'sale-receipt',
  LOW_STOCK_ALERT = 'low-stock-alert',
  PASSWORD_RESET = 'password-reset',
  INVOICE_GENERATED = 'invoice-generated',
  PAYMENT_RECEIVED = 'payment-received',
  DAILY_SUMMARY = 'daily-summary',
}

export interface NotificationPayload {
  to: string; // email, device token, o user ID
  template: NotificationTemplate;
  data: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
  scheduleAt?: Date;
}

export interface EmailData {
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}
