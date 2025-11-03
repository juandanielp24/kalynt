import { Injectable, Logger } from '@nestjs/common';
import puppeteer from 'puppeteer';
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
export class PDFGenerator {
  private readonly logger = new Logger(PDFGenerator.name);

  async generate(
    type: ReportType,
    data: ReportData,
    metadata: ReportMetadata,
  ): Promise<Buffer> {
    let html: string;

    switch (type) {
      case ReportType.SALES:
        html = this.generateSalesHTML(data as SalesReportData, metadata);
        break;
      case ReportType.INVENTORY:
        html = this.generateInventoryHTML(data as InventoryReportData, metadata);
        break;
      case ReportType.FINANCIAL:
        html = this.generateFinancialHTML(data as FinancialReportData, metadata);
        break;
      case ReportType.PRODUCTS:
        html = this.generateProductsHTML(data as ProductsReportData, metadata);
        break;
      case ReportType.CUSTOMERS:
        html = this.generateCustomersHTML(data as CustomersReportData, metadata);
        break;
      case ReportType.TAX:
        html = this.generateTaxHTML(data as TaxReportData, metadata);
        break;
      default:
        throw new Error(`Unsupported report type: ${type}`);
    }

    return await this.htmlToPDF(html);
  }

  private async htmlToPDF(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        printBackground: true,
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private generateSalesHTML(
    data: SalesReportData,
    metadata: ReportMetadata,
  ): string {
    const salesRows = data.sales
      .map(
        (sale) => `
      <tr>
        <td>${sale.saleNumber}</td>
        <td>${sale.date.toLocaleDateString('es-AR')}</td>
        <td>${sale.customerName || 'Consumidor Final'}</td>
        <td>${sale.items}</td>
        <td class="currency">${this.formatCurrency(sale.subtotalCents)}</td>
        <td class="currency">${this.formatCurrency(sale.taxCents)}</td>
        <td class="currency">${this.formatCurrency(sale.totalCents)}</td>
        <td>${sale.paymentMethod}</td>
      </tr>
    `,
      )
      .join('');

    const topProducts = data.summary.topProducts
      .map(
        (product) => `
      <tr>
        <td>${product.name}</td>
        <td>${product.quantity}</td>
        <td class="currency">${this.formatCurrency(product.revenue)}</td>
      </tr>
    `,
      )
      .join('');

    return this.getBaseHTML(
      metadata,
      `
      <div class="summary-box">
        <h3>Resumen de Ventas</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Total Ventas:</span>
            <span class="summary-value">${data.summary.totalSales}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Ingresos Totales:</span>
            <span class="summary-value">${this.formatCurrency(data.summary.totalRevenue)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">IVA Total:</span>
            <span class="summary-value">${this.formatCurrency(data.summary.totalTax)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Ticket Promedio:</span>
            <span class="summary-value">${this.formatCurrency(data.summary.averageTicket)}</span>
          </div>
        </div>
      </div>

      <h3>Detalle de Ventas</h3>
      <table>
        <thead>
          <tr>
            <th>N° Venta</th>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Items</th>
            <th>Subtotal</th>
            <th>IVA</th>
            <th>Total</th>
            <th>Método Pago</th>
          </tr>
        </thead>
        <tbody>
          ${salesRows}
        </tbody>
      </table>

      ${
        topProducts
          ? `
        <div class="page-break"></div>
        <h3>Productos Más Vendidos</h3>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Ingresos</th>
            </tr>
          </thead>
          <tbody>
            ${topProducts}
          </tbody>
        </table>
      `
          : ''
      }
    `,
    );
  }

  private generateInventoryHTML(
    data: InventoryReportData,
    metadata: ReportMetadata,
  ): string {
    const productRows = data.products
      .map((product) => {
        const statusClass = this.getStockStatusClass(product.status);
        return `
        <tr>
          <td>${product.sku}</td>
          <td>${product.name}</td>
          <td>${product.category}</td>
          <td>${product.stock}</td>
          <td>${product.minStock}</td>
          <td class="currency">${this.formatCurrency(product.costCents)}</td>
          <td class="currency">${this.formatCurrency(product.priceCents)}</td>
          <td class="currency">${this.formatCurrency(product.totalValueCents)}</td>
          <td><span class="status-badge ${statusClass}">${this.getStockStatusLabel(product.status)}</span></td>
        </tr>
      `;
      })
      .join('');

    return this.getBaseHTML(
      metadata,
      `
      <div class="summary-box">
        <h3>Resumen de Inventario</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Total Productos:</span>
            <span class="summary-value">${data.summary.totalProducts}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Valor Total:</span>
            <span class="summary-value">${this.formatCurrency(data.summary.totalValue)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Stock Bajo:</span>
            <span class="summary-value warning">${data.summary.lowStockItems}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Sin Stock:</span>
            <span class="summary-value danger">${data.summary.outOfStockItems}</span>
          </div>
        </div>
      </div>

      <h3>Detalle de Inventario</h3>
      <table>
        <thead>
          <tr>
            <th>SKU</th>
            <th>Producto</th>
            <th>Categoría</th>
            <th>Stock</th>
            <th>Min</th>
            <th>Costo</th>
            <th>Precio</th>
            <th>Valor Total</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>
    `,
    );
  }

  private generateFinancialHTML(
    data: FinancialReportData,
    metadata: ReportMetadata,
  ): string {
    return this.getBaseHTML(
      metadata,
      `
      <div class="financial-grid">
        <div class="financial-section">
          <h3>Ingresos</h3>
          <table class="compact-table">
            <tr>
              <td>Efectivo</td>
              <td class="currency">${this.formatCurrency(data.revenue.cash)}</td>
            </tr>
            <tr>
              <td>Tarjeta</td>
              <td class="currency">${this.formatCurrency(data.revenue.card)}</td>
            </tr>
            <tr>
              <td>Transferencia</td>
              <td class="currency">${this.formatCurrency(data.revenue.transfer)}</td>
            </tr>
            <tr>
              <td>Mercado Pago</td>
              <td class="currency">${this.formatCurrency(data.revenue.mercadoPago)}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Total Ingresos</strong></td>
              <td class="currency"><strong>${this.formatCurrency(data.revenue.total)}</strong></td>
            </tr>
          </table>
        </div>

        <div class="financial-section">
          <h3>Egresos</h3>
          <table class="compact-table">
            <tr>
              <td>Compras</td>
              <td class="currency">${this.formatCurrency(data.expenses.purchases)}</td>
            </tr>
            <tr>
              <td>Salarios</td>
              <td class="currency">${this.formatCurrency(data.expenses.salaries)}</td>
            </tr>
            <tr>
              <td>Alquiler</td>
              <td class="currency">${this.formatCurrency(data.expenses.rent)}</td>
            </tr>
            <tr>
              <td>Servicios</td>
              <td class="currency">${this.formatCurrency(data.expenses.utilities)}</td>
            </tr>
            <tr>
              <td>Otros</td>
              <td class="currency">${this.formatCurrency(data.expenses.other)}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Total Egresos</strong></td>
              <td class="currency"><strong>${this.formatCurrency(data.expenses.total)}</strong></td>
            </tr>
          </table>
        </div>
      </div>

      <div class="summary-box highlight">
        <h3>Rentabilidad</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Beneficio Bruto:</span>
            <span class="summary-value">${this.formatCurrency(data.profit.gross)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Beneficio Neto:</span>
            <span class="summary-value">${this.formatCurrency(data.profit.net)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Margen:</span>
            <span class="summary-value">${data.profit.margin.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <div class="financial-section">
        <h3>Impuestos</h3>
        <table class="compact-table">
          <tr>
            <td>IVA Recaudado</td>
            <td class="currency">${this.formatCurrency(data.taxes.collected)}</td>
          </tr>
          <tr>
            <td>IVA Pagado</td>
            <td class="currency">${this.formatCurrency(data.taxes.paid)}</td>
          </tr>
          <tr class="total-row">
            <td><strong>IVA Pendiente</strong></td>
            <td class="currency"><strong>${this.formatCurrency(data.taxes.pending)}</strong></td>
          </tr>
        </table>
      </div>
    `,
    );
  }

  private generateProductsHTML(
    data: ProductsReportData,
    metadata: ReportMetadata,
  ): string {
    const productRows = data.products
      .map(
        (product) => `
      <tr>
        <td>${product.name}</td>
        <td>${product.sku}</td>
        <td>${product.category}</td>
        <td>${product.unitsSold}</td>
        <td class="currency">${this.formatCurrency(product.revenue)}</td>
        <td class="currency">${this.formatCurrency(product.profit)}</td>
        <td>${product.margin.toFixed(2)}%</td>
      </tr>
    `,
      )
      .join('');

    return this.getBaseHTML(
      metadata,
      `
      <div class="summary-box">
        <h3>Resumen de Productos</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Ingresos Totales:</span>
            <span class="summary-value">${this.formatCurrency(data.summary.totalRevenue)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Beneficio Total:</span>
            <span class="summary-value">${this.formatCurrency(data.summary.totalProfit)}</span>
          </div>
        </div>
      </div>

      <h3>Rendimiento por Producto</h3>
      <table>
        <thead>
          <tr>
            <th>Producto</th>
            <th>SKU</th>
            <th>Categoría</th>
            <th>Unidades</th>
            <th>Ingresos</th>
            <th>Beneficio</th>
            <th>Margen</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>
    `,
    );
  }

  private generateCustomersHTML(
    data: CustomersReportData,
    metadata: ReportMetadata,
  ): string {
    const customerRows = data.customers
      .map(
        (customer) => `
      <tr>
        <td>${customer.name}</td>
        <td>${customer.email}</td>
        <td>${customer.phone || '-'}</td>
        <td>${customer.totalPurchases}</td>
        <td class="currency">${this.formatCurrency(customer.totalSpent)}</td>
        <td class="currency">${this.formatCurrency(customer.averageTicket)}</td>
        <td>${customer.lastPurchase.toLocaleDateString('es-AR')}</td>
      </tr>
    `,
      )
      .join('');

    return this.getBaseHTML(
      metadata,
      `
      <div class="summary-box">
        <h3>Resumen de Clientes</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Total Clientes:</span>
            <span class="summary-value">${data.summary.totalCustomers}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Clientes Nuevos:</span>
            <span class="summary-value">${data.summary.newCustomers}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Ingresos Totales:</span>
            <span class="summary-value">${this.formatCurrency(data.summary.totalRevenue)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Gasto Promedio:</span>
            <span class="summary-value">${this.formatCurrency(data.summary.averageSpendPerCustomer)}</span>
          </div>
        </div>
      </div>

      <h3>Detalle de Clientes</h3>
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Compras</th>
            <th>Total Gastado</th>
            <th>Ticket Promedio</th>
            <th>Última Compra</th>
          </tr>
        </thead>
        <tbody>
          ${customerRows}
        </tbody>
      </table>
    `,
    );
  }

  private generateTaxHTML(
    data: TaxReportData,
    metadata: ReportMetadata,
  ): string {
    const invoiceRows = data.invoices
      .map(
        (invoice) => `
      <tr>
        <td>${invoice.number}</td>
        <td>${invoice.type}</td>
        <td>${invoice.date.toLocaleDateString('es-AR')}</td>
        <td>${invoice.customerCuit || '-'}</td>
        <td>${invoice.customerName || 'Consumidor Final'}</td>
        <td class="currency">${this.formatCurrency(invoice.netAmount)}</td>
        <td class="currency">${this.formatCurrency(invoice.taxAmount)}</td>
        <td class="currency">${this.formatCurrency(invoice.totalAmount)}</td>
        <td class="small">${invoice.cae}</td>
      </tr>
    `,
      )
      .join('');

    const typeBreakdown = Object.entries(data.summary.byInvoiceType)
      .map(
        ([type, stats]) => `
      <tr>
        <td>${type}</td>
        <td>${stats.count}</td>
        <td class="currency">${this.formatCurrency(stats.amount)}</td>
      </tr>
    `,
      )
      .join('');

    return this.getBaseHTML(
      metadata,
      `
      <div class="summary-box">
        <h3>Resumen AFIP - Período ${data.period.startDate.toLocaleDateString('es-AR')} al ${data.period.endDate.toLocaleDateString('es-AR')}</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Total Facturas:</span>
            <span class="summary-value">${data.summary.totalInvoices}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Monto Neto:</span>
            <span class="summary-value">${this.formatCurrency(data.summary.totalNetAmount)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">IVA Total:</span>
            <span class="summary-value">${this.formatCurrency(data.summary.totalTaxAmount)}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Total General:</span>
            <span class="summary-value">${this.formatCurrency(data.summary.totalAmount)}</span>
          </div>
        </div>
      </div>

      <h3>Detalle de Comprobantes</h3>
      <table class="small-text">
        <thead>
          <tr>
            <th>N° Factura</th>
            <th>Tipo</th>
            <th>Fecha</th>
            <th>CUIT</th>
            <th>Cliente</th>
            <th>Neto</th>
            <th>IVA</th>
            <th>Total</th>
            <th>CAE</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceRows}
        </tbody>
      </table>

      <div class="page-break"></div>
      <h3>Resumen por Tipo de Comprobante</h3>
      <table>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Cantidad</th>
            <th>Monto Total</th>
          </tr>
        </thead>
        <tbody>
          ${typeBreakdown}
        </tbody>
      </table>
    `,
    );
  }

  private getBaseHTML(metadata: ReportMetadata, content: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${metadata.title}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
            color: #333;
          }

          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            margin-bottom: 20px;
          }

