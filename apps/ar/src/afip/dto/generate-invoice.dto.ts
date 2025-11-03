import {
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  Matches,
  ArrayMinSize,
  IsIn
} from 'class-validator';
import { Type } from 'class-transformer';
import { CuitValidator } from '../utils/cuit-validator';

/**
 * DTO para cada alícuota de IVA
 */
export class IvaDto {
  @IsNumber()
  @IsIn([3, 4, 5, 6], { message: 'IVA ID must be 3 (0%), 4 (10.5%), 5 (21%), or 6 (27%)' })
  id: number;

  @IsNumber()
  @Min(0)
  baseAmount: number;

  @IsNumber()
  @Min(0)
  taxAmount: number;
}

/**
 * DTO para tributos
 */
export class TributeDto {
  @IsNumber()
  @Min(1)
  id: number;

  @IsString()
  description: string;

  @IsNumber()
  @Min(0)
  baseAmount: number;

  @IsNumber()
  @Min(0)
  rate: number;

  @IsNumber()
  @Min(0)
  taxAmount: number;
}

/**
 * DTO para comprobantes asociados (notas de crédito/débito)
 */
export class AssociatedInvoiceDto {
  @IsNumber()
  type: number;

  @IsNumber()
  @Min(1)
  @Max(99999)
  salePoint: number;

  @IsNumber()
  @Min(1)
  number: number;

  @IsString()
  @Matches(/^\d{11}$/, { message: 'CUIT must be 11 digits' })
  cuit: string;
}

/**
 * DTO principal para generar factura electrónica
 */
export class GenerateInvoiceDto {
  @IsNumber()
  @IsIn([1, 2, 3], { message: 'Concept must be 1 (products), 2 (services), or 3 (products+services)' })
  concept: number;

  @IsNumber()
  @Min(1)
  invoiceType: number;

  @IsNumber()
  @Min(1)
  @Max(99999)
  salePoint: number;

  @IsNumber()
  @Min(1)
  invoiceNumber: number;

  @IsString()
  @Matches(/^\d{8}$/, { message: 'Invoice date must be in YYYYMMDD format' })
  invoiceDate: string;

  @IsNumber()
  @Min(0)
  @Max(99)
  docType: number;

  @IsNumber()
  @Min(0)
  docNum: number;

  @IsNumber()
  @Min(0)
  totalAmount: number;

  @IsNumber()
  @Min(0)
  netAmount: number;

  @IsNumber()
  @Min(0)
  exemptAmount: number;

  @IsNumber()
  @Min(0)
  taxAmount: number;

  @IsNumber()
  @Min(0)
  untaxedAmount: number;

  @IsString()
  @Matches(/^[A-Z]{3}$/, { message: 'Currency must be 3-letter code (e.g., PES, USD)' })
  currency: string;

  @IsNumber()
  @Min(0)
  exchangeRate: number;

  // Service dates (required if concept is 2 or 3)
  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'Service from date must be in YYYYMMDD format' })
  serviceFrom?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'Service to date must be in YYYYMMDD format' })
  serviceTo?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'Service due date must be in YYYYMMDD format' })
  serviceDueDate?: string;

  // IVA breakdown
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => IvaDto)
  iva?: IvaDto[];

  // Tributes
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TributeDto)
  tributes?: TributeDto[];

  // Associated invoices (for credit/debit notes)
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AssociatedInvoiceDto)
  associatedInvoices?: AssociatedInvoiceDto[];
}

/**
 * DTO para solicitar el último número de comprobante
 */
export class GetLastInvoiceNumberDto {
  @IsNumber()
  @Min(1)
  invoiceType: number;

  @IsNumber()
  @Min(1)
  @Max(99999)
  salePoint: number;
}
