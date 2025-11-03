import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  ReportMetadata,
  ReportData,
  SalesReportData,
  InventoryReportData,
  FinancialReportData,
  ProductsReportData,
  CustomersReportData,
  TaxReportData,
  ReportType,
} from '../report.types';

@Injectable()
export class ExcelGenerator {
  private readonly logger = new Logger(ExcelGenerator.name);

  async generate(
    type: ReportType,
    data: ReportData,
    metadata: ReportMetadata,
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Retail POS System';
    workbook.created = new Date();

    switch (type) {
      case ReportType.SALES:
        await this.generateSalesReport(
          workbook,
          data as SalesReportData,
          metadata,
        );
        break;
      case ReportType.INVENTORY:
        await this.generateInventoryReport(
          workbook,
          data as InventoryReportData,
          metadata,
        );
        break;
      case ReportType.FINANCIAL:
        await this.generateFinancialReport(
          workbook,
          data as FinancialReportData,
          metadata,
        );
        break;
      case ReportType.PRODUCTS:
        await this.generateProductsReport(
          workbook,
          data as ProductsReportData,
          metadata,
        );
        break;
      case ReportType.CUSTOMERS:
        await this.generateCustomersReport(
          workbook,
          data as CustomersReportData,
          metadata,
        );
        break;
      case ReportType.TAX:
        await this.generateTaxReport(
          workbook,
          data as TaxReportData,
          metadata,
        );
        break;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async generateSalesReport(
    workbook: ExcelJS.Workbook,
    data: SalesReportData,
    metadata: ReportMetadata,
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Ventas');

    // Add header
    this.addReportHeader(worksheet, metadata);

    // Add column headers
    worksheet.addRow([]);
    const headerRow = worksheet.addRow([
      'N° Venta',
      'Fecha',
      'Cliente',
      'Items',
      'Subtotal',
      'IVA',
      'Total',
      'Método Pago',
      'Sucursal',
      'Estado',
    ]);

    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows
    data.sales.forEach((sale) => {
      worksheet.addRow([
        sale.saleNumber,
        sale.date.toLocaleDateString('es-AR'),
        sale.customerName || 'Consumidor Final',
        sale.items,
        this.formatCurrency(sale.subtotalCents),
        this.formatCurrency(sale.taxCents),
        this.formatCurrency(sale.totalCents),
        sale.paymentMethod,
        sale.location,
        sale.status,
      ]);
    });

    // Add summary
    worksheet.addRow([]);
    const summaryStartRow = worksheet.rowCount + 1;
    worksheet.addRow(['RESUMEN']);
    worksheet.addRow([
      'Total de Ventas:',
      data.summary.totalSales.toString(),
    ]);
    worksheet.addRow([
      'Ingresos Totales:',
      this.formatCurrency(data.summary.totalRevenue),
    ]);
    worksheet.addRow([
      'IVA Total:',
      this.formatCurrency(data.summary.totalTax),
    ]);
    worksheet.addRow([
      'Ticket Promedio:',
      this.formatCurrency(data.summary.averageTicket),
    ]);

    // Format summary section
    worksheet.getCell(`A${summaryStartRow}`).font = {
      bold: true,
      size: 14,
    };

    // Add top products
    if (data.summary.topProducts.length > 0) {
      worksheet.addRow([]);
      worksheet.addRow(['Productos Más Vendidos']);
      worksheet.addRow(['Producto', 'Cantidad', 'Ingresos']);

      data.summary.topProducts.forEach((product) => {
        worksheet.addRow([
          product.name,
          product.quantity,
          this.formatCurrency(product.revenue),
        ]);
      });
    }

    // Auto-fit columns
    this.autoFitColumns(worksheet);
  }

  private async generateInventoryReport(
    workbook: ExcelJS.Workbook,
    data: InventoryReportData,
    metadata: ReportMetadata,
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Inventario');

    // Add header
    this.addReportHeader(worksheet, metadata);

    // Add column headers
    worksheet.addRow([]);
    const headerRow = worksheet.addRow([
      'SKU',
      'Producto',
      'Categoría',
      'Stock Actual',
      'Stock Mínimo',
      'Stock Máximo',
      'Costo Unit.',
      'Precio Unit.',
      'Valor Total',
      'Estado',
    ]);

    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF70AD47' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    // Add data rows with conditional formatting
    data.products.forEach((product) => {
      const row = worksheet.addRow([
        product.sku,
        product.name,
        product.category,
        product.stock,
        product.minStock,
        product.maxStock,
        this.formatCurrency(product.costCents),
        this.formatCurrency(product.priceCents),
        this.formatCurrency(product.totalValueCents),
        this.getStockStatusLabel(product.status),
      ]);

      // Color code based on status
      const statusColor = this.getStockStatusColor(product.status);
      row.getCell(10).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: statusColor },
      };
    });

    // Add summary
    worksheet.addRow([]);
    const summaryStartRow = worksheet.rowCount + 1;
    worksheet.addRow(['RESUMEN']);
    worksheet.addRow([
      'Total de Productos:',
      data.summary.totalProducts.toString(),
    ]);
    worksheet.addRow([
      'Valor Total Inventario:',
      this.formatCurrency(data.summary.totalValue),
    ]);
    worksheet.addRow([
      'Productos con Stock Bajo:',
      data.summary.lowStockItems.toString(),
    ]);
    worksheet.addRow([
      'Productos Sin Stock:',
      data.summary.outOfStockItems.toString(),
    ]);
    worksheet.addRow([
      'Productos con Exceso:',
      data.summary.excessStockItems.toString(),
    ]);

    worksheet.getCell(`A${summaryStartRow}`).font = {
      bold: true,
      size: 14,
    };

    // Auto-fit columns
    this.autoFitColumns(worksheet);
  }

