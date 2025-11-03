import { IsUUID, IsNumber, Min } from 'class-validator';

export class TransferStockDto {
  @IsUUID()
  productId: string;

  @IsUUID()
  fromLocationId: string;

  @IsUUID()
  toLocationId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
