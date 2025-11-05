import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as dayjs from 'dayjs';

@Injectable()
export class SalesReportsExcelService {
  /**
   * Add sales summary sheet
   */
  addSalesSummarySheet(workbook: ExcelJS.Workbook, data: any) {
    const { period, summary, salesByDate, salesByPaymentMethod, topProducts, salesByLocation, salesByUser } = data;

    const sheet = workbook.addWorksheet('Resumen de Ventas');

    // Header styling
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    };

    const headerFont: Partial<ExcelJS.Font> = {
      color: { argb: 'FFFFFFFF' },
      bold: true,
      size: 11,
    };

    // Title
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = 'RESUMEN DE VENTAS';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    // Period
    sheet.mergeCells('A2:D2');
    sheet.getCell('A2').value = `Período: ${period.startDate} - ${period.endDate}`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    // Summary section
    sheet.getCell('A4').value = 'RESUMEN GENERAL';
    sheet.getCell('A4').font = { bold: true, size: 12 };

    const summaryData = [
      ['Métrica', 'Valor'],
      ['Total Ventas', summary.totalSales],
      ['Ingresos Totales', `$${summary.totalRevenue.toFixed(2)}`],
      ['Costo Total', `$${summary.totalCost.toFixed(2)}`],
      ['Ganancia Total', `$${summary.totalProfit.toFixed(2)}`],
      ['Margen de Ganancia', `${summary.profitMargin.toFixed(2)}%`],
      ['Ticket Promedio', `$${summary.averageTicket.toFixed(2)}`],
    ];

    sheet.addTable({
      name: 'SummaryTable',
      ref: 'A5',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [{ name: 'Métrica' }, { name: 'Valor' }],
      rows: summaryData.slice(1),
    });

    // Sales by date
    if (salesByDate.length > 0) {
      const startRow = 5 + summaryData.length + 2;
      sheet.getCell(`A${startRow}`).value = 'VENTAS POR DÍA';
      sheet.getCell(`A${startRow}`).font = { bold: true, size: 12 };

      sheet.addTable({
        name: 'SalesByDateTable',
        ref: `A${startRow + 1}`,
        headerRow: true,
        style: {
          theme: 'TableStyleMedium2',
          showRowStripes: true,
        },
        columns: [
          { name: 'Fecha' },
          { name: 'Cantidad' },
          { name: 'Ingresos' },
          { name: 'Ganancia' },
          { name: 'Ticket Prom.' },
        ],
        rows: salesByDate.map((item) => [
          item.date,
          item.count,
          item.revenue,
          item.profit,
          item.count > 0 ? item.revenue / item.count : 0,
        ]),
      });
    }

