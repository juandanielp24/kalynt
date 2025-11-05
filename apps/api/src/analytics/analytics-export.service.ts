import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { parse } from 'json2csv';

@Injectable()
export class AnalyticsExportService {
  /**
   * Export dashboard data to CSV
   */
  async exportDashboardToCSV(data: any): Promise<Buffer> {
    const fields = [
      'metric',
      'current_value',
      'previous_value',
      'growth_percentage',
    ];

    const csvData = [
      {
        metric: 'Total Ventas',
        current_value: data.sales.current.totalSales,
        previous_value: data.sales.previous.totalSales,
        growth_percentage: data.sales.growth.toFixed(2) + '%',
      },
      {
        metric: 'Ingresos',
        current_value: data.sales.current.totalRevenue,
        previous_value: data.sales.previous.totalRevenue,
        growth_percentage: data.sales.growth.toFixed(2) + '%',
      },
      {
        metric: 'Ganancia',
        current_value: data.sales.current.totalProfit,
        previous_value: data.sales.previous.totalProfit,
        growth_percentage: '',
      },
      {
        metric: 'Margen de Ganancia',
        current_value: data.sales.current.profitMargin.toFixed(2) + '%',
        previous_value: data.sales.previous.profitMargin.toFixed(2) + '%',
        growth_percentage: '',
      },
    ];

    const csv = parse(csvData, { fields });
    return Buffer.from(csv);
  }

