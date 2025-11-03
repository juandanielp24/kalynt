import { IsString, IsUUID, IsEnum, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Tipo de factura simplificado para uso en aplicación
 */
export enum InvoiceType {
  A = 'A',
  B = 'B',
  C = 'C',
  E = 'E',
}

/**
 * Item de factura
 */
export class InvoiceItemDto {
  @IsString()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  taxRate: number;

  @IsNumber()
  total: number;
}

/**
 * DTO simplificado para generar factura desde una venta
 * 
 * Este DTO es más amigable para usar en el módulo de ventas,
 * el servicio AFIP se encarga de mapear estos datos al formato
 * técnico que requiere AFIP.
 */
export class GenerateInvoiceForSaleDto {
  @IsUUID()
  saleId: string;

  @IsEnum(InvoiceType)
  invoiceType: InvoiceType;

  @IsOptional()
  @IsString()
  customerCuit?: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceItemDto)
  items: InvoiceItemDto[];

  @IsNumber()
  subtotal: number;

  @IsNumber()
  tax: number;

  @IsNumber()
  total: number;
}
