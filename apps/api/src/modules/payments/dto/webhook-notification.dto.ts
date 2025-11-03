import { IsNumber, IsBoolean, IsString, IsObject } from 'class-validator';

export class MercadoPagoWebhookDto {
  @IsNumber()
  id: number;

  @IsBoolean()
  live_mode: boolean;

  @IsString()
  type: string;

  @IsString()
  date_created: string;

  @IsNumber()
  application_id: number;

  @IsNumber()
  user_id: number;

  @IsNumber()
  version: number;

  @IsString()
  api_version: string;

  @IsString()
  action: string;

  @IsObject()
  data: {
    id: string;
  };
}
