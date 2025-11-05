import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { PrismaClient, ReportType, ReportFormat, ReportStatus } from '@retail/database';
import * as ExcelJS from 'exceljs';
import * as puppeteer from 'puppeteer';
import * as dayjs from 'dayjs';
import * as fs from 'fs';
import * as path from 'path';
import { SalesReportsDataService } from './reports-data/sales-reports.service';
import { SalesReportsHTMLService } from './reports-templates/sales-reports-html.service';
import { SalesReportsExcelService } from './reports-templates/sales-reports-excel.service';
import { InventoryReportsDataService } from './reports-data/inventory-reports.service';
import { InventoryReportsHTMLService } from './reports-templates/inventory-reports-html.service';
import { InventoryReportsExcelService } from './reports-templates/inventory-reports-excel.service';

@Injectable()
export class ReportsService {
  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private salesReportsData: SalesReportsDataService,
    private salesReportsHTML: SalesReportsHTMLService,
    private salesReportsExcel: SalesReportsExcelService,
    private inventoryReportsData: InventoryReportsDataService,
    private inventoryReportsHTML: InventoryReportsHTMLService,
    private inventoryReportsExcel: InventoryReportsExcelService,
  ) {}

  /**
   * Create report request
   */
  async createReport(
    tenantId: string,
    userId: string,
    data: {
      name: string;
      type: ReportType;
      format: ReportFormat;
      filters?: any;
    }
  ) {
    const report = await this.prisma.report.create({
      data: {
        tenantId,
        name: data.name,
        type: data.type,
        format: data.format,
        filters: data.filters,
        status: ReportStatus.PENDING,
        generatedById: userId,
      },
    });

    // Generate report asynchronously
    this.generateReport(report.id).catch(console.error);

    return report;
  }

  /**
   * Generate report
   */
  async generateReport(reportId: string) {
    try {
      // Update status to processing
      await this.prisma.report.update({
        where: { id: reportId },
        data: { status: ReportStatus.PROCESSING },
      });

      const report = await this.prisma.report.findUnique({
        where: { id: reportId },
      });

      if (!report) {
        throw new Error('Report not found');
      }

      // Get report data based on type
      const data = await this.getReportData(report.tenantId, report.type, report.filters);

      // Generate file based on format
      let fileUrl: string;
      let fileSize: number;

      if (report.format === ReportFormat.PDF) {
        const result = await this.generatePDF(report, data);
        fileUrl = result.fileUrl;
        fileSize = result.fileSize;
      } else if (report.format === ReportFormat.EXCEL) {
        const result = await this.generateExcel(report, data);
        fileUrl = result.fileUrl;
        fileSize = result.fileSize;
      } else {
        throw new Error('Unsupported format');
      }

      // Update report with file info
      await this.prisma.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.COMPLETED,
          fileUrl,
          fileSize,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Report generation error:', error);
      await this.prisma.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.FAILED,
          error: error.message,
        },
      });
    }
  }

  /**
   * Get report data based on type
   */
  private async getReportData(tenantId: string, type: ReportType, filters: any) {
    switch (type) {
      case ReportType.SALES_SUMMARY:
        return this.salesReportsData.getSalesSummaryData(tenantId, filters);
      case ReportType.SALES_DETAIL:
        return this.salesReportsData.getSalesDetailData(tenantId, filters);
      case ReportType.INVENTORY_STOCK:
        return this.getInventoryStockData(tenantId, filters);
      case ReportType.INVENTORY_MOVEMENTS:
        return this.getInventoryMovementsData(tenantId, filters);
      case ReportType.PRODUCTS_PERFORMANCE:
        return this.getProductsPerformanceData(tenantId, filters);
      case ReportType.PURCHASE_ORDERS:
        return this.getPurchaseOrdersData(tenantId, filters);
      case ReportType.SUPPLIERS_SUMMARY:
        return this.getSuppliersData(tenantId, filters);
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  }

  /**
   * Generate PDF
   */
  private async generatePDF(report: any, data: any): Promise<{ fileUrl: string; fileSize: number }> {
    const html = this.generateHTML(report, data);

    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'public', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `${report.type}_${report.id}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    await page.pdf({
      path: filePath,
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
      printBackground: true,
    });

    await browser.close();

    const stats = fs.statSync(filePath);

    return {
      fileUrl: `/reports/${fileName}`,
      fileSize: stats.size,
    };
  }

  /**
   * Generate Excel
   */
  private async generateExcel(report: any, data: any): Promise<{ fileUrl: string; fileSize: number }> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Retail Super App';
    workbook.created = new Date();

    // Add worksheet based on report type
    this.addWorksheet(workbook, report, data);

    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'public', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const fileName = `${report.type}_${report.id}_${Date.now()}.xlsx`;
    const filePath = path.join(reportsDir, fileName);

    await workbook.xlsx.writeFile(filePath);

    const stats = fs.statSync(filePath);

    return {
      fileUrl: `/reports/${fileName}`,
      fileSize: stats.size,
    };
  }

  /**
   * Add worksheet to Excel
   */
  private addWorksheet(workbook: ExcelJS.Workbook, report: any, data: any) {
    switch (report.type) {
      case ReportType.SALES_SUMMARY:
        this.addSalesSummarySheet(workbook, data);
        break;
      case ReportType.SALES_DETAIL:
        this.addSalesDetailSheet(workbook, data);
        break;
      case ReportType.INVENTORY_STOCK:
        this.addInventoryStockSheet(workbook, data);
        break;
      case ReportType.INVENTORY_MOVEMENTS:
        this.addInventoryMovementsSheet(workbook, data);
        break;
      case ReportType.PRODUCTS_PERFORMANCE:
        this.addProductsPerformanceSheet(workbook, data);
        break;
      case ReportType.PURCHASE_ORDERS:
        this.addPurchaseOrdersSheet(workbook, data);
        break;
      default:
        throw new Error(`Unsupported report type: ${report.type}`);
    }
  }

  /**
   * Generate HTML for PDF
   */
  private generateHTML(report: any, data: any): string {
    const date = dayjs().format('DD/MM/YYYY HH:mm');

    let content = '';
    switch (report.type) {
      case ReportType.SALES_SUMMARY:
        content = this.generateSalesSummaryHTML(data);
        break;
      case ReportType.SALES_DETAIL:
        content = this.generateSalesDetailHTML(data);
        break;
      case ReportType.INVENTORY_STOCK:
        content = this.generateInventoryStockHTML(data);
        break;
      case ReportType.PRODUCTS_PERFORMANCE:
        content = this.generateProductsPerformanceHTML(data);
        break;
      default:
        content = '<p>Reporte no implementado</p>';
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${report.name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              font-size: 11px;
              line-height: 1.4;
              color: #333;
            }

            .header {
              border-bottom: 3px solid #2563eb;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }

            .header h1 {
              font-size: 24px;
              color: #2563eb;
              margin-bottom: 5px;
            }

            .header .subtitle {
              color: #666;
              font-size: 12px;
            }

            .meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
              padding: 10px;
              background: #f3f4f6;
              border-radius: 4px;
            }

            .meta-item {
              font-size: 10px;
            }

            .meta-item strong {
              display: block;
              color: #666;
              margin-bottom: 2px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }

            th {
              background: #2563eb;
              color: white;
              padding: 8px;
              text-align: left;
              font-size: 10px;
              font-weight: 600;
            }

            td {
              padding: 8px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 10px;
            }

            tr:nth-child(even) {
              background: #f9fafb;
            }

            .text-right {
              text-align: right;
            }

            .text-center {
              text-align: center;
            }

            .summary-card {
              display: inline-block;
              width: 23%;
              margin: 0 1% 15px 0;
              padding: 15px;
              background: #f3f4f6;
              border-radius: 8px;
              border-left: 4px solid #2563eb;
            }

            .summary-card h3 {
              font-size: 10px;
              color: #666;
              margin-bottom: 8px;
            }

            .summary-card .value {
              font-size: 20px;
              font-weight: bold;
              color: #2563eb;
            }

            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #666;
              font-size: 9px;
            }

            .section {
              margin: 30px 0;
            }

            .section-title {
              font-size: 16px;
              color: #1f2937;
              margin-bottom: 15px;
              padding-bottom: 5px;
              border-bottom: 2px solid #e5e7eb;
            }

            @media print {
              .page-break {
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${report.name}</h1>
            <div class="subtitle">Retail Super App - Sistema de Reportes</div>
          </div>

          <div class="meta">
            <div class="meta-item">
              <strong>Fecha de Generación:</strong>
              ${date}
            </div>
            <div class="meta-item">
              <strong>Tipo de Reporte:</strong>
              ${this.getReportTypeLabel(report.type)}
            </div>
            <div class="meta-item">
              <strong>Formato:</strong>
              ${report.format}
            </div>
          </div>

          ${content}

          <div class="footer">
            <p>Reporte generado automáticamente por Retail Super App</p>
            <p>© ${new Date().getFullYear()} Todos los derechos reservados</p>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Get report type label
   */
  private getReportTypeLabel(type: ReportType): string {
    const labels: Record<ReportType, string> = {
      SALES_SUMMARY: 'Resumen de Ventas',
      SALES_DETAIL: 'Detalle de Ventas',
      INVENTORY_STOCK: 'Estado de Inventario',
      INVENTORY_MOVEMENTS: 'Movimientos de Stock',
      PRODUCTS_PERFORMANCE: 'Performance de Productos',
      PURCHASE_ORDERS: 'Órdenes de Compra',
      SUPPLIERS_SUMMARY: 'Resumen por Proveedor',
      FINANCIAL_SUMMARY: 'Resumen Financiero',
      CASH_FLOW: 'Flujo de Caja',
      LOCATION_COMPARISON: 'Comparación entre Ubicaciones',
    };
    return labels[type] || type;
  }

  /**
   * Get reports list
   */
  async getReports(tenantId: string, options?: {
    type?: ReportType;
    status?: ReportStatus;
    limit?: number;
    offset?: number;
  }) {
    const where: any = { tenantId };

    if (options?.type) {
      where.type = options.type;
    }

    if (options?.status) {
      where.status = options.status;
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          generatedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: options?.offset || 0,
        take: options?.limit || 50,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      reports,
      total,
      page: Math.floor((options?.offset || 0) / (options?.limit || 50)) + 1,
      totalPages: Math.ceil(total / (options?.limit || 50)),
    };
  }

  /**
   * Get report by ID
   */
  async getReport(id: string, tenantId: string) {
    const report = await this.prisma.report.findFirst({
      where: { id, tenantId },
      include: {
        generatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  /**
   * Delete report
   */
  async deleteReport(id: string, tenantId: string) {
    const report = await this.getReport(id, tenantId);

    // Delete file if exists
    if (report.fileUrl) {
      const filePath = path.join(process.cwd(), 'public', report.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await this.prisma.report.delete({
      where: { id },
    });

    return { success: true };
  }

  // Data fetching methods
  private async getInventoryStockData(tenantId: string, filters: any) {
    return this.inventoryReportsData.getInventoryStockData(tenantId, filters);
  }

  private async getInventoryMovementsData(tenantId: string, filters: any) {
    return this.inventoryReportsData.getInventoryMovementsData(tenantId, filters);
  }

  private async getProductsPerformanceData(tenantId: string, filters: any) {
    return this.inventoryReportsData.getProductsPerformanceData(tenantId, filters);
  }

  private async getPurchaseOrdersData(tenantId: string, filters: any) {
    return {};
  }

  private async getSuppliersData(tenantId: string, filters: any) {
    return {};
  }

  // HTML generation methods
  private generateSalesSummaryHTML(data: any): string {
    return this.salesReportsHTML.generateSalesSummaryHTML(data);
  }

  private generateSalesDetailHTML(data: any): string {
    return this.salesReportsHTML.generateSalesDetailHTML(data);
  }

  private generateInventoryStockHTML(data: any): string {
    return this.inventoryReportsHTML.generateInventoryStockHTML(data);
  }

  private generateProductsPerformanceHTML(data: any): string {
    return this.inventoryReportsHTML.generateProductsPerformanceHTML(data);
  }

  // Excel sheet methods
  private addSalesSummarySheet(workbook: ExcelJS.Workbook, data: any) {
    this.salesReportsExcel.addSalesSummarySheet(workbook, data);
  }

  private addSalesDetailSheet(workbook: ExcelJS.Workbook, data: any) {
    this.salesReportsExcel.addSalesDetailSheet(workbook, data);
  }

  private addInventoryStockSheet(workbook: ExcelJS.Workbook, data: any) {
    this.inventoryReportsExcel.addInventoryStockSheet(workbook, data);
  }

  private addInventoryMovementsSheet(workbook: ExcelJS.Workbook, data: any) {
    this.inventoryReportsExcel.addInventoryMovementsSheet(workbook, data);
  }

  private addProductsPerformanceSheet(workbook: ExcelJS.Workbook, data: any) {
    this.inventoryReportsExcel.addProductsPerformanceSheet(workbook, data);
  }

  private addPurchaseOrdersSheet(workbook: ExcelJS.Workbook, data: any) {}
}
