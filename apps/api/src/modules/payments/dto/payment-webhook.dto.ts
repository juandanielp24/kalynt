import { IsString, IsOptional, IsObject, IsNumber } from 'class-validator';

export class PaymentWebhookDto {
  @IsString()
  type: string;

  @IsString()
  @IsOptional()
  action?: string;

  @IsObject()
  data: {
    id: string;
  };

  @IsNumber()
  @IsOptional()
  date_created?: number;

  @IsString()
  @IsOptional()
  live_mode?: string;

  @IsString()
  @IsOptional()
  user_id?: string;

  @IsString()
  @IsOptional()
  api_version?: string;
}
