import { apiClient } from './client';

export interface WhatsAppConfig {
  id: string;
  tenantId: string;
  phoneNumber?: string;
  businessName?: string;
  notificationsEnabled: boolean;
  orderConfirmations: boolean;
  stockAlerts: boolean;
  paymentReminders: boolean;
  isConnected: boolean;
  lastConnected?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  type: WhatsAppTemplateType;
  language: string;
  content: string;
  variables?: any;
  mediaUrl?: string;
  mediaType?: string;
  buttons?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum WhatsAppTemplateType {
  ORDER_CONFIRMATION = 'ORDER_CONFIRMATION',
  ORDER_READY = 'ORDER_READY',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  STOCK_ALERT = 'STOCK_ALERT',
  WELCOME = 'WELCOME',
  CUSTOM = 'CUSTOM',
}

export enum MessageDirection {
  OUTGOING = 'OUTGOING',
  INCOMING = 'INCOMING',
}

export enum MessageStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export interface WhatsAppMessage {
  id: string;
  messageId?: string;
  phoneNumber: string;
  content: string;
  direction: MessageDirection;
  status: MessageStatus;
  metadata?: any;
  error?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  createdAt: string;
  template?: WhatsAppTemplate;
}

export const TEMPLATE_TYPE_LABELS: Record<WhatsAppTemplateType, string> = {
  ORDER_CONFIRMATION: 'Confirmación de Pedido',
  ORDER_READY: 'Pedido Listo',
  ORDER_DELIVERED: 'Pedido Entregado',
  PAYMENT_REMINDER: 'Recordatorio de Pago',
  PAYMENT_RECEIVED: 'Pago Recibido',
  STOCK_ALERT: 'Alerta de Stock',
  WELCOME: 'Bienvenida',
  CUSTOM: 'Personalizado',
};

export const whatsappApi = {
  // Configuration
  getConfig: async () => {
    const response = await apiClient.get('/whatsapp/config');
    return response.data;
  },

  updateConfig: async (data: Partial<WhatsAppConfig>) => {
    const response = await apiClient.put('/whatsapp/config', data);
    return response.data;
  },

  connect: async () => {
    const response = await apiClient.post('/whatsapp/connect');
    return response.data;
  },

  disconnect: async () => {
    const response = await apiClient.post('/whatsapp/disconnect');
    return response.data;
  },

  getStatus: async () => {
    const response = await apiClient.get('/whatsapp/status');
    return response.data;
  },

  // Templates
  getTemplates: async () => {
    const response = await apiClient.get('/whatsapp/templates');
    return response.data;
  },

  createTemplate: async (data: Partial<WhatsAppTemplate>) => {
    const response = await apiClient.post('/whatsapp/templates', data);
    return response.data;
  },

  updateTemplate: async (id: string, data: Partial<WhatsAppTemplate>) => {
    const response = await apiClient.put(`/whatsapp/templates/${id}`, data);
    return response.data;
  },

  deleteTemplate: async (id: string) => {
    const response = await apiClient.delete(`/whatsapp/templates/${id}`);
    return response.data;
  },

  createDefaultTemplates: async () => {
    const response = await apiClient.post('/whatsapp/templates/defaults');
    return response.data;
  },

  // Messages
  getMessages: async (params?: {
    phoneNumber?: string;
    direction?: MessageDirection;
    status?: MessageStatus;
    limit?: number;
    offset?: number;
  }) => {
    const response = await apiClient.get('/whatsapp/messages', { params });
    return response.data;
  },

  sendMessage: async (data: {
    phoneNumber: string;
    message: string;
    mediaUrl?: string;
  }) => {
    const response = await apiClient.post('/whatsapp/messages/send', data);
    return response.data;
  },

  sendBulkMessages: async (data: { phoneNumbers: string[]; message: string }) => {
    const response = await apiClient.post('/whatsapp/messages/bulk', data);
    return response.data;
  },

  getMessageStats: async (days?: number) => {
    const response = await apiClient.get('/whatsapp/messages/stats', {
      params: { days },
    });
    return response.data;
  },

  // Manual Notifications
  sendOrderConfirmation: async (saleId: string) => {
    const response = await apiClient.post(
      `/whatsapp/notifications/order-confirmation/${saleId}`
    );
    return response.data;
  },

  sendPaymentReminder: async (saleId: string) => {
    const response = await apiClient.post(
      `/whatsapp/notifications/payment-reminder/${saleId}`
    );
    return response.data;
  },
};
