import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';

@Injectable()
export class InventoryReportsExcelService {
  /**
   * Add inventory stock sheet
   */
  addInventoryStockSheet(workbook: ExcelJS.Workbook, data: any) {
    const { summary, stockByCategory, stockByLocation, stockStatus, lowStockItems, outOfStockItems } = data;

    const sheet = workbook.addWorksheet('Estado de Inventario');

    // Title
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = 'ESTADO DE INVENTARIO';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    // Summary section
    sheet.getCell('A3').value = 'RESUMEN GENERAL';
    sheet.getCell('A3').font = { bold: true, size: 12 };

    const summaryData = [
      ['Métrica', 'Valor'],
      ['Total Productos', summary.totalProducts],
      ['Stock Total', summary.totalStock],
      ['Valor Total', summary.totalValue],
      ['Bajo Stock', summary.lowStockCount],
      ['Agotados', summary.outOfStockCount],
    ];

    sheet.addTable({
      name: 'SummaryTable',
      ref: 'A4',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [{ name: 'Métrica' }, { name: 'Valor' }],
      rows: summaryData.slice(1),
    });

    // Add stock status sheet
    this.addStockStatusSheet(workbook, stockStatus);

    // Add stock by category sheet
    this.addStockByCategorySheet(workbook, stockByCategory);

    // Add stock by location sheet
    this.addStockByLocationSheet(workbook, stockByLocation);

    // Add low stock sheet if there are items
    if (lowStockItems.length > 0) {
      this.addLowStockSheet(workbook, lowStockItems);
    }

    // Add out of stock sheet if there are items
    if (outOfStockItems.length > 0) {
      this.addOutOfStockSheet(workbook, outOfStockItems);
    }

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 20;
      }
    });
  }

  /**
   * Add stock status sheet
   */
  private addStockStatusSheet(workbook: ExcelJS.Workbook, stockStatus: any) {
    const sheet = workbook.addWorksheet('Estado del Stock');

    sheet.getCell('A1').value = 'ESTADO DEL STOCK';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    const total = stockStatus.normal + stockStatus.low + stockStatus.out;

    sheet.addTable({
      name: 'StockStatusTable',
      ref: 'A3',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [{ name: 'Estado' }, { name: 'Cantidad' }, { name: 'Porcentaje' }],
      rows: [
        ['Normal', stockStatus.normal, total > 0 ? `${((stockStatus.normal / total) * 100).toFixed(1)}%` : '0%'],
        ['Bajo Stock', stockStatus.low, total > 0 ? `${((stockStatus.low / total) * 100).toFixed(1)}%` : '0%'],
        ['Agotado', stockStatus.out, total > 0 ? `${((stockStatus.out / total) * 100).toFixed(1)}%` : '0%'],
      ],
    });

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 20;
      }
    });
  }

  /**
   * Add stock by category sheet
   */
  private addStockByCategorySheet(workbook: ExcelJS.Workbook, stockByCategory: any[]) {
    const sheet = workbook.addWorksheet('Por Categoría');

    sheet.getCell('A1').value = 'STOCK POR CATEGORÍA';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.addTable({
      name: 'StockByCategoryTable',
      ref: 'A3',
      headerRow: true,
      totalsRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: 'Categoría', totalsRowLabel: 'TOTAL:', filterButton: true },
        { name: 'Productos', totalsRowFunction: 'sum', filterButton: true },
        { name: 'Stock Total', totalsRowFunction: 'sum', filterButton: true },
        { name: 'Valor', totalsRowFunction: 'sum', filterButton: true },
      ],
      rows: stockByCategory.map((item) => [
        item.categoryName,
        item.productCount,
        item.totalStock,
        item.totalValue,
      ]),
    });

    // Format currency column
    const column = sheet.getColumn('D');
    column.numFmt = '"$"#,##0.00';

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 25;
      }
    });
  }

  /**
   * Add stock by location sheet
   */
  private addStockByLocationSheet(workbook: ExcelJS.Workbook, stockByLocation: any[]) {
    const sheet = workbook.addWorksheet('Por Ubicación');

    sheet.getCell('A1').value = 'STOCK POR UBICACIÓN';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.addTable({
      name: 'StockByLocationTable',
      ref: 'A3',
      headerRow: true,
      totalsRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: 'Ubicación', totalsRowLabel: 'TOTAL:', filterButton: true },
        { name: 'Productos', totalsRowFunction: 'sum', filterButton: true },
        { name: 'Stock Total', totalsRowFunction: 'sum', filterButton: true },
        { name: 'Valor', totalsRowFunction: 'sum', filterButton: true },
      ],
      rows: stockByLocation.map((item) => [
        item.locationName,
        item.productCount,
        item.totalStock,
        item.totalValue,
      ]),
    });

    // Format currency column
    const column = sheet.getColumn('D');
    column.numFmt = '"$"#,##0.00';

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 25;
      }
    });
  }

  /**
   * Add low stock sheet
   */
  private addLowStockSheet(workbook: ExcelJS.Workbook, lowStockItems: any[]) {
    const sheet = workbook.addWorksheet('⚠️ Bajo Stock');

    sheet.getCell('A1').value = 'PRODUCTOS CON BAJO STOCK';
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFF59E0B' } };

    sheet.addTable({
      name: 'LowStockTable',
      ref: 'A3',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: 'Producto', filterButton: true },
        { name: 'SKU', filterButton: true },
        { name: 'Ubicación', filterButton: true },
        { name: 'Stock Actual', filterButton: true },
        { name: 'Mínimo', filterButton: true },
        { name: 'Diferencia', filterButton: true },
      ],
      rows: lowStockItems.map((item) => [
        item.productName,
        item.productSku,
        item.locationName,
        item.currentStock,
        item.minStock,
        item.difference,
      ]),
    });

    // Highlight stock actual column in orange
    const stockColumn = sheet.getColumn('D');
    stockColumn.eachCell((cell, rowNumber) => {
      if (rowNumber > 3) {
        // Skip header
        cell.font = { color: { argb: 'FFF59E0B' }, bold: true };
      }
    });

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 25;
      }
    });
  }

  /**
   * Add out of stock sheet
   */
  private addOutOfStockSheet(workbook: ExcelJS.Workbook, outOfStockItems: any[]) {
    const sheet = workbook.addWorksheet('🚫 Agotados');

    sheet.getCell('A1').value = 'PRODUCTOS AGOTADOS';
    sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FFEF4444' } };

    sheet.addTable({
      name: 'OutOfStockTable',
      ref: 'A3',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: 'Producto', filterButton: true },
        { name: 'SKU', filterButton: true },
        { name: 'Ubicación', filterButton: true },
      ],
      rows: outOfStockItems.map((item) => [item.productName, item.productSku, item.locationName]),
    });

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 30;
      }
    });
  }

  /**
   * Add products performance sheet
   */
  addProductsPerformanceSheet(workbook: ExcelJS.Workbook, data: any) {
    const { period, summary, topPerformers, worstPerformers, mostProfitable, performanceByCategory } = data;

    const sheet = workbook.addWorksheet('Performance de Productos');

    // Title
    sheet.mergeCells('A1:G1');
    sheet.getCell('A1').value = 'PERFORMANCE DE PRODUCTOS';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    // Period
    sheet.mergeCells('A2:G2');
    sheet.getCell('A2').value = `Período: ${period.startDate} - ${period.endDate}`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    // Summary section
    sheet.getCell('A4').value = 'RESUMEN GENERAL';
    sheet.getCell('A4').font = { bold: true, size: 12 };

    const summaryData = [
      ['Métrica', 'Valor'],
      ['Total Productos', summary.totalProducts],
      ['Ingresos Totales', summary.totalRevenue],
      ['Ganancia Total', summary.totalProfit],
      ['Margen Promedio', `${summary.averageProfitMargin.toFixed(2)}%`],
    ];

    sheet.addTable({
      name: 'PerformanceSummaryTable',
      ref: 'A5',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [{ name: 'Métrica' }, { name: 'Valor' }],
      rows: summaryData.slice(1),
    });

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 25;
      }
    });

    // Add additional sheets
    this.addTopPerformersSheet(workbook, topPerformers);
    this.addMostProfitableSheet(workbook, mostProfitable);
    this.addPerformanceByCategorySheet(workbook, performanceByCategory);

    if (worstPerformers.length > 0) {
      this.addWorstPerformersSheet(workbook, worstPerformers);
    }
  }

  /**
   * Add top performers sheet
   */
  private addTopPerformersSheet(workbook: ExcelJS.Workbook, topPerformers: any[]) {
    const sheet = workbook.addWorksheet('🏆 Top por Ingresos');

    sheet.getCell('A1').value = 'TOP 10 PRODUCTOS POR INGRESOS';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.addTable({
      name: 'TopPerformersTable',
      ref: 'A3',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: '#', filterButton: true },
        { name: 'Producto', filterButton: true },
        { name: 'SKU', filterButton: true },
        { name: 'Cantidad', filterButton: true },
        { name: 'Ingresos', filterButton: true },
        { name: 'Ganancia', filterButton: true },
        { name: 'Margen %', filterButton: true },
      ],
      rows: topPerformers.map((item) => [
        item.rank,
        item.productName,
        item.productSku,
        item.quantitySold,
        item.revenue,
        item.profit,
        item.profitMargin,
      ]),
    });

    // Format currency columns
    ['E', 'F'].forEach((col) => {
      const column = sheet.getColumn(col);
      column.numFmt = '"$"#,##0.00';
    });

    // Format percentage column
    const percentColumn = sheet.getColumn('G');
    percentColumn.numFmt = '0.00"%"';

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 20;
      }
    });
  }

  /**
   * Add most profitable sheet
   */
  private addMostProfitableSheet(workbook: ExcelJS.Workbook, mostProfitable: any[]) {
    const sheet = workbook.addWorksheet('💰 Top por Margen');

    sheet.getCell('A1').value = 'TOP 10 PRODUCTOS POR MARGEN DE GANANCIA';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.addTable({
      name: 'MostProfitableTable',
      ref: 'A3',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: '#', filterButton: true },
        { name: 'Producto', filterButton: true },
        { name: 'SKU', filterButton: true },
        { name: 'Cantidad', filterButton: true },
        { name: 'Ingresos', filterButton: true },
        { name: 'Ganancia', filterButton: true },
        { name: 'Margen %', filterButton: true },
      ],
      rows: mostProfitable.map((item, index) => [
        index + 1,
        item.productName,
        item.productSku,
        item.quantitySold,
        item.revenue,
        item.profit,
        item.profitMargin,
      ]),
    });

    // Format currency columns
    ['E', 'F'].forEach((col) => {
      const column = sheet.getColumn(col);
      column.numFmt = '"$"#,##0.00';
    });

    // Format percentage column
    const percentColumn = sheet.getColumn('G');
    percentColumn.numFmt = '0.00"%"';
    percentColumn.eachCell((cell, rowNumber) => {
      if (rowNumber > 3) {
        // Skip header
        cell.font = { color: { argb: 'FF10B981' }, bold: true };
      }
    });

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 20;
      }
    });
  }

  /**
   * Add worst performers sheet
   */
  private addWorstPerformersSheet(workbook: ExcelJS.Workbook, worstPerformers: any[]) {
    const sheet = workbook.addWorksheet('📉 Menor Performance');

    sheet.getCell('A1').value = 'PRODUCTOS CON MENOR PERFORMANCE';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.addTable({
      name: 'WorstPerformersTable',
      ref: 'A3',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: '#', filterButton: true },
        { name: 'Producto', filterButton: true },
        { name: 'SKU', filterButton: true },
        { name: 'Cantidad', filterButton: true },
        { name: 'Ingresos', filterButton: true },
        { name: 'Ganancia', filterButton: true },
        { name: 'Margen %', filterButton: true },
      ],
      rows: worstPerformers.map((item) => [
        item.rank,
        item.productName,
        item.productSku,
        item.quantitySold,
        item.revenue,
        item.profit,
        item.profitMargin,
      ]),
    });

    // Format currency columns
    ['E', 'F'].forEach((col) => {
      const column = sheet.getColumn(col);
      column.numFmt = '"$"#,##0.00';
    });

    // Format percentage column
    const percentColumn = sheet.getColumn('G');
    percentColumn.numFmt = '0.00"%"';

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 20;
      }
    });
  }

  /**
   * Add performance by category sheet
   */
  private addPerformanceByCategorySheet(workbook: ExcelJS.Workbook, performanceByCategory: any[]) {
    const sheet = workbook.addWorksheet('Por Categoría');

    sheet.getCell('A1').value = 'PERFORMANCE POR CATEGORÍA';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.addTable({
      name: 'PerformanceByCategoryTable',
      ref: 'A3',
      headerRow: true,
      totalsRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: 'Categoría', totalsRowLabel: 'TOTAL:', filterButton: true },
        { name: 'Productos', totalsRowFunction: 'sum', filterButton: true },
        { name: 'Cantidad Vendida', totalsRowFunction: 'sum', filterButton: true },
        { name: 'Ingresos', totalsRowFunction: 'sum', filterButton: true },
        { name: 'Ganancia', totalsRowFunction: 'sum', filterButton: true },
        { name: 'Margen %', totalsRowFunction: 'average', filterButton: true },
      ],
      rows: performanceByCategory.map((item) => [
        item.categoryName,
        item.productCount,
        item.quantitySold,
        item.revenue,
        item.profit,
        item.profitMargin,
      ]),
    });

    // Format currency columns
    ['D', 'E'].forEach((col) => {
      const column = sheet.getColumn(col);
      column.numFmt = '"$"#,##0.00';
    });

    // Format percentage column
    const percentColumn = sheet.getColumn('F');
    percentColumn.numFmt = '0.00"%"';

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 25;
      }
    });
  }

  /**
   * Add inventory movements sheet
   */
  addInventoryMovementsSheet(workbook: ExcelJS.Workbook, data: any) {
    const { period, summary, movementsByStatus, movementsByDate, recentMovements } = data;

    const sheet = workbook.addWorksheet('Movimientos de Inventario');

    // Title
    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = 'MOVIMIENTOS DE INVENTARIO';
    sheet.getCell('A1').font = { bold: true, size: 16 };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

    // Period
    sheet.mergeCells('A2:E2');
    sheet.getCell('A2').value = `Período: ${period.startDate} - ${period.endDate}`;
    sheet.getCell('A2').alignment = { horizontal: 'center' };

    // Summary
    sheet.getCell('A4').value = 'RESUMEN';
    sheet.getCell('A4').font = { bold: true, size: 12 };

    const summaryData = [
      ['Métrica', 'Valor'],
      ['Total Movimientos', summary.totalMovements],
      ['Items Movidos', summary.totalItemsMoved],
    ];

    sheet.addTable({
      name: 'MovementsSummaryTable',
      ref: 'A5',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [{ name: 'Métrica' }, { name: 'Valor' }],
      rows: summaryData.slice(1),
    });

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 25;
      }
    });

    // Add additional sheets
    this.addMovementsByStatusSheet(workbook, movementsByStatus);
    this.addMovementsByDateSheet(workbook, movementsByDate);
    this.addRecentMovementsSheet(workbook, recentMovements);
  }

  /**
   * Add movements by status sheet
   */
  private addMovementsByStatusSheet(workbook: ExcelJS.Workbook, movementsByStatus: any[]) {
    const sheet = workbook.addWorksheet('Por Estado');

    sheet.getCell('A1').value = 'MOVIMIENTOS POR ESTADO';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.addTable({
      name: 'MovementsByStatusTable',
      ref: 'A3',
      headerRow: true,
      totalsRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: 'Estado', totalsRowLabel: 'TOTAL:', filterButton: true },
        { name: 'Cantidad', totalsRowFunction: 'sum', filterButton: true },
        { name: 'Items Movidos', totalsRowFunction: 'sum', filterButton: true },
      ],
      rows: movementsByStatus.map((item) => [item.status, item.count, item.itemsCount]),
    });

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 25;
      }
    });
  }

  /**
   * Add movements by date sheet
   */
  private addMovementsByDateSheet(workbook: ExcelJS.Workbook, movementsByDate: any[]) {
    const sheet = workbook.addWorksheet('Por Fecha');

    sheet.getCell('A1').value = 'MOVIMIENTOS POR FECHA';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.addTable({
      name: 'MovementsByDateTable',
      ref: 'A3',
      headerRow: true,
      totalsRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: 'Fecha', totalsRowLabel: 'TOTAL:', filterButton: true },
        { name: 'Cantidad', totalsRowFunction: 'sum', filterButton: true },
        { name: 'Items Movidos', totalsRowFunction: 'sum', filterButton: true },
      ],
      rows: movementsByDate.map((item) => [item.date, item.count, item.itemsCount]),
    });

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 20;
      }
    });
  }

  /**
   * Add recent movements sheet
   */
  private addRecentMovementsSheet(workbook: ExcelJS.Workbook, recentMovements: any[]) {
    const sheet = workbook.addWorksheet('Movimientos Recientes');

    sheet.getCell('A1').value = 'MOVIMIENTOS RECIENTES';
    sheet.getCell('A1').font = { bold: true, size: 14 };

    sheet.addTable({
      name: 'RecentMovementsTable',
      ref: 'A3',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: [
        { name: 'N° Transfer', filterButton: true },
        { name: 'Origen', filterButton: true },
        { name: 'Destino', filterButton: true },
        { name: 'Estado', filterButton: true },
        { name: 'Items', filterButton: true },
        { name: 'Cantidad', filterButton: true },
        { name: 'Creado Por', filterButton: true },
      ],
      rows: recentMovements.map((item) => [
        item.transferNumber,
        item.sourceLocation,
        item.destinationLocation,
        item.status,
        item.itemCount,
        item.totalQuantity,
        item.createdBy,
      ]),
    });

    sheet.columns.forEach((column) => {
      if (column) {
        column.width = 20;
      }
    });
  }
}
