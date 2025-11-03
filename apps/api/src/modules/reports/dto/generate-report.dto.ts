import {
  IsEnum,
  IsOptional,
  IsDateString,
  IsString,
  IsUUID,
} from 'class-validator';
import { ReportType, ReportFormat } from '../report.types';

export class GenerateReportDto {
  @IsEnum(ReportType)
  type: ReportType;

  @IsEnum(ReportFormat)
  format: ReportFormat;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsUUID()
  locationId?: string;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
