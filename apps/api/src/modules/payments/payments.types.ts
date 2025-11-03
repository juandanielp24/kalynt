export enum PaymentMethod {
  CASH = 'cash',
  DEBIT_CARD = 'debit_card',
  CREDIT_CARD = 'credit_card',
  MERCADO_PAGO = 'mercado_pago',
  MODO = 'modo',
  BANK_TRANSFER = 'bank_transfer',
  QR_CODE = 'qr_code',
}

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  IN_PROCESS = 'in_process',
  REFUNDED = 'refunded',
}

export interface PaymentRequest {
  saleId: string;
  tenantId: string;
  method: PaymentMethod;
  amountCents: number;
  customerId?: string;
  customerEmail?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  paymentId: string;
  status: PaymentStatus;
  externalId?: string;
  qrCode?: string;
  paymentUrl?: string;
  error?: string;
}