  /**
   * Export dashboard data to Excel
   */
  async exportDashboardToExcel(data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Resumen');

    summarySheet.columns = [
      { header: 'Métrica', key: 'metric', width: 25 },
      { header: 'Valor Actual', key: 'current', width: 15 },
      { header: 'Valor Anterior', key: 'previous', width: 15 },
      { header: 'Crecimiento', key: 'growth', width: 15 },
    ];

    // Style header
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    summarySheet.addRows([
      {
        metric: 'Total Ventas',
        current: data.sales.current.totalSales,
        previous: data.sales.previous.totalSales,
        growth: data.sales.growth.toFixed(2) + '%',
      },
      {
        metric: 'Ingresos',
        current: `${data.sales.current.totalRevenue.toFixed(2)}`,
        previous: `${data.sales.previous.totalRevenue.toFixed(2)}`,
        growth: data.sales.growth.toFixed(2) + '%',
      },
      {
        metric: 'Ganancia',
        current: `${data.sales.current.totalProfit.toFixed(2)}`,
        previous: `${data.sales.previous.totalProfit.toFixed(2)}`,
        growth: '-',
      },
      {
        metric: 'Margen de Ganancia',
        current: data.sales.current.profitMargin.toFixed(2) + '%',
        previous: data.sales.previous.profitMargin.toFixed(2) + '%',
        growth: '-',
      },
      {
        metric: 'Ticket Promedio',
        current: `${data.sales.current.averageTicket.toFixed(2)}`,
        previous: `${data.sales.previous.averageTicket.toFixed(2)}`,
        growth: '-',
      },
    ]);

    // Top Products sheet
    const productsSheet = workbook.addWorksheet('Top Productos');

    productsSheet.columns = [
      { header: 'Ranking', key: 'rank', width: 10 },
      { header: 'Producto', key: 'name', width: 30 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Cantidad', key: 'quantity', width: 12 },
      { header: 'Ingresos', key: 'revenue', width: 15 },
      { header: 'Ganancia', key: 'profit', width: 15 },
      { header: 'Margen %', key: 'margin', width: 12 },
    ];

    productsSheet.getRow(1).font = { bold: true };
    productsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    data.topProducts.forEach((product: any) => {
      productsSheet.addRow({
        rank: product.rank,
        name: product.name,
        sku: product.sku,
        category: product.category,
        quantity: product.quantity,
        revenue: `${product.revenue.toFixed(2)}`,
        profit: `${product.profit.toFixed(2)}`,
        margin: product.profitMargin.toFixed(2) + '%',
      });
    });

    // Sales by Day sheet
    const dailySheet = workbook.addWorksheet('Ventas Diarias');

    dailySheet.columns = [
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Ventas', key: 'sales', width: 12 },
      { header: 'Ingresos', key: 'revenue', width: 15 },
      { header: 'Ganancia', key: 'profit', width: 15 },
    ];

    dailySheet.getRow(1).font = { bold: true };
    dailySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    data.revenueByDay.forEach((day: any) => {
      dailySheet.addRow({
        date: day.date,
        sales: day.sales,
        revenue: `${day.revenue.toFixed(2)}`,
        profit: `${day.profit.toFixed(2)}`,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export dashboard data to PDF (basic implementation)
   */
  async exportDashboardToPDF(data: any): Promise<Buffer> {
    // For a full PDF implementation, you would use a library like pdfkit or puppeteer
    // This is a simplified version that returns a text representation

    const text = `
REPORTE DE ANALYTICS
===================

PERÍODO: ${data.period.current.start} a ${data.period.current.end}

RESUMEN DE VENTAS
-----------------
Total Ventas: ${data.sales.current.totalSales}
Ingresos: ${data.sales.current.totalRevenue.toFixed(2)}
Ganancia: ${data.sales.current.totalProfit.toFixed(2)}
Margen de Ganancia: ${data.sales.current.profitMargin.toFixed(2)}%
Ticket Promedio: ${data.sales.current.averageTicket.toFixed(2)}

Crecimiento vs Período Anterior: ${data.sales.growth.toFixed(2)}%

TOP 5 PRODUCTOS
---------------
${data.topProducts.slice(0, 5).map((p: any, i: number) =>
  `${i + 1}. ${p.name} - ${p.revenue.toFixed(2)} (${p.quantity} unidades)`
).join('\n')}

CLIENTES
--------
Total Clientes: ${data.customers.totalCustomers}
Nuevos Clientes: ${data.customers.newCustomers}
Tasa de Repetición: ${data.customers.repeatRate.toFixed(2)}%
Valor Promedio por Cliente: ${data.customers.averageCustomerValue.toFixed(2)}

INVENTARIO
----------
Total Productos: ${data.inventory.totalProducts}
Valor de Stock: ${data.inventory.totalStockValue.toFixed(2)}
Productos con Stock Bajo: ${data.inventory.lowStockProducts}
Productos Sin Stock: ${data.inventory.outOfStockProducts}
`;

    return Buffer.from(text);
  }

  /**
   * Export product performance to Excel
   */
  async exportProductsToExcel(data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Análisis de Productos');

    sheet.columns = [
      { header: 'Producto', key: 'name', width: 30 },
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Cantidad Vendida', key: 'quantity', width: 15 },
      { header: 'Ingresos', key: 'revenue', width: 15 },
      { header: 'Costo', key: 'cost', width: 15 },
      { header: 'Ganancia', key: 'profit', width: 15 },
      { header: 'Margen %', key: 'margin', width: 12 },
      { header: 'Stock Actual', key: 'stock', width: 12 },
      { header: 'Rotación', key: 'turnover', width: 12 },
      { header: 'Días de Stock', key: 'daysOfStock', width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    data.products.forEach((product: any) => {
      sheet.addRow({
        name: product.name,
        sku: product.sku,
        category: product.category,
        quantity: product.quantitySold,
        revenue: `${product.revenue.toFixed(2)}`,
        cost: `${product.cost.toFixed(2)}`,
        profit: `${product.profit.toFixed(2)}`,
        margin: product.profitMargin.toFixed(2) + '%',
        stock: product.currentStock,
        turnover: product.turnoverRate.toFixed(2),
        daysOfStock: product.daysOfStock.toFixed(0),
      });
    });

    // Add summary
    sheet.addRow({});
    sheet.addRow({
      name: 'TOTALES',
      revenue: `${data.summary.totalRevenue.toFixed(2)}`,
      profit: `${data.summary.totalProfit.toFixed(2)}`,
      margin: data.summary.averageMargin.toFixed(2) + '%',
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Export customer segmentation to Excel
   */
  async exportCustomersToExcel(data: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();

    // Create a sheet for each segment
    Object.entries(data.segments).forEach(([segmentName, segmentData]: [string, any]) => {
      const sheet = workbook.addWorksheet(
        segmentName.charAt(0).toUpperCase() + segmentName.slice(1)
      );

      sheet.columns = [
        { header: 'Cliente', key: 'name', width: 30 },
        { header: 'Recencia (días)', key: 'recency', width: 15 },
        { header: 'Frecuencia', key: 'frequency', width: 15 },
        { header: 'Monetario', key: 'monetary', width: 15 },
        { header: 'Última Compra', key: 'lastPurchase', width: 15 },
      ];

      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };

      // Add description
      sheet.addRow({
        name: segmentData.description,
      });
      sheet.mergeCells('A2:E2');
      sheet.getRow(2).font = { italic: true };
      sheet.addRow({});

      segmentData.customers.forEach((customer: any) => {
        sheet.addRow({
          name: customer.name,
          recency: customer.recency,
          frequency: customer.frequency,
          monetary: `${customer.monetary.toFixed(2)}`,
          lastPurchase: customer.lastPurchase,
        });
      });
    });

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Resumen');

    summarySheet.columns = [
      { header: 'Segmento', key: 'segment', width: 25 },
      { header: 'Cantidad', key: 'count', width: 15 },
      { header: 'Descripción', key: 'description', width: 50 },
    ];

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    Object.entries(data.segments).forEach(([name, segment]: [string, any]) => {
      summarySheet.addRow({
        segment: name.charAt(0).toUpperCase() + name.slice(1),
        count: segment.count,
        description: segment.description,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
