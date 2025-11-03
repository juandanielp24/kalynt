import { IsString, IsEnum, IsNumber, IsOptional, IsEmail, IsObject, Min } from 'class-validator';
import { PaymentMethod } from '../payments.types';

export class CreatePaymentDto {
  @IsString()
  saleId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsNumber()
  @Min(0)
  amountCents: number;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
