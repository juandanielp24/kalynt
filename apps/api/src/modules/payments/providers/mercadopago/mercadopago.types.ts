export interface MercadoPagoConfig {
  accessToken: string;
  publicKey: string;
  webhookSecret: string;
  production: boolean;
}

export interface MercadoPagoPaymentRequest {
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  external_reference?: string;
  notification_url?: string;
  metadata?: Record<string, any>;
}

export interface MercadoPagoQRRequest {
  external_reference: string;
  title: string;
  description: string;
  total_amount: number;
  items: Array<{
    sku_number: string;
    category: string;
    title: string;
    description: string;
    unit_price: number;
    quantity: number;
    unit_measure: string;
    total_amount: number;
  }>;
  notification_url: string;
}

export interface MercadoPagoWebhook {
  id: number;
  live_mode: boolean;
  type: string;
  date_created: string;
  application_id: number;
  user_id: number;
  version: number;
  api_version: string;
  action: string;
  data: {
    id: string;
  };
}

export interface MercadoPagoPaymentInfo {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  date_approved?: string;
  date_created: string;
  date_last_updated: string;
  money_release_date?: string;
  operation_type: string;
  issuer_id: string;
  payment_method_id: string;
  payment_type_id: string;
  external_reference?: string;
  description: string;
  metadata?: Record<string, any>;
  payer: {
    id: number;
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
}
