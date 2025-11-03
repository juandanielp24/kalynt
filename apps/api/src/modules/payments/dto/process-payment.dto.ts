import { IsString, IsOptional, IsObject } from 'class-validator';

export class ProcessMercadoPagoPaymentDto {
  @IsString()
  saleId: string;

  @IsString()
  paymentMethodId: string; // 'visa', 'master', 'account_money', etc.

  @IsOptional()
  @IsString()
  token?: string; // Card token (para pagos con tarjeta)

  @IsOptional()
  @IsString()
  installments?: string; // Número de cuotas

  @IsOptional()
  @IsString()
  issuerId?: string;

  @IsOptional()
  @IsObject()
  payer?: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
}

export class GenerateQRPaymentDto {
  @IsString()
  saleId: string;

  @IsString()
  posId: string; // ID del punto de venta físico
}

export class GeneratePaymentLinkDto {
  @IsString()
  saleId: string;

  @IsOptional()
  @IsString()
  expirationDate?: string;
}