          .header h1 {
            font-size: 24pt;
            margin-bottom: 5px;
          }

          .header h2 {
            font-size: 16pt;
            font-weight: normal;
            margin-bottom: 10px;
          }

          .header .meta {
            font-size: 9pt;
            opacity: 0.9;
          }

          h3 {
            color: #667eea;
            margin: 20px 0 10px 0;
            font-size: 14pt;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            background: white;
          }

          th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
          }

          th {
            background: #f5f5f5;
            font-weight: 600;
            color: #555;
            font-size: 9pt;
            text-transform: uppercase;
          }

          td {
            font-size: 10pt;
          }

          .currency {
            text-align: right;
            font-family: 'Courier New', monospace;
          }

          .summary-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin: 20px 0;
          }

          .summary-box.highlight {
            background: #e8f4f8;
            border-left-color: #00bcd4;
          }

          .summary-box h3 {
            margin-top: 0;
            color: #667eea;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 10px;
          }

          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 8px;
            background: white;
            border-radius: 4px;
          }

          .summary-label {
            color: #666;
            font-size: 9pt;
          }

          .summary-value {
            font-weight: bold;
            color: #333;
            font-size: 11pt;
          }

          .summary-value.warning {
            color: #ff9800;
          }

          .summary-value.danger {
            color: #f44336;
          }

          .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 8pt;
            font-weight: 600;
          }

          .status-normal {
            background: #4caf50;
            color: white;
          }

          .status-low {
            background: #ff9800;
            color: white;
          }

          .status-out {
            background: #f44336;
            color: white;
          }

          .status-excess {
            background: #2196f3;
            color: white;
          }

          .financial-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 20px 0;
          }

          .financial-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 4px;
          }

          .financial-section h3 {
            margin-top: 0;
            font-size: 12pt;
          }

          .compact-table {
            margin: 10px 0;
          }

          .compact-table td {
            padding: 5px 8px;
          }

          .total-row {
            border-top: 2px solid #667eea;
            background: #f0f0f0;
          }

          .small-text {
            font-size: 8pt;
          }

          .small {
            font-size: 8pt;
            font-family: 'Courier New', monospace;
          }

          .page-break {
            page-break-before: always;
          }

          @media print {
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${metadata.tenantName}</h1>
          <h2>${metadata.title}</h2>
          <div class="meta">
            <div>${metadata.description}</div>
            <div>Generado: ${metadata.generatedAt.toLocaleString('es-AR')}</div>
          </div>
        </div>

        ${content}
      </body>
      </html>
    `;
  }

  private formatCurrency(cents: number): string {
    return `$${(cents / 100).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  private getStockStatusClass(status: string): string {
    return `status-${status}`;
  }
}
