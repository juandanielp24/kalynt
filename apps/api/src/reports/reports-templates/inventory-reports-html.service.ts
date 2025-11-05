import { Injectable } from '@nestjs/common';

@Injectable()
export class InventoryReportsHTMLService {
  /**
   * Generate inventory stock HTML
   */
  generateInventoryStockHTML(data: any): string {
    const { summary, stockByCategory, stockByLocation, stockStatus, lowStockItems, outOfStockItems } = data;

    return `
      <div class="section">
        <h2 class="section-title">Resumen de Inventario</h2>

        <div class="summary-card">
          <h3>Total Productos</h3>
          <div class="value">${summary.totalProducts}</div>
        </div>

        <div class="summary-card">
          <h3>Stock Total</h3>
          <div class="value">${summary.totalStock.toLocaleString('es-AR')}</div>
        </div>

        <div class="summary-card">
          <h3>Valor Total</h3>
          <div class="value">$${summary.totalValue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
        </div>

        <div class="summary-card">
          <h3>Bajo Stock</h3>
          <div class="value" style="color: #f59e0b;">${summary.lowStockCount}</div>
        </div>

        <div style="clear: both;"></div>
      </div>

      ${this.generateStockStatusSection(stockStatus)}
      ${this.generateStockByCategorySection(stockByCategory)}
      ${this.generateStockByLocationSection(stockByLocation)}
      ${lowStockItems.length > 0 ? this.generateLowStockSection(lowStockItems) : ''}
      ${outOfStockItems.length > 0 ? this.generateOutOfStockSection(outOfStockItems) : ''}
    `;
  }

