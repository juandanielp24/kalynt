import {
  IsNumber,
  Min,
  Max
} from 'class-validator';

/**
 * DTO para consultar información de un comprobante
 */
export class InvoiceQueryDto {
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
}
