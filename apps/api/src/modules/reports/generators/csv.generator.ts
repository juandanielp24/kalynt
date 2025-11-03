import { Injectable, Logger } from '@nestjs/common';
import {
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
export class CSVGenerator {
  private readonly logger = new Logger(CSVGenerator.name);

  generate(type: ReportType, data: ReportData): string {
    switch (type) {
      case ReportType.SALES:
        return this.generateSalesCSV(data as SalesReportData);
      case ReportType.INVENTORY:
        return this.generateInventoryCSV(data as InventoryReportData);
      case ReportType.FINANCIAL:
        return this.generateFinancialCSV(data as FinancialReportData);
      case ReportType.PRODUCTS:
        return this.generateProductsCSV(data as ProductsReportData);
      case ReportType.CUSTOMERS:
        return this.generateCustomersCSV(data as CustomersReportData);
      case ReportType.TAX:
        return this.generateTaxCSV(data as TaxReportData);
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }
  }

  private generateSalesCSV(data: SalesReportData): string {
    const headers = [
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
    ];

    const rows = data.sales.map((sale) => [
      sale.saleNumber,
      sale.date.toLocaleDateString('es-AR'),
      sale.customerName || 'Consumidor Final',
      sale.items.toString(),
      this.formatCurrency(sale.subtotalCents),
      this.formatCurrency(sale.taxCents),
      this.formatCurrency(sale.totalCents),
      sale.paymentMethod,
      sale.location,
      sale.status,
    ]);

    // Add summary rows
    rows.push([]);
    rows.push(['RESUMEN']);
    rows.push(['Total de Ventas', data.summary.totalSales.toString()]);
    rows.push([
      'Ingresos Totales',
      this.formatCurrency(data.summary.totalRevenue),
    ]);
    rows.push(['IVA Total', this.formatCurrency(data.summary.totalTax)]);
    rows.push([
      'Ticket Promedio',
      this.formatCurrency(data.summary.averageTicket),
    ]);

    // Add top products
    if (data.summary.topProducts.length > 0) {
      rows.push([]);
      rows.push(['Productos Más Vendidos']);
      rows.push(['Producto', 'Cantidad', 'Ingresos']);
      data.summary.topProducts.forEach((product) => {
        rows.push([
          product.name,
          product.quantity.toString(),
          this.formatCurrency(product.revenue),
        ]);
      });
    }

    return this.arrayToCSV([headers, ...rows]);
  }

  private generateInventoryCSV(data: InventoryReportData): string {
    const headers = [
      'SKU',
      'Producto',
      'Categoría',
      'Stock Actual',
      'Stock Mínimo',
      'Stock Máximo',
      'Costo Unitario',
      'Precio Unitario',
      'Valor Total',
      'Estado',
    ];

    const rows = data.products.map((product) => [
      product.sku,
      product.name,
      product.category,
      product.stock.toString(),
      product.minStock.toString(),
      product.maxStock.toString(),
      this.formatCurrency(product.costCents),
      this.formatCurrency(product.priceCents),
      this.formatCurrency(product.totalValueCents),
      this.getStockStatusLabel(product.status),
    ]);

    // Add summary
    rows.push([]);
    rows.push(['RESUMEN']);
    rows.push(['Total de Productos', data.summary.totalProducts.toString()]);
    rows.push([
      'Valor Total Inventario',
      this.formatCurrency(data.summary.totalValue),
    ]);
    rows.push([
      'Productos con Stock Bajo',
      data.summary.lowStockItems.toString(),
    ]);
    rows.push([
      'Productos Sin Stock',
      data.summary.outOfStockItems.toString(),
    ]);
    rows.push([
      'Productos con Exceso',
      data.summary.excessStockItems.toString(),
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  private generateFinancialCSV(data: FinancialReportData): string {
    const rows = [
      ['Reporte Financiero'],
      [],
      ['INGRESOS'],
      ['Efectivo', this.formatCurrency(data.revenue.cash)],
      ['Tarjeta', this.formatCurrency(data.revenue.card)],
      ['Transferencia', this.formatCurrency(data.revenue.transfer)],
      ['Mercado Pago', this.formatCurrency(data.revenue.mercadoPago)],
      ['Total Ingresos', this.formatCurrency(data.revenue.total)],
      [],
      ['EGRESOS'],
      ['Compras', this.formatCurrency(data.expenses.purchases)],
      ['Salarios', this.formatCurrency(data.expenses.salaries)],
      ['Alquiler', this.formatCurrency(data.expenses.rent)],
      ['Servicios', this.formatCurrency(data.expenses.utilities)],
      ['Otros', this.formatCurrency(data.expenses.other)],
      ['Total Egresos', this.formatCurrency(data.expenses.total)],
      [],
      ['RENTABILIDAD'],
      ['Beneficio Bruto', this.formatCurrency(data.profit.gross)],
      ['Beneficio Neto', this.formatCurrency(data.profit.net)],
      ['Margen', `${data.profit.margin.toFixed(2)}%`],
      [],
      ['IMPUESTOS'],
      ['IVA Recaudado', this.formatCurrency(data.taxes.collected)],
      ['IVA Pagado', this.formatCurrency(data.taxes.paid)],
      ['IVA Pendiente', this.formatCurrency(data.taxes.pending)],
    ];

    return this.arrayToCSV(rows);
  }

  private generateProductsCSV(data: ProductsReportData): string {
    const headers = [
      'Producto',
      'SKU',
      'Categoría',
      'Unidades Vendidas',
      'Ingresos',
      'Beneficio',
      'Margen %',
    ];

    const rows = data.products.map((product) => [
      product.name,
      product.sku,
      product.category,
      product.unitsSold.toString(),
      this.formatCurrency(product.revenue),
      this.formatCurrency(product.profit),
      `${product.margin.toFixed(2)}%`,
    ]);

    // Add summary
    rows.push([]);
    rows.push(['RESUMEN']);
    rows.push([
      'Ingresos Totales',
      this.formatCurrency(data.summary.totalRevenue),
    ]);
    rows.push([
      'Beneficio Total',
      this.formatCurrency(data.summary.totalProfit),
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  private generateCustomersCSV(data: CustomersReportData): string {
    const headers = [
      'Cliente',
      'Email',
      'Teléfono',
      'Total Compras',
      'Total Gastado',
      'Ticket Promedio',
      'Última Compra',
    ];

    const rows = data.customers.map((customer) => [
      customer.name,
      customer.email,
      customer.phone || '-',
      customer.totalPurchases.toString(),
      this.formatCurrency(customer.totalSpent),
      this.formatCurrency(customer.averageTicket),
      customer.lastPurchase.toLocaleDateString('es-AR'),
    ]);

    // Add summary
    rows.push([]);
    rows.push(['RESUMEN']);
    rows.push(['Total Clientes', data.summary.totalCustomers.toString()]);
    rows.push(['Clientes Nuevos', data.summary.newCustomers.toString()]);
    rows.push([
      'Clientes Recurrentes',
      data.summary.repeatCustomers.toString(),
    ]);
    rows.push([
      'Ingresos Totales',
      this.formatCurrency(data.summary.totalRevenue),
    ]);
    rows.push([
      'Gasto Promedio por Cliente',
      this.formatCurrency(data.summary.averageSpendPerCustomer),
    ]);

    return this.arrayToCSV([headers, ...rows]);
  }

  private generateTaxCSV(data: TaxReportData): string {
    const headers = [
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
    ];

    const rows = data.invoices.map((invoice) => [
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

    // Add summary
    rows.push([]);
    rows.push(['RESUMEN PERÍODO']);
    rows.push([
      `${data.period.startDate.toLocaleDateString('es-AR')} - ${data.period.endDate.toLocaleDateString('es-AR')}`,
    ]);
    rows.push(['Total Facturas', data.summary.totalInvoices.toString()]);
    rows.push([
      'Monto Neto Total',
      this.formatCurrency(data.summary.totalNetAmount),
    ]);
    rows.push(['IVA Total', this.formatCurrency(data.summary.totalTaxAmount)]);
    rows.push(['Total General', this.formatCurrency(data.summary.totalAmount)]);

    // Add breakdown by type
    rows.push([]);
    rows.push(['Detalle por Tipo de Comprobante']);
    rows.push(['Tipo', 'Cantidad', 'Monto Total']);
    Object.entries(data.summary.byInvoiceType).forEach(([type, stats]) => {
      rows.push([
        type,
        stats.count.toString(),
        this.formatCurrency(stats.amount),
      ]);
    });

    return this.arrayToCSV([headers, ...rows]);
  }

  private arrayToCSV(data: any[][]): string {
    return data
      .map((row) => {
        return row
          .map((cell) => {
            const cellStr = cell?.toString() || '';
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            if (
              cellStr.includes(',') ||
              cellStr.includes('"') ||
              cellStr.includes('\n')
            ) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(',');
      })
      .join('\n');
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
}
