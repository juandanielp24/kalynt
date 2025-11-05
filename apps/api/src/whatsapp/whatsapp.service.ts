import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient, WhatsAppTemplateType, MessageDirection, MessageStatus } from '@retail/database';
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';
import * as crypto from 'crypto';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private clients: Map<string, Client> = new Map();

  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Initialize WhatsApp client for tenant
   */
  async initializeClient(tenantId: string): Promise<void> {
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { tenantId },
    });

    if (!config) {
      throw new Error('WhatsApp configuration not found for tenant');
    }

    // Check if client already exists
    if (this.clients.has(tenantId)) {
      const client = this.clients.get(tenantId);
      if (client) {
        const state = await client.getState();
        if (state === 'CONNECTED') {
          this.logger.log(`Client already connected for tenant ${tenantId}`);
          return;
        }
      }
    }

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: `tenant_${tenantId}`,
      }),
      puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      },
    });

    // QR Code event
    client.on('qr', (qr) => {
      this.logger.log(`QR Code for tenant ${tenantId}:`);
      qrcode.generate(qr, { small: true });
      // TODO: Emit QR to frontend via WebSocket or save to database
    });

    // Ready event
    client.on('ready', async () => {
      this.logger.log(`WhatsApp client ready for tenant ${tenantId}`);

      // Update connection status
      await this.prisma.whatsAppConfig.update({
        where: { tenantId },
        data: {
          isConnected: true,
          lastConnected: new Date(),
        },
      });
    });

    // Authenticated event
    client.on('authenticated', () => {
      this.logger.log(`WhatsApp client authenticated for tenant ${tenantId}`);
    });

    // Disconnected event
    client.on('disconnected', async (reason) => {
      this.logger.warn(`WhatsApp client disconnected for tenant ${tenantId}: ${reason}`);

      await this.prisma.whatsAppConfig.update({
        where: { tenantId },
        data: { isConnected: false },
      });

      this.clients.delete(tenantId);
    });

    // Message received event
    client.on('message', async (message: Message) => {
      await this.handleIncomingMessage(tenantId, message);
    });

    // Initialize client
    await client.initialize();
    this.clients.set(tenantId, client);
  }

  /**
   * Get client for tenant
   */
  private getClient(tenantId: string): Client {
    const client = this.clients.get(tenantId);
    if (!client) {
      throw new Error('WhatsApp client not initialized for tenant');
    }
    return client;
  }

  /**
   * Check if client is connected
   */
  async isConnected(tenantId: string): Promise<boolean> {
    try {
      const client = this.getClient(tenantId);
      const state = await client.getState();
      return state === 'CONNECTED';
    } catch (error) {
      return false;
    }
  }

  /**
   * Send message
   */
  async sendMessage(
    tenantId: string,
    phoneNumber: string,
    content: string,
    metadata?: any
  ): Promise<string> {
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { tenantId },
    });

    if (!config || !config.notificationsEnabled) {
      throw new Error('WhatsApp notifications are disabled for this tenant');
    }

    // Format phone number (remove spaces, dashes, etc.)
    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    // Create message record
    const messageRecord = await this.prisma.whatsAppMessage.create({
      data: {
        tenantId,
        configId: config.id,
        phoneNumber: formattedPhone,
        content,
        direction: MessageDirection.OUTGOING,
        status: MessageStatus.PENDING,
        metadata,
      },
    });

    try {
      const client = this.getClient(tenantId);

      // Send message
      const sentMessage = await client.sendMessage(
        `${formattedPhone}@c.us`,
        content
      );

      // Update message record
      await this.prisma.whatsAppMessage.update({
        where: { id: messageRecord.id },
        data: {
          messageId: sentMessage.id.id,
          status: MessageStatus.SENT,
          sentAt: new Date(),
        },
      });

      this.logger.log(`Message sent to ${formattedPhone} for tenant ${tenantId}`);

      return messageRecord.id;
    } catch (error) {
      this.logger.error(`Failed to send message: ${error.message}`);

      // Update message record with error
      await this.prisma.whatsAppMessage.update({
        where: { id: messageRecord.id },
        data: {
          status: MessageStatus.FAILED,
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Send message using template
   */
  async sendTemplateMessage(
    tenantId: string,
    phoneNumber: string,
    templateType: WhatsAppTemplateType,
    variables: Record<string, any>
  ): Promise<string> {
    // Get template
    const template = await this.prisma.whatsAppTemplate.findFirst({
      where: {
        tenantId,
        type: templateType,
        isActive: true,
      },
    });

    if (!template) {
      throw new Error(`Template ${templateType} not found for tenant`);
    }

    // Replace variables in content
    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{${key}}`, 'g'), String(value));
    });

    // Send message
    return this.sendMessage(tenantId, phoneNumber, content, {
      templateId: template.id,
      templateType,
      variables,
    });
  }

  /**
   * Send message with media
   */
  async sendMessageWithMedia(
    tenantId: string,
    phoneNumber: string,
    content: string,
    mediaUrl: string,
    mediaType: 'image' | 'video' | 'document',
    metadata?: any
  ): Promise<string> {
    const config = await this.prisma.whatsAppConfig.findUnique({
      where: { tenantId },
    });

    if (!config || !config.notificationsEnabled) {
      throw new Error('WhatsApp notifications are disabled for this tenant');
    }

    const formattedPhone = this.formatPhoneNumber(phoneNumber);

    const messageRecord = await this.prisma.whatsAppMessage.create({
      data: {
        tenantId,
        configId: config.id,
        phoneNumber: formattedPhone,
        content,
        direction: MessageDirection.OUTGOING,
        status: MessageStatus.PENDING,
        metadata: { ...metadata, mediaUrl, mediaType },
      },
    });

    try {
      const client = this.getClient(tenantId);

      // Download media
      const { MessageMedia } = await import('whatsapp-web.js');
      const media = await MessageMedia.fromUrl(mediaUrl);

      // Send message with media
      const sentMessage = await client.sendMessage(
        `${formattedPhone}@c.us`,
        media,
        { caption: content }
      );

      await this.prisma.whatsAppMessage.update({
        where: { id: messageRecord.id },
        data: {
          messageId: sentMessage.id.id,
          status: MessageStatus.SENT,
          sentAt: new Date(),
        },
      });

      return messageRecord.id;
    } catch (error) {
      this.logger.error(`Failed to send media message: ${error.message}`);

      await this.prisma.whatsAppMessage.update({
        where: { id: messageRecord.id },
        data: {
          status: MessageStatus.FAILED,
          error: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleIncomingMessage(tenantId: string, message: Message): Promise<void> {
    try {
      const config = await this.prisma.whatsAppConfig.findUnique({
        where: { tenantId },
      });

      if (!config) return;

      // Save incoming message
      await this.prisma.whatsAppMessage.create({
        data: {
          tenantId,
          configId: config.id,
          messageId: message.id.id,
          phoneNumber: message.from.replace('@c.us', ''),
          content: message.body,
          direction: MessageDirection.INCOMING,
          status: MessageStatus.DELIVERED,
          sentAt: new Date(message.timestamp * 1000),
          deliveredAt: new Date(),
        },
      });

      this.logger.log(`Incoming message received for tenant ${tenantId}: ${message.body}`);

      // TODO: Process incoming message (auto-replies, commands, etc.)
    } catch (error) {
      this.logger.error(`Failed to handle incoming message: ${error.message}`);
    }
  }

  /**
   * Format phone number
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-numeric characters
    let formatted = phoneNumber.replace(/\D/g, '');

    // Add country code if not present (assuming Argentina +54)
    if (!formatted.startsWith('54') && formatted.length === 10) {
      formatted = '54' + formatted;
    }

    return formatted;
  }

  /**
   * Get message status
   */
  async getMessageStatus(messageId: string, tenantId: string) {
    const message = await this.prisma.whatsAppMessage.findFirst({
      where: { id: messageId, tenantId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    return message.status;
  }

  /**
   * Get messages
   */
  async getMessages(tenantId: string, options?: {
    phoneNumber?: string;
    direction?: MessageDirection;
    status?: MessageStatus;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { tenantId };

    if (options?.phoneNumber) {
      where.phoneNumber = options.phoneNumber;
    }

    if (options?.direction) {
      where.direction = options.direction;
    }

    if (options?.status) {
      where.status = options.status;
    }

    const [messages, total] = await Promise.all([
      this.prisma.whatsAppMessage.findMany({
        where,
        include: {
          template: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: options?.offset || 0,
        take: options?.limit || 50,
      }),
      this.prisma.whatsAppMessage.count({ where }),
    ]);

    return {
      messages,
      total,
      page: Math.floor((options?.offset || 0) / (options?.limit || 50)) + 1,
      totalPages: Math.ceil(total / (options?.limit || 50)),
    };
  }

  /**
   * Get message statistics
   */
  async getMessageStats(tenantId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [total, sent, delivered, read, failed] = await Promise.all([
      this.prisma.whatsAppMessage.count({
        where: {
          tenantId,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.whatsAppMessage.count({
        where: {
          tenantId,
          status: MessageStatus.SENT,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.whatsAppMessage.count({
        where: {
          tenantId,
          status: MessageStatus.DELIVERED,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.whatsAppMessage.count({
        where: {
          tenantId,
          status: MessageStatus.READ,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.whatsAppMessage.count({
        where: {
          tenantId,
          status: MessageStatus.FAILED,
          createdAt: { gte: startDate },
        },
      }),
    ]);

    return {
      total,
      sent,
      delivered,
      read,
      failed,
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
      readRate: delivered > 0 ? (read / delivered) * 100 : 0,
      failureRate: total > 0 ? (failed / total) * 100 : 0,
    };
  }

  /**
   * Disconnect client
   */
  async disconnect(tenantId: string): Promise<void> {
    const client = this.clients.get(tenantId);
    if (client) {
      await client.destroy();
      this.clients.delete(tenantId);

      await this.prisma.whatsAppConfig.update({
        where: { tenantId },
        data: { isConnected: false },
      });
    }
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    for (const [tenantId, client] of this.clients.entries()) {
      try {
        await client.destroy();
      } catch (error) {
        this.logger.error(`Failed to destroy client for tenant ${tenantId}`);
      }
    }
    this.clients.clear();
  }
}