  /**
   * Generate stock status section
   */
  private generateStockStatusSection(stockStatus: any): string {
    const total = stockStatus.normal + stockStatus.low + stockStatus.out;

    return `
      <div class="section">
        <h2 class="section-title">Estado del Stock</h2>
        <table>
          <thead>
            <tr>
              <th>Estado</th>
              <th class="text-center">Cantidad</th>
              <th class="text-right">Porcentaje</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span style="color: #10b981;">●</span> Normal</td>
              <td class="text-center">${stockStatus.normal}</td>
              <td class="text-right">${total > 0 ? ((stockStatus.normal / total) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td><span style="color: #f59e0b;">●</span> Bajo Stock</td>
              <td class="text-center">${stockStatus.low}</td>
              <td class="text-right">${total > 0 ? ((stockStatus.low / total) * 100).toFixed(1) : 0}%</td>
            </tr>
            <tr>
              <td><span style="color: #ef4444;">●</span> Agotado</td>
              <td class="text-center">${stockStatus.out}</td>
              <td class="text-right">${total > 0 ? ((stockStatus.out / total) * 100).toFixed(1) : 0}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate stock by category section
   */
  private generateStockByCategorySection(stockByCategory: any[]): string {
    if (stockByCategory.length === 0) return '';

    const rows = stockByCategory
      .map(
        (item) => `
      <tr>
        <td>${item.categoryName}</td>
        <td class="text-center">${item.productCount}</td>
        <td class="text-right">${item.totalStock.toLocaleString('es-AR')}</td>
        <td class="text-right">$${item.totalValue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
      </tr>
    `
      )
      .join('');

    return `
      <div class="section">
        <h2 class="section-title">Stock por Categoría</h2>
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th class="text-center">Productos</th>
              <th class="text-right">Stock Total</th>
              <th class="text-right">Valor</th>
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
   * Generate stock by location section
   */
  private generateStockByLocationSection(stockByLocation: any[]): string {
    if (stockByLocation.length === 0) return '';

    const rows = stockByLocation
      .map(
        (item) => `
      <tr>
        <td>${item.locationName}</td>
        <td class="text-center">${item.productCount}</td>
        <td class="text-right">${item.totalStock.toLocaleString('es-AR')}</td>
        <td class="text-right">$${item.totalValue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
      </tr>
    `
      )
      .join('');

    return `
      <div class="section">
        <h2 class="section-title">Stock por Ubicación</h2>
        <table>
          <thead>
            <tr>
              <th>Ubicación</th>
              <th class="text-center">Productos</th>
              <th class="text-right">Stock Total</th>
              <th class="text-right">Valor</th>
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
   * Generate low stock section
   */
  private generateLowStockSection(lowStockItems: any[]): string {
    const rows = lowStockItems
      .map(
        (item) => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.productSku}</td>
        <td>${item.locationName}</td>
        <td class="text-center" style="color: #f59e0b; font-weight: bold;">${item.currentStock}</td>
        <td class="text-center">${item.minStock}</td>
        <td class="text-center" style="color: #ef4444;">${item.difference}</td>
      </tr>
    `
      )
      .join('');

    return `
      <div class="section page-break">
        <h2 class="section-title">⚠️ Productos con Bajo Stock</h2>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Ubicación</th>
              <th class="text-center">Stock Actual</th>
              <th class="text-center">Mínimo</th>
              <th class="text-center">Diferencia</th>
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
   * Generate out of stock section
   */
  private generateOutOfStockSection(outOfStockItems: any[]): string {
    const rows = outOfStockItems
      .map(
        (item) => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.productSku}</td>
        <td>${item.locationName}</td>
      </tr>
    `
      )
      .join('');

    return `
      <div class="section">
        <h2 class="section-title">🚫 Productos Agotados</h2>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>SKU</th>
              <th>Ubicación</th>
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
   * Generate products performance HTML
   */
  generateProductsPerformanceHTML(data: any): string {
    const { period, summary, topPerformers, worstPerformers, mostProfitable, performanceByCategory } = data;

    return `
      <div class="section">
        <h2 class="section-title">Performance de Productos</h2>
        <p style="margin-bottom: 15px;">Período: ${period.startDate} - ${period.endDate}</p>

        <div class="summary-card">
          <h3>Total Productos</h3>
          <div class="value">${summary.totalProducts}</div>
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
          <h3>Margen Promedio</h3>
          <div class="value">${summary.averageProfitMargin.toFixed(2)}%</div>
        </div>

        <div style="clear: both;"></div>
      </div>

      ${this.generateTopPerformersSection(topPerformers)}
      ${this.generateMostProfitableSection(mostProfitable)}
      ${this.generatePerformanceByCategorySection(performanceByCategory)}
      ${worstPerformers.length > 0 ? this.generateWorstPerformersSection(worstPerformers) : ''}
    `;
  }

  /**
   * Generate top performers section
   */
  private generateTopPerformersSection(topPerformers: any[]): string {
    if (topPerformers.length === 0) return '';

    const rows = topPerformers
      .map(
        (item) => `
      <tr>
        <td class="text-center">${item.rank}</td>
        <td>${item.productName}</td>
        <td>${item.productSku}</td>
        <td class="text-center">${item.quantitySold}</td>
        <td class="text-right">$${item.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">$${item.profit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">${item.profitMargin.toFixed(2)}%</td>
      </tr>
    `
      )
      .join('');

    return `
      <div class="section">
        <h2 class="section-title">🏆 Top 10 Productos por Ingresos</h2>
        <table>
          <thead>
            <tr>
              <th class="text-center">#</th>
              <th>Producto</th>
              <th>SKU</th>
              <th class="text-center">Cantidad</th>
              <th class="text-right">Ingresos</th>
              <th class="text-right">Ganancia</th>
              <th class="text-right">Margen</th>
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
   * Generate most profitable section
   */
  private generateMostProfitableSection(mostProfitable: any[]): string {
    if (mostProfitable.length === 0) return '';

    const rows = mostProfitable
      .map(
        (item, index) => `
      <tr>
        <td class="text-center">${index + 1}</td>
        <td>${item.productName}</td>
        <td>${item.productSku}</td>
        <td class="text-center">${item.quantitySold}</td>
        <td class="text-right">$${item.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">$${item.profit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right" style="color: #10b981; font-weight: bold;">${item.profitMargin.toFixed(2)}%</td>
      </tr>
    `
      )
      .join('');

    return `
      <div class="section page-break">
        <h2 class="section-title">💰 Top 10 Productos por Margen de Ganancia</h2>
        <table>
          <thead>
            <tr>
              <th class="text-center">#</th>
              <th>Producto</th>
              <th>SKU</th>
              <th class="text-center">Cantidad</th>
              <th class="text-right">Ingresos</th>
              <th class="text-right">Ganancia</th>
              <th class="text-right">Margen</th>
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
   * Generate worst performers section
   */
  private generateWorstPerformersSection(worstPerformers: any[]): string {
    const rows = worstPerformers
      .map(
        (item) => `
      <tr>
        <td class="text-center">${item.rank}</td>
        <td>${item.productName}</td>
        <td>${item.productSku}</td>
        <td class="text-center">${item.quantitySold}</td>
        <td class="text-right">$${item.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">$${item.profit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">${item.profitMargin.toFixed(2)}%</td>
      </tr>
    `
      )
      .join('');

    return `
      <div class="section">
        <h2 class="section-title">📉 Productos con Menor Performance</h2>
        <table>
          <thead>
            <tr>
              <th class="text-center">#</th>
              <th>Producto</th>
              <th>SKU</th>
              <th class="text-center">Cantidad</th>
              <th class="text-right">Ingresos</th>
              <th class="text-right">Ganancia</th>
              <th class="text-right">Margen</th>
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
   * Generate performance by category section
   */
  private generatePerformanceByCategorySection(performanceByCategory: any[]): string {
    if (performanceByCategory.length === 0) return '';

    const rows = performanceByCategory
      .map(
        (item) => `
      <tr>
        <td>${item.categoryName}</td>
        <td class="text-center">${item.productCount}</td>
        <td class="text-center">${item.quantitySold}</td>
        <td class="text-right">$${item.revenue.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">$${item.profit.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
        <td class="text-right">${item.profitMargin.toFixed(2)}%</td>
      </tr>
    `
      )
      .join('');

    return `
      <div class="section">
        <h2 class="section-title">Performance por Categoría</h2>
        <table>
          <thead>
            <tr>
              <th>Categoría</th>
              <th class="text-center">Productos</th>
              <th class="text-center">Cantidad Vendida</th>
              <th class="text-right">Ingresos</th>
              <th class="text-right">Ganancia</th>
              <th class="text-right">Margen</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }
}
