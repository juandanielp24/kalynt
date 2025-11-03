import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
  Min,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Métodos de pago disponibles
 */
export enum PaymentMethodEnum {
  CASH = 'CASH',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
  MERCADO_PAGO = 'MERCADO_PAGO',
  MODO = 'MODO',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

/**
 * Item de venta
 */
export class SaleItemDto {
  @IsUUID()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPriceCents: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountCents?: number;
}

/**
 * DTO para crear una venta
 */
export class CreateSaleDto {
  @IsUUID()
  locationId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsEnum(PaymentMethodEnum)
  paymentMethod: PaymentMethodEnum;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discountCents?: number;

  // Cliente (opcional para B2C, obligatorio para facturas A)
  @IsString()
  @IsOptional()
  customerName?: string;

  @IsString()
  @IsOptional()
  customerCuit?: string;

  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @IsString()
  @IsOptional()
  customerPhone?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * DTO para completar una venta (generar factura AFIP)
 */
export class CompleteSaleDto {
  @IsString()
  @IsOptional()
  paymentId?: string; // ID de pago de Mercado Pago si aplica
}
