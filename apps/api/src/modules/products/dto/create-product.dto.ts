import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  Min,
  Max,
  IsObject,
} from 'class-validator';

class InitialStockDto {
  @IsUUID()
  locationId: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minQuantity?: number;
}

export class CreateProductDto {
  @IsString()
  sku: string;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  costCents: number;

  @IsNumber()
  @Min(0)
  priceCents: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate: number;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsBoolean()
  @IsOptional()
  trackStock?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsObject()
  @IsOptional()
  initialStock?: InitialStockDto;
}
