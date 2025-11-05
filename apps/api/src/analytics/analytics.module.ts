import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsAdvancedService } from './analytics-advanced.service';
import { AnalyticsExportService } from './analytics-export.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsAdvancedService,
    AnalyticsExportService,
  ],
  exports: [
    AnalyticsService,
    AnalyticsAdvancedService,
  ],
})
export class AnalyticsModule {}
