import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { NotificationPayload, NotificationTemplate } from '../../notifications.types';

@Injectable()
export class EmailProvider {
  private readonly logger = new Logger(EmailProvider.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<NotificationTemplate, HandlebarsTemplateDelegate> = new Map();

  constructor(private configService: ConfigService) {
    // Configurar transporter (MailHog en dev, SMTP real en prod)
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST', 'localhost'),
      port: this.configService.get('SMTP_PORT', 1025),
      secure: this.configService.get('SMTP_SECURE', false),
      auth: this.configService.get('SMTP_USER')
        ? {
            user: this.configService.get('SMTP_USER'),
            pass: this.configService.get('SMTP_PASSWORD'),
          }
        : undefined,
    });

    // Pre-compilar templates
    this.loadTemplates();
  }

  private loadTemplates() {
    const templatesDir = path.join(__dirname, 'templates');
    const templateFiles = {
      [NotificationTemplate.WELCOME]: 'welcome.hbs',
      [NotificationTemplate.SALE_RECEIPT]: 'sale-receipt.hbs',
      [NotificationTemplate.LOW_STOCK_ALERT]: 'low-stock-alert.hbs',
      [NotificationTemplate.PASSWORD_RESET]: 'password-reset.hbs',
    };

    for (const [template, filename] of Object.entries(templateFiles)) {
      try {
        const templatePath = path.join(templatesDir, filename);
        const templateContent = fs.readFileSync(templatePath, 'utf-8');
        this.templates.set(
          template as NotificationTemplate,
          Handlebars.compile(templateContent)
        );
      } catch (error) {
        this.logger.warn(`Failed to load template ${filename}`, error);
      }
    }
  }

  async send(payload: NotificationPayload): Promise<void> {
    try {
      const template = this.templates.get(payload.template);
      if (!template) {
        throw new Error(`Template ${payload.template} not found`);
      }

      const html = template(payload.data);
      const subject = this.getSubject(payload.template, payload.data);

      await this.transporter.sendMail({
        from: this.configService.get('SMTP_FROM', 'noreply@retail-app.com'),
        to: payload.to,
        subject,
        html,
        text: this.htmlToText(html),
      });

      this.logger.log(`Email sent to ${payload.to} (${payload.template})`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${payload.to}`, error);
      throw error;
    }
  }

  private getSubject(template: NotificationTemplate, data: any): string {
    const subjects = {
      [NotificationTemplate.WELCOME]: `¡Bienvenido a Retail App, ${data.name}!`,
      [NotificationTemplate.SALE_RECEIPT]: `Comprobante de Venta #${data.saleNumber}`,
      [NotificationTemplate.LOW_STOCK_ALERT]: `⚠️ Stock bajo: ${data.productName}`,
      [NotificationTemplate.PASSWORD_RESET]: 'Recuperación de contraseña',
      [NotificationTemplate.INVOICE_GENERATED]: `Factura ${data.invoiceNumber} generada`,
      [NotificationTemplate.PAYMENT_RECEIVED]: 'Pago recibido exitosamente',
      [NotificationTemplate.DAILY_SUMMARY]: `Resumen de ventas - ${data.date}`,
    };

    return subjects[template] || 'Notificación de Retail App';
  }

  private htmlToText(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email provider verified successfully');
      return true;
    } catch (error) {
      this.logger.error('Email provider verification failed', error);
      return false;
    }
  }
}
