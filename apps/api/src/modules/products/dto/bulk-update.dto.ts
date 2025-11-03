import { IsArray, ValidateNested, IsUUID, IsNumber, Min, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductPriceUpdate {
  @IsUUID()
  id: string;

  @IsNumber()
  @Min(0)
  priceCents: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  costCents?: number;
}

export class BulkUpdatePricesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductPriceUpdate)
  products: ProductPriceUpdate[];
}
