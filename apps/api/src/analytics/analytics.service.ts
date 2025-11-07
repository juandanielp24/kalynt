import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import * as dayjs from 'dayjs';
import * as isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface ComparisonPeriod {
  current: DateRange;
  previous: DateRange;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(tenantId: string, period: string = '30d') {
    const dateRange = this.parsePeriod(period);
    const comparisonPeriod = this.getComparisonPeriod(dateRange);

    const [
      salesMetrics,
      previousSalesMetrics,
      revenueByDay,
      topProducts,
      topCategories,
      salesByLocation,
      salesByPaymentMethod,
      customerMetrics,
      inventoryMetrics,
    ] = await Promise.all([
      this.getSalesMetrics(tenantId, dateRange),
      this.getSalesMetrics(tenantId, comparisonPeriod.previous),
      this.getRevenueByDay(tenantId, dateRange),
      this.getTopProducts(tenantId, dateRange, 10),
      this.getTopCategories(tenantId, dateRange),
      this.getSalesByLocation(tenantId, dateRange),
      this.getSalesByPaymentMethod(tenantId, dateRange),
      this.getCustomerMetrics(tenantId, dateRange),
      this.getInventoryMetrics(tenantId),
    ]);

    return {
      period: {
        current: {
          start: dayjs(dateRange.startDate).format('YYYY-MM-DD'),
          end: dayjs(dateRange.endDate).format('YYYY-MM-DD'),
        },
        previous: {
          start: dayjs(comparisonPeriod.previous.startDate).format('YYYY-MM-DD'),
          end: dayjs(comparisonPeriod.previous.endDate).format('YYYY-MM-DD'),
        },
      },
      sales: {
        current: salesMetrics,
        previous: previousSalesMetrics,
        growth: this.calculateGrowth(salesMetrics.totalRevenue, previousSalesMetrics.totalRevenue),
      },
      revenueByDay,
      topProducts,
      topCategories,
      salesByLocation,
      salesByPaymentMethod,
      customers: customerMetrics,
      inventory: inventoryMetrics,
      insights: await this.generateInsights(tenantId, {
        salesMetrics,
        previousSalesMetrics,
        topProducts,
        customerMetrics,
        inventoryMetrics,
      }),
    };
  }

  /**
   * Get sales metrics
   */
  private async getSalesMetrics(tenantId: string, dateRange: DateRange) {
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalCents, 0);
    const totalDiscount = sales.reduce((sum, sale) => sum + sale.discountCents, 0);
    const totalCost = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => {
        return itemSum + (item.product?.costCents || 0) * item.quantity;
      }, 0);
    }, 0);

    const totalProfit = totalRevenue - totalCost;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // Items sold
    const totalItemsSold = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);

    const averageItemsPerSale = totalSales > 0 ? totalItemsSold / totalSales : 0;

    return {
      totalSales,
      totalRevenue,
      totalDiscount,
      totalCost,
      totalProfit,
      profitMargin,
      averageTicket,
      totalItemsSold,
      averageItemsPerSale,
    };
  }

  /**
   * Get revenue by day
   */
  private async getRevenueByDay(tenantId: string, dateRange: DateRange) {
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      select: {
        createdAt: true,
        totalCents: true,
        discountCents: true,
        items: {
          select: {
            quantity: true,
            product: {
              select: {
                costCents: true,
              },
            },
          },
        },
      },
    });

    // Group by day
    const grouped: Record<string, { revenue: number; sales: number; profit: number }> = {};

    sales.forEach((sale) => {
      const date = dayjs(sale.createdAt).format('YYYY-MM-DD');

      if (!grouped[date]) {
        grouped[date] = { revenue: 0, sales: 0, profit: 0 };
      }

      const cost = sale.items.reduce((sum, item) => {
        return sum + (item.product?.costCents || 0) * item.quantity;
      }, 0);

      grouped[date].revenue += sale.totalCents;
      grouped[date].sales += 1;
      grouped[date].profit += sale.totalCents - cost;
    });

    // Fill missing days
    const result: Array<{ date: string; revenue: number; sales: number; profit: number }> = [];
    let currentDate = dayjs(dateRange.startDate);
    const endDate = dayjs(dateRange.endDate);

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      result.push({
        date: dateStr,
        revenue: grouped[dateStr]?.revenue || 0,
        sales: grouped[dateStr]?.sales || 0,
        profit: grouped[dateStr]?.profit || 0,
      });
      currentDate = currentDate.add(1, 'day');
    }

    return result;
  }

  /**
   * Get top products
   */
  private async getTopProducts(tenantId: string, dateRange: DateRange, limit: number = 10) {
    const items = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          tenantId,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    const grouped: Record<
      string,
      {
        productId: string;
        name: string;
        sku: string;
        category: string;
        quantity: number;
        revenue: number;
        cost: number;
        profit: number;
      }
    > = {};

    items.forEach((item) => {
      const productId = item.productId;

      if (!grouped[productId]) {
        grouped[productId] = {
          productId,
          name: item.product?.name || 'Desconocido',
          sku: item.product?.sku || '-',
          category: item.product?.category?.name || 'Sin categoría',
          quantity: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
        };
      }

      const itemCost = (item.product?.costCents || 0) * item.quantity;

      grouped[productId].quantity += item.quantity;
      grouped[productId].revenue += item.totalCents;
      grouped[productId].cost += itemCost;
      grouped[productId].profit += item.totalCents - itemCost;
    });

    return Object.values(grouped)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
        profitMargin: item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0,
      }));
  }

  /**
   * Get top categories
   */
  private async getTopCategories(tenantId: string, dateRange: DateRange) {
    const items = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          tenantId,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      },
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    const grouped: Record<
      string,
      {
        categoryId: string;
        categoryName: string;
        quantity: number;
        revenue: number;
        salesCount: number;
      }
    > = {};

    items.forEach((item) => {
      const categoryId = item.product?.categoryId || 'uncategorized';
      const categoryName = item.product?.category?.name || 'Sin categoría';

      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          categoryId,
          categoryName,
          quantity: 0,
          revenue: 0,
          salesCount: 0,
        };
      }

      grouped[categoryId].quantity += item.quantity;
      grouped[categoryId].revenue += item.totalCents;
      grouped[categoryId].salesCount += 1;
    });

    return Object.values(grouped)
      .sort((a, b) => b.revenue - a.revenue)
      .map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
  }

  /**
   * Get sales by location
   */
  private async getSalesByLocation(tenantId: string, dateRange: DateRange) {
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      include: {
        location: true,
      },
    });

    const grouped: Record<
      string,
      {
        locationId: string;
        locationName: string;
        salesCount: number;
        revenue: number;
      }
    > = {};

    sales.forEach((sale) => {
      const locationId = sale.locationId || 'no-location';
      const locationName = sale.location?.name || 'Sin ubicación';

      if (!grouped[locationId]) {
        grouped[locationId] = {
          locationId,
          locationName,
          salesCount: 0,
          revenue: 0,
        };
      }

      grouped[locationId].salesCount += 1;
      grouped[locationId].revenue += sale.totalCents;
    });

    return Object.values(grouped)
      .sort((a, b) => b.revenue - a.revenue)
      .map((item) => ({
        ...item,
        averageTicket: item.salesCount > 0 ? item.revenue / item.salesCount : 0,
      }));
  }

  /**
   * Get sales by payment method
   */
  private async getSalesByPaymentMethod(tenantId: string, dateRange: DateRange) {
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
      select: {
        paymentMethod: true,
        totalCents: true,
      },
    });

    const grouped: Record<string, { method: string; count: number; revenue: number }> = {};

    sales.forEach((sale) => {
      const method = sale.paymentMethod || 'No especificado';

      if (!grouped[method]) {
        grouped[method] = {
          method,
          count: 0,
          revenue: 0,
        };
      }

      grouped[method].count += 1;
      grouped[method].revenue += sale.totalCents;
    });

    const result = Object.values(grouped).sort((a, b) => b.revenue - a.revenue);
    const totalRevenue = result.reduce((sum, item) => sum + item.revenue, 0);

    return result.map((item) => ({
      ...item,
      percentage: totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0,
    }));
  }

  /**
   * Get customer metrics
   */
  private async getCustomerMetrics(tenantId: string, dateRange: DateRange) {
    const [totalCustomers, newCustomers, sales] = await Promise.all([
      this.prisma.customer.count({ where: { tenantId } }),
      this.prisma.customer.count({
        where: {
          tenantId,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      }),
      this.prisma.sale.findMany({
        where: {
          tenantId,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
        select: {
          customerId: true,
          totalCents: true,
        },
      }),
    ]);

    // Customers with purchases
    const customersWithPurchases = new Set(
      sales.filter((s) => s.customerId).map((s) => s.customerId)
    ).size;

    // Customer lifetime value
    const customerRevenue: Record<string, number> = {};
    sales.forEach((sale) => {
      if (sale.customerId) {
        customerRevenue[sale.customerId] =
          (customerRevenue[sale.customerId] || 0) + sale.totalCents;
      }
    });

    const revenueValues = Object.values(customerRevenue);
    const averageCustomerValue =
      revenueValues.length > 0
        ? revenueValues.reduce((sum, val) => sum + val, 0) / revenueValues.length
        : 0;

    // Repeat customers
    const customerPurchaseCount: Record<string, number> = {};
    sales.forEach((sale) => {
      if (sale.customerId) {
        customerPurchaseCount[sale.customerId] =
          (customerPurchaseCount[sale.customerId] || 0) + 1;
      }
    });

    const repeatCustomers = Object.values(customerPurchaseCount).filter((count) => count > 1)
      .length;

    const repeatRate =
      customersWithPurchases > 0 ? (repeatCustomers / customersWithPurchases) * 100 : 0;

    return {
      totalCustomers,
      newCustomers,
      customersWithPurchases,
      averageCustomerValue,
      repeatCustomers,
      repeatRate,
    };
  }

  /**
   * Get inventory metrics
   */
  private async getInventoryMetrics(tenantId: string) {
    const [stock, products] = await Promise.all([
      this.prisma.stock.findMany({
        where: { tenantId },
        include: {
          product: true,
        },
      }),
      this.prisma.product.count({ where: { tenantId } }),
    ]);

    const totalProducts = products;
    const totalStock = stock.reduce((sum, s) => sum + s.quantity, 0);
    const totalStockValue = stock.reduce((sum, s) => {
      return sum + s.quantity * (s.product?.costCents || 0);
    }, 0);

    const lowStockProducts = stock.filter((s) => {
      return s.quantity <= (s.minQuantity || 0);
    }).length;

    const outOfStockProducts = stock.filter((s) => s.quantity === 0).length;

    return {
      totalProducts,
      totalStock,
      totalStockValue,
      lowStockProducts,
      outOfStockProducts,
      averageStockValue: totalProducts > 0 ? totalStockValue / totalProducts : 0,
    };
  }

  /**
   * Generate insights
   */
  private async generateInsights(tenantId: string, data: any) {
    const insights: Array<{ type: string; title: string; description: string; metric: any; icon: string }> = [];

    // Sales growth
    const salesGrowth = this.calculateGrowth(
      data.salesMetrics.totalRevenue,
      data.previousSalesMetrics.totalRevenue
    );

    if (salesGrowth > 20) {
      insights.push({
        type: 'success',
        title: 'Crecimiento excepcional en ventas',
        description: `Las ventas aumentaron ${salesGrowth.toFixed(1)}% respecto al período anterior. ¡Excelente trabajo!`,
        metric: salesGrowth,
        icon: 'trending-up',
      });
    } else if (salesGrowth < -10) {
      insights.push({
        type: 'warning',
        title: 'Caída en ventas',
        description: `Las ventas disminuyeron ${Math.abs(salesGrowth).toFixed(1)}% respecto al período anterior. Considera revisar estrategias de marketing.`,
        metric: salesGrowth,
        icon: 'trending-down',
      });
    }

    // Profit margin
    if (data.salesMetrics.profitMargin < 20) {
      insights.push({
        type: 'warning',
        title: 'Margen de ganancia bajo',
        description: `Tu margen de ganancia es del ${data.salesMetrics.profitMargin.toFixed(1)}%. Considera revisar precios o costos de productos.`,
        metric: data.salesMetrics.profitMargin,
        icon: 'alert-triangle',
      });
    } else if (data.salesMetrics.profitMargin > 40) {
      insights.push({
        type: 'success',
        title: 'Excelente margen de ganancia',
        description: `Tu margen de ganancia es del ${data.salesMetrics.profitMargin.toFixed(1)}%. Estás optimizando bien tus costos.`,
        metric: data.salesMetrics.profitMargin,
        icon: 'dollar-sign',
      });
    }

    // Top product performance
    if (data.topProducts.length > 0) {
      const topProduct = data.topProducts[0];
      insights.push({
        type: 'info',
        title: 'Producto más vendido',
        description: `"${topProduct.name}" generó ${topProduct.revenue.toFixed(2)} en ventas con ${topProduct.quantity} unidades vendidas.`,
        metric: topProduct.revenue,
        icon: 'star',
      });
    }

    // Customer retention
    if (data.customerMetrics.repeatRate < 30) {
      insights.push({
        type: 'warning',
        title: 'Baja tasa de retención',
        description: `Solo el ${data.customerMetrics.repeatRate.toFixed(1)}% de tus clientes repiten compra. Implementa programas de fidelización.`,
        metric: data.customerMetrics.repeatRate,
        icon: 'users',
      });
    } else if (data.customerMetrics.repeatRate > 60) {
      insights.push({
        type: 'success',
        title: 'Alta tasa de retención',
        description: `El ${data.customerMetrics.repeatRate.toFixed(1)}% de tus clientes repiten compra. ¡Excelente fidelización!`,
        metric: data.customerMetrics.repeatRate,
        icon: 'heart',
      });
    }

    // Inventory alerts
    if (data.inventoryMetrics.lowStockProducts > 0) {
      insights.push({
        type: 'warning',
        title: 'Productos con stock bajo',
        description: `Tienes ${data.inventoryMetrics.lowStockProducts} productos con stock bajo. Revisa tu inventario para evitar pérdida de ventas.`,
        metric: data.inventoryMetrics.lowStockProducts,
        icon: 'package',
      });
    }

    if (data.inventoryMetrics.outOfStockProducts > 5) {
      insights.push({
        type: 'error',
        title: 'Múltiples productos sin stock',
        description: `Tienes ${data.inventoryMetrics.outOfStockProducts} productos sin stock. Esto puede estar afectando tus ventas.`,
        metric: data.inventoryMetrics.outOfStockProducts,
        icon: 'alert-circle',
      });
    }

    return insights;
  }

  /**
   * Parse period string to date range
   */
  private parsePeriod(period: string): DateRange {
    const now = dayjs();
    let startDate: dayjs.Dayjs;
    let endDate = now;

    if (period === 'today') {
      startDate = now.startOf('day');
    } else if (period === 'yesterday') {
      startDate = now.subtract(1, 'day').startOf('day');
      endDate = now.subtract(1, 'day').endOf('day');
    } else if (period === 'week') {
      startDate = now.startOf('isoWeek');
    } else if (period === 'month') {
      startDate = now.startOf('month');
    } else if (period === 'year') {
      startDate = now.startOf('year');
    } else if (period.endsWith('d')) {
      const days = parseInt(period.replace('d', ''));
      startDate = now.subtract(days, 'days').startOf('day');
    } else if (period.endsWith('m')) {
      const months = parseInt(period.replace('m', ''));
      startDate = now.subtract(months, 'months').startOf('day');
    } else {
      // Default to last 30 days
      startDate = now.subtract(30, 'days').startOf('day');
    }

    return {
      startDate: startDate.toDate(),
      endDate: endDate.toDate(),
    };
  }

  /**
   * Get comparison period (previous period of same length)
   */
  private getComparisonPeriod(currentPeriod: DateRange): ComparisonPeriod {
    const start = dayjs(currentPeriod.startDate);
    const end = dayjs(currentPeriod.endDate);
    const duration = end.diff(start, 'days');

    return {
      current: currentPeriod,
      previous: {
        startDate: start.subtract(duration + 1, 'days').toDate(),
        endDate: start.subtract(1, 'day').toDate(),
      },
    };
  }

  /**
   * Calculate growth percentage
   */
  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}
