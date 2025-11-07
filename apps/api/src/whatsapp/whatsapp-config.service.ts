import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, WhatsAppTemplateType } from '@retail/database';

@Injectable()
export class WhatsAppConfigService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get configuration
   */
  async getConfig(tenantId: string) {
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { tenantId },
      include: {
        templates: {
          where: { isActive: true },
        },
      },
    });

    return config;
  }

  /**
   * Create or update configuration
   */
  async upsertConfig(tenantId: string, data: {
    phoneNumber?: string;
    businessName?: string;
    notificationsEnabled?: boolean;
    orderConfirmations?: boolean;
    stockAlerts?: boolean;
    paymentReminders?: boolean;
  }) {
    const config = await this.prisma.whatsAppConfig.upsert({
      where: { tenantId },
      create: {
        tenantId,
        ...data,
      },
      update: data,
    });

    return config;
  }

  /**
   * Get templates
   */
  async getTemplates(tenantId: string) {
    const config = await this.getConfig(tenantId);
    if (!config) {
      throw new NotFoundException('WhatsApp configuration not found');
    }

    const templates = await this.prisma.whatsAppTemplate.findMany({
      where: { tenantId },
      orderBy: { type: 'asc' },
    });

    return templates;
  }

  /**
   * Create template
   */
  async createTemplate(tenantId: string, data: {
    name: string;
    type: any;
    content: string;
    language?: string;
    variables?: any;
    mediaUrl?: string;
    mediaType?: string;
    buttons?: any;
  }) {
    const config = await this.getConfig(tenantId);
    if (!config) {
      throw new NotFoundException('WhatsApp configuration not found');
    }

    const template = await this.prisma.whatsAppTemplate.create({
      data: {
        tenantId,
        configId: config.id,
        ...data,
      },
    });

    return template;
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, tenantId: string, data: any) {
    const template = await this.prisma.whatsAppTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    const updated = await this.prisma.whatsAppTemplate.update({
      where: { id },
      data,
    });

    return updated;
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string, tenantId: string) {
    const template = await this.prisma.whatsAppTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await this.prisma.whatsAppTemplate.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Create default templates
   */
  async createDefaultTemplates(tenantId: string) {
    const config = await this.getConfig(tenantId);
    if (!config) {
      throw new NotFoundException('WhatsApp configuration not found');
    }

    const defaultTemplates = [
      {
        name: 'Confirmación de Pedido',
        type: 'ORDER_CONFIRMATION',
        content: `¡Hola {customerName}! 👋

Tu pedido #{orderNumber} ha sido confirmado exitosamente.

📦 Total: ${'{totalAmount}'}
📅 Fecha: ${'{orderDate}'}

Gracias por tu compra. Te notificaremos cuando esté listo para retirar/enviar.

¿Necesitas ayuda? Responde este mensaje.`,
      },
      {
        name: 'Pedido Listo',
        type: 'ORDER_READY',
        content: `¡Hola {customerName}! 🎉

Tu pedido #{orderNumber} está listo para ${'{deliveryMethod}'}.

📍 ${'{locationAddress}'}
⏰ Horario: ${'{businessHours}'}

¡Te esperamos!`,
      },
      {
        name: 'Recordatorio de Pago',
        type: 'PAYMENT_REMINDER',
        content: `Hola {customerName},

Te recordamos que tienes un saldo pendiente:

💰 Monto: ${'{amount}'}
📅 Vencimiento: ${'{dueDate}'}

Puedes realizar el pago en nuestro local o transferencia bancaria.

¿Necesitas ayuda? Responde este mensaje.`,
      },
      {
        name: 'Alerta de Stock',
        type: 'STOCK_ALERT',
        content: `¡Buenas noticias! 🎊

El producto "${'{productName}'}" que buscabas ya está disponible en stock.

💵 Precio: ${'{price}'}
📦 Stock: ${'{quantity}'} unidades

¿Te interesa? Responde este mensaje o visítanos.`,
      },
      {
        name: 'Bienvenida',
        type: 'WELCOME',
        content: `¡Bienvenido/a {customerName}! 👋

Gracias por registrarte en ${'{businessName}'}.

Estamos para ayudarte. ¿En qué podemos asistirte hoy?`,
      },
    ];

    const templates = await Promise.all(
      defaultTemplates.map((template) =>
        this.prisma.whatsAppTemplate.create({
          data: {
            tenantId,
            configId: config.id,
            name: template.name,
            type: template.type as WhatsAppTemplateType,
            content: template.content,
          },
        })
      )
    );

    return templates;
  }
}
