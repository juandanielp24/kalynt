// Import enums from Prisma client
import { PaymentMethod, PaymentStatus } from '@prisma/client';

// Re-export for convenience
export { PaymentMethod, PaymentStatus };

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
