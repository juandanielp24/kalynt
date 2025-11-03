import { IsUUID, IsNumber, IsString, Min } from 'class-validator';

export class AdjustStockDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  locationId: string;

  @IsNumber()
  quantity: number; // Puede ser positivo (suma) o negativo (resta)

  @IsString()
  reason: string;
}