  private async generateFinancialReport(
    workbook: ExcelJS.Workbook,
    data: FinancialReportData,
    metadata: ReportMetadata,
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Financiero');

    // Add header
    this.addReportHeader(worksheet, metadata);

    // Revenue section
    worksheet.addRow([]);
    worksheet.addRow(['INGRESOS']);
    worksheet.addRow(['Efectivo:', this.formatCurrency(data.revenue.cash)]);
    worksheet.addRow(['Tarjeta:', this.formatCurrency(data.revenue.card)]);
    worksheet.addRow([
      'Transferencia:',
      this.formatCurrency(data.revenue.transfer),
    ]);
    worksheet.addRow([
      'Mercado Pago:',
      this.formatCurrency(data.revenue.mercadoPago),
    ]);
    worksheet.addRow([
      'Total Ingresos:',
      this.formatCurrency(data.revenue.total),
    ]);

    // Expenses section
    worksheet.addRow([]);
    worksheet.addRow(['EGRESOS']);
    worksheet.addRow(['Compras:', this.formatCurrency(data.expenses.purchases)]);
    worksheet.addRow(['Salarios:', this.formatCurrency(data.expenses.salaries)]);
    worksheet.addRow(['Alquiler:', this.formatCurrency(data.expenses.rent)]);
    worksheet.addRow([
      'Servicios:',
      this.formatCurrency(data.expenses.utilities),
    ]);
    worksheet.addRow(['Otros:', this.formatCurrency(data.expenses.other)]);
    worksheet.addRow([
      'Total Egresos:',
      this.formatCurrency(data.expenses.total),
    ]);

    // Profit section
    worksheet.addRow([]);
    worksheet.addRow(['RENTABILIDAD']);
    worksheet.addRow([
      'Beneficio Bruto:',
      this.formatCurrency(data.profit.gross),
    ]);
    worksheet.addRow(['Beneficio Neto:', this.formatCurrency(data.profit.net)]);
    worksheet.addRow(['Margen:', `${data.profit.margin.toFixed(2)}%`]);

    // Tax section
    worksheet.addRow([]);
    worksheet.addRow(['IMPUESTOS']);
    worksheet.addRow([
      'IVA Recaudado:',
      this.formatCurrency(data.taxes.collected),
    ]);
    worksheet.addRow(['IVA Pagado:', this.formatCurrency(data.taxes.paid)]);
    worksheet.addRow([
      'IVA Pendiente:',
      this.formatCurrency(data.taxes.pending),
    ]);

    // Format section headers
    const sectionHeaders = [6, 13, 20, 25];
    sectionHeaders.forEach((rowNum) => {
      worksheet.getCell(`A${rowNum}`).font = { bold: true, size: 12 };
      worksheet.getCell(`A${rowNum}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7E6E6' },
      };
    });

    this.autoFitColumns(worksheet);
  }

  private async generateProductsReport(
    workbook: ExcelJS.Workbook,
    data: ProductsReportData,
    metadata: ReportMetadata,
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Productos');

    this.addReportHeader(worksheet, metadata);

    worksheet.addRow([]);
    const headerRow = worksheet.addRow([
      'Producto',
      'SKU',
      'Categoría',
      'Unidades Vendidas',
      'Ingresos',
      'Beneficio',
      'Margen %',
    ]);

    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFC000' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.products.forEach((product) => {
      worksheet.addRow([
        product.name,
        product.sku,
        product.category,
        product.unitsSold,
        this.formatCurrency(product.revenue),
        this.formatCurrency(product.profit),
        `${product.margin.toFixed(2)}%`,
      ]);
    });

    // Summary
    worksheet.addRow([]);
    worksheet.addRow(['RESUMEN']);
    worksheet.addRow([
      'Ingresos Totales:',
      this.formatCurrency(data.summary.totalRevenue),
    ]);
    worksheet.addRow([
      'Beneficio Total:',
      this.formatCurrency(data.summary.totalProfit),
    ]);

    this.autoFitColumns(worksheet);
  }

  private async generateCustomersReport(
    workbook: ExcelJS.Workbook,
    data: CustomersReportData,
    metadata: ReportMetadata,
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Clientes');

    this.addReportHeader(worksheet, metadata);

    worksheet.addRow([]);
    const headerRow = worksheet.addRow([
      'Cliente',
      'Email',
      'Teléfono',
      'Total Compras',
      'Total Gastado',
      'Ticket Promedio',
      'Última Compra',
    ]);

    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF5B9BD5' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.customers.forEach((customer) => {
      worksheet.addRow([
        customer.name,
        customer.email,
        customer.phone || '-',
        customer.totalPurchases,
        this.formatCurrency(customer.totalSpent),
        this.formatCurrency(customer.averageTicket),
        customer.lastPurchase.toLocaleDateString('es-AR'),
      ]);
    });

    // Summary
    worksheet.addRow([]);
    worksheet.addRow(['RESUMEN']);
    worksheet.addRow([
      'Total Clientes:',
      data.summary.totalCustomers.toString(),
    ]);
    worksheet.addRow([
      'Clientes Nuevos:',
      data.summary.newCustomers.toString(),
    ]);
    worksheet.addRow([
      'Clientes Recurrentes:',
      data.summary.repeatCustomers.toString(),
    ]);
    worksheet.addRow([
      'Ingresos Totales:',
      this.formatCurrency(data.summary.totalRevenue),
    ]);
    worksheet.addRow([
      'Gasto Promedio por Cliente:',
      this.formatCurrency(data.summary.averageSpendPerCustomer),
    ]);

    this.autoFitColumns(worksheet);
  }

  private async generateTaxReport(
    workbook: ExcelJS.Workbook,
    data: TaxReportData,
    metadata: ReportMetadata,
  ): Promise<void> {
    const worksheet = workbook.addWorksheet('Impuestos AFIP');

    this.addReportHeader(worksheet, metadata);

    worksheet.addRow([]);
    worksheet.addRow([
      'PERÍODO',
      `${data.period.startDate.toLocaleDateString('es-AR')} - ${data.period.endDate.toLocaleDateString('es-AR')}`,
    ]);

    worksheet.addRow([]);
    const headerRow = worksheet.addRow([
      'N° Factura',
      'Tipo',
      'Fecha',
      'CUIT Cliente',
      'Cliente',
      'Neto',
      'IVA',
      'Total',
      'CAE',
      'Estado',
    ]);

    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF44546A' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

    data.invoices.forEach((invoice) => {
      worksheet.addRow([
        invoice.number,
        invoice.type,
        invoice.date.toLocaleDateString('es-AR'),
        invoice.customerCuit || '-',
        invoice.customerName || 'Consumidor Final',
        this.formatCurrency(invoice.netAmount),
        this.formatCurrency(invoice.taxAmount),
        this.formatCurrency(invoice.totalAmount),
        invoice.cae,
        invoice.status,
      ]);
    });

    // Summary
    worksheet.addRow([]);
    const summaryStartRow = worksheet.rowCount + 1;
    worksheet.addRow(['RESUMEN PERÍODO']);
    worksheet.addRow([
      'Total Facturas:',
      data.summary.totalInvoices.toString(),
    ]);
    worksheet.addRow([
      'Monto Neto Total:',
      this.formatCurrency(data.summary.totalNetAmount),
    ]);
    worksheet.addRow([
      'IVA Total:',
      this.formatCurrency(data.summary.totalTaxAmount),
    ]);
    worksheet.addRow([
      'Total General:',
      this.formatCurrency(data.summary.totalAmount),
    ]);

    worksheet.getCell(`A${summaryStartRow}`).font = {
      bold: true,
      size: 14,
    };

    // Add breakdown by invoice type
    worksheet.addRow([]);
    worksheet.addRow(['Detalle por Tipo de Comprobante']);
    worksheet.addRow(['Tipo', 'Cantidad', 'Monto Total']);

    Object.entries(data.summary.byInvoiceType).forEach(([type, stats]) => {
      worksheet.addRow([
        type,
        stats.count.toString(),
        this.formatCurrency(stats.amount),
      ]);
    });

    this.autoFitColumns(worksheet);
  }

  private addReportHeader(
    worksheet: ExcelJS.Worksheet,
    metadata: ReportMetadata,
  ): void {
    worksheet.addRow([metadata.tenantName]);
    worksheet.addRow([metadata.title]);
    worksheet.addRow([metadata.description]);
    worksheet.addRow([
      `Generado: ${metadata.generatedAt.toLocaleString('es-AR')}`,
    ]);

    // Format header
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A2').font = { bold: true, size: 14 };
    worksheet.getCell('A3').font = { size: 11 };
    worksheet.getCell('A4').font = { size: 10, italic: true };
  }

  private autoFitColumns(worksheet: ExcelJS.Worksheet): void {
    worksheet.columns.forEach((column) => {
      if (!column) return;
      let maxLength = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length);
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 50);
    });
  }

  private formatCurrency(cents: number): string {
    return `$${(cents / 100).toFixed(2)}`;
  }

  private getStockStatusLabel(status: string): string {
    const labels = {
      normal: 'Normal',
      low: 'Stock Bajo',
      out: 'Sin Stock',
      excess: 'Exceso',
    };
    return labels[status] || status;
  }

  private getStockStatusColor(status: string): string {
    const colors = {
      normal: 'FF92D050', // Green
      low: 'FFFFC000', // Yellow
      out: 'FFFF0000', // Red
      excess: 'FF00B0F0', // Blue
    };
    return colors[status] || 'FFFFFFFF';
  }
}