    // Auto-fit columns
    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 20;
      }
    });

    // Add payment methods sheet
    this.addPaymentMethodsSheet(workbook, salesByPaymentMethod, summary.totalRevenue);

    // Add top products sheet
    this.addTopProductsSheet(workbook, topProducts);

    // Add locations sheet if available
    if (salesByLocation && salesByLocation.length > 0) {
      this.addLocationsSalesSheet(workbook, salesByLocation);
    }

    // Add users sheet
    this.addUsersSalesSheet(workbook, salesByUser);
  }

  /**
   * Add payment methods sheet
   */
  private addPaymentMethodsSheet(workbook: ExcelJS.Workbook, data: any[], totalRevenue: number) {
    const sheet = workbook.addWorksheet('Por Método de Pago');

    sheet.getCell('A1').value = 'VENTAS POR MÉTODO DE PAGO';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.addTable({
      name: 'PaymentMethodsTable',
      ref: 'A3',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: 'Método de Pago' },
        { name: 'Cantidad' },
        { name: 'Ingresos' },
        { name: '% del Total' },
      ],
      rows: data.map((item) => [
        item.method,
        item.count,
        item.revenue,
        totalRevenue > 0 ? ((item.revenue / totalRevenue) * 100).toFixed(2) + '%' : '0%',
      ]),
    });

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 20;
      }
    });
  }

  /**
   * Add top products sheet
   */
  private addTopProductsSheet(workbook: ExcelJS.Workbook, data: any[]) {
    const sheet = workbook.addWorksheet('Top Productos');

    sheet.getCell('A1').value = 'TOP PRODUCTOS MÁS VENDIDOS';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.addTable({
      name: 'TopProductsTable',
      ref: 'A3',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: '#' },
        { name: 'Producto' },
        { name: 'SKU' },
        { name: 'Cantidad' },
        { name: 'Ingresos' },
      ],
      rows: data.map((item, index) => [
        index + 1,
        item.productName,
        item.productSku,
        item.quantity,
        item.revenue,
      ]),
    });

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 25;
      }
    });
  }

  /**
   * Add locations sales sheet
   */
  private addLocationsSalesSheet(workbook: ExcelJS.Workbook, data: any[]) {
    const sheet = workbook.addWorksheet('Por Ubicación');

    sheet.getCell('A1').value = 'VENTAS POR UBICACIÓN';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.addTable({
      name: 'LocationsTable',
      ref: 'A3',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: 'Ubicación' },
        { name: 'Cantidad' },
        { name: 'Ingresos' },
        { name: 'Ticket Prom.' },
      ],
      rows: data.map((item) => [
        item.locationName,
        item.count,
        item.revenue,
        item.count > 0 ? item.revenue / item.count : 0,
      ]),
    });

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 20;
      }
    });
  }

  /**
   * Add users sales sheet
   */
  private addUsersSalesSheet(workbook: ExcelJS.Workbook, data: any[]) {
    const sheet = workbook.addWorksheet('Por Vendedor');

    sheet.getCell('A1').value = 'VENTAS POR VENDEDOR';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.addTable({
      name: 'UsersTable',
      ref: 'A3',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: 'Vendedor' },
        { name: 'Cantidad' },
        { name: 'Ingresos' },
        { name: 'Ticket Prom.' },
      ],
      rows: data.map((item) => [item.userName, item.count, item.revenue, item.averageTicket]),
    });

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 25;
      }
    });
  }

  /**
   * Add sales detail sheet
   */
  addSalesDetailSheet(workbook: ExcelJS.Workbook, data: any) {
    const { period, sales } = data;

    const sheet = workbook.addWorksheet('Detalle de Ventas');

    // Title
    sheet.mergeCells('A1:I1');
    sheet.getCell('A1').value = 'DETALLE DE VENTAS';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    // Period
    sheet.mergeCells('A2:I2');
    sheet.getCell('A2').value = `Período: ${period.startDate} - ${period.endDate}`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    // Add table
    sheet.addTable({
      name: 'SalesDetailTable',
      ref: 'A4',
      headerRow: true,
      totalsRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: 'N° Venta', totalsRowLabel: 'TOTAL:', filterButton: true },
        { name: 'Fecha', totalsRowFunction: 'none', filterButton: true },
        { name: 'Cliente', totalsRowFunction: 'none', filterButton: true },
        { name: 'Ubicación', totalsRowFunction: 'none', filterButton: true },
        { name: 'Items', totalsRowFunction: 'sum', filterButton: true },
        { name: 'Método Pago', totalsRowFunction: 'none', filterButton: true },
        { name: 'Subtotal', totalsRowFunction: 'sum', filterButton: true },
        { name: 'Descuento', totalsRowFunction: 'sum', filterButton: true },
        { name: 'Total', totalsRowFunction: 'sum', filterButton: true },
      ],
      rows: sales.map((sale: any) => [
        sale.saleNumber,
        dayjs(sale.createdAt).format('DD/MM/YYYY HH:mm'),
        sale.customerName || 'Cliente General',
        sale.location?.name || '-',
        sale.items.length,
        sale.paymentMethod || '-',
        sale.subtotal,
        sale.discount,
        sale.totalAmount,
      ]),
    });

    // Format currency columns
    const currencyColumns = ['G', 'H', 'I']; // Subtotal, Descuento, Total
    currencyColumns.forEach((col) => {
      const column = sheet.getColumn(col);
      column.numFmt = '"$"#,##0.00';
    });

    // Auto-fit columns
    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 18;
      }
    });
  }
}
