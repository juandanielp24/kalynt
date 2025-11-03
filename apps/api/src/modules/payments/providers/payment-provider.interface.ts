export enum PaymentMethod {
  CASH = 'CASH',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
  MERCADO_PAGO = 'MERCADO_PAGO',
  MODO = 'MODO',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface PaymentIntent {
  amountCents: number;
  currency: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  id: string;
  status: PaymentStatus;
  amountCents: number;
  paidCents: number;
  method: PaymentMethod;
  externalId?: string;
  approvalCode?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface IPaymentProvider {
  createPayment(intent: PaymentIntent): Promise<PaymentResult>;
  getPayment(id: string): Promise<PaymentResult>;
  refundPayment(id: string, amountCents?: number): Promise<PaymentResult>;
  cancelPayment(id: string): Promise<PaymentResult>;
}
