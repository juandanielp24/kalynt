import { IsString, IsUUID, IsOptional, IsObject, IsEmail } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  saleId: string;

  @IsUUID()
  userId: string;

  @IsString()
  @IsOptional()
  paymentMethodId?: string; // pix, credit_card, debit_card, etc.

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
