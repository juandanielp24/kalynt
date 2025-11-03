import { IsString, IsEnum, IsObject, IsOptional, IsDateString } from 'class-validator';
import { NotificationType, NotificationTemplate } from '../notifications.types';

export class SendNotificationDto {
  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  to: string;

  @IsEnum(NotificationTemplate)
  template: NotificationTemplate;

  @IsObject()
  data: Record<string, any>;

  @IsOptional()
  @IsEnum(['high', 'normal', 'low'])
  priority?: 'high' | 'normal' | 'low';

  @IsOptional()
  @IsDateString()
  scheduleAt?: string;
}
