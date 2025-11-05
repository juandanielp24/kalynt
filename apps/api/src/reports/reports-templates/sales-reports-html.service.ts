import { Injectable } from '@nestjs/common';
import * as dayjs from 'dayjs';

@Injectable()
export class SalesReportsHTMLService {
  /**
   * Generate sales summary HTML
   */
  generateSalesSummaryHTML(data: any): string {
    const { period, summary, salesByDate, salesByPaymentMethod, salesByLocation, salesByUser, topProducts } = data;

    return `
      <div class="section">
        <h2 class="section-title">Resumen General</h2>

        <div class="summary-card">
          <h3>Total Ventas</h3>
          <div class="value">${summary.totalSales}</div>
        </div>

        <div class="summary-card">
          <h3>Ingresos Totales</h3>
          <div class="value">$${summary.totalRevenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
        </div>

        <div class="summary-card">
          <h3>Ganancia Total</h3>
          <div class="value">$${summary.totalProfit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
        </div>

        <div class="summary-card">
          <h3>Ticket Promedio</h3>
          <div class="value">$${summary.averageTicket.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
        </div>

        <div style="clear: both;"></div>
      </div>

      ${this.generateSalesByDateSection(salesByDate)}
      ${this.generateSalesByPaymentMethodSection(salesByPaymentMethod, summary.totalRevenue)}
      ${this.generateTopProductsSection(topProducts)}
      ${salesByLocation.length > 0 ? this.generateSalesByLocationSection(salesByLocation) : ''}
      ${this.generateSalesByUserSection(salesByUser)}
    `;
  }

  /**
   * Generate sales by date section
   */
  private generateSalesByDateSection(salesByDate: any[]): string {
    if (salesByDate.length === 0) return '';

    const rows = salesByDate
      .map(
        (item) => `
      <tr>
        <td>${item.date}</td>
        <td class="text-center">${item.count}</td>
        <td class="text-right">$${item.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">$${item.profit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">${item.count > 0 ? `$${(item.revenue / item.count).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}</td>
      </tr>
    `
      )
      .join('');

    return `
      <div class="section">
        <h2 class="section-title">Ventas por Día</h2>
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th class="text-center">Cantidad</th>
              <th class="text-right">Ingresos</th>
              <th class="text-right">Ganancia</th>
              <th class="text-right">Ticket Prom.</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate sales by payment method section
   */
  private generateSalesByPaymentMethodSection(salesByPaymentMethod: any[], totalRevenue: number): string {
    if (salesByPaymentMethod.length === 0) return '';

    const rows = salesByPaymentMethod
      .map((item) => {
        const percentage = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0;
        return `
      <tr>
        <td>${item.method}</td>
        <td class="text-center">${item.count}</td>
        <td class="text-right">$${item.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">${percentage.toFixed(1)}%</td>
      </tr>
    `;
      })
      .join('');

    return `
      <div class="section">
        <h2 class="section-title">Ventas por Método de Pago</h2>
        <table>
          <thead>
            <tr>
              <th>Método de Pago</th>
              <th class="text-center">Cantidad</th>
              <th class="text-right">Ingresos</th>
              <th class="text-right">% Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate top products section
   */
  private generateTopProductsSection(topProducts: any[]): string {
    if (topProducts.length === 0) return '';

    const rows = topProducts
      .map(
        (item, index) => `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td>${item.productName}</td>
        <td>${item.productSku}</td>
        <td class="text-center">${item.quantity}</td>
        <td class="text-right">$${item.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
      </tr>
    `
      )
      .join('');

    return `
      <div class="section">
        <h2 class="section-title">Top 10 Productos Más Vendidos</h2>
        <table>
          <thead>
            <tr>
              <th class="text-center">#</th>
              <th>Producto</th>
              <th>SKU</th>
              <th class="text-center">Cantidad</th>
              <th class="text-right">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate sales by location section
   */
  private generateSalesByLocationSection(salesByLocation: any[]): string {
    const rows = salesByLocation
      .map(
        (item) => `
      <tr>
        <td>${item.locationName}</td>
        <td class="text-center">${item.count}</td>
        <td class="text-right">$${item.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">${item.count > 0 ? `$${(item.revenue / item.count).toLocaleString('es-AR', { minimumFractionDigits: 2 })}` : '-'}</td>
      </tr>
    `
      )
      .join('');

    return `
      <div class="section">
        <h2 class="section-title">Ventas por Ubicación</h2>
        <table>
          <thead>
            <tr>
              <th>Ubicación</th>
              <th class="text-center">Cantidad</th>
              <th class="text-right">Ingresos</th>
              <th class="text-right">Ticket Prom.</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate sales by user section
   */
  private generateSalesByUserSection(salesByUser: any[]): string {
    if (salesByUser.length === 0) return '';

    const rows = salesByUser
      .map(
        (item) => `
      <tr>
        <td>${item.userName}</td>
        <td class="text-center">${item.count}</td>
        <td class="text-right">$${item.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">$${item.averageTicket.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
      </tr>
    `
      )
      .join('');

    return `
      <div class="section">
        <h2 class="section-title">Ventas por Vendedor</h2>
        <table>
          <thead>
            <tr>
              <th>Vendedor</th>
              <th class="text-center">Cantidad</th>
              <th class="text-right">Ingresos</th>
              <th class="text-right">Ticket Prom.</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate sales detail HTML
   */
  generateSalesDetailHTML(data: any): string {
    const { period, sales } = data;

    if (sales.length === 0) {
      return '<div class="section"><p>No hay ventas en el período seleccionado.</p></div>';
    }

    const rows = sales
      .map(
        (sale: any) => `
      <tr>
        <td>${sale.saleNumber}</td>
        <td>${dayjs(sale.createdAt).format('DD/MM/YYYY HH:mm')}</td>
        <td>${sale.customerName || 'Cliente General'}</td>
        <td>${sale.location?.name || '-'}</td>
        <td class="text-center">${sale.items.length}</td>
        <td>${sale.paymentMethod || '-'}</td>
        <td class="text-right">$${sale.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">$${sale.discount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">$${sale.totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
      </tr>
    `
      )
      .join('');

    const totalAmount = sales.reduce((sum: number, sale: any) => sum + sale.totalAmount, 0);
    const totalDiscount = sales.reduce((sum: number, sale: any) => sum + sale.discount, 0);
    const totalSubtotal = sales.reduce((sum: number, sale: any) => sum + sale.subtotal, 0);

    return `
      <div class="section">
        <h2 class="section-title">Detalle de Ventas</h2>
        <p style="margin-bottom: 15px;">Período: ${period.startDate} - ${period.endDate}</p>

        <table>
          <thead>
            <tr>
              <th>N° Venta</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Ubicación</th>
              <th class="text-center">Items</th>
              <th>Método Pago</th>
              <th class="text-right">Subtotal</th>
              <th class="text-right">Descuento</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
          <tfoot>
            <tr style="font-weight: bold; background: #f3f4f6;">
              <td colspan="6" class="text-right">TOTALES:</td>
              <td class="text-right">$${totalSubtotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
              <td class="text-right">$${totalDiscount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
              <td class="text-right">$${totalAmount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>

        <div style="margin-top: 20px;">
          <strong>Total de ventas:</strong> ${sales.length}
        </div>
      </div>
    `;
  }
}
