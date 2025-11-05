import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { SalesReportsDataService } from './reports-data/sales-reports.service';
import { SalesReportsHTMLService } from './reports-templates/sales-reports-html.service';
import { SalesReportsExcelService } from './reports-templates/sales-reports-excel.service';
import { InventoryReportsDataService } from './reports-data/inventory-reports.service';
import { InventoryReportsHTMLService } from './reports-templates/inventory-reports-html.service';
import { InventoryReportsExcelService } from './reports-templates/inventory-reports-excel.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    SalesReportsDataService,
    SalesReportsHTMLService,
    SalesReportsExcelService,
    InventoryReportsDataService,
    InventoryReportsHTMLService,
    InventoryReportsExcelService,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
