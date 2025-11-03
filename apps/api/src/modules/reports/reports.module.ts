import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ExcelGenerator } from './generators/excel.generator';
import { PDFGenerator } from './generators/pdf.generator';
import { CSVGenerator } from './generators/csv.generator';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ExcelGenerator,
    PDFGenerator,
    CSVGenerator,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
