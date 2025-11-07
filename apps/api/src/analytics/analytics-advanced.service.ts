import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import * as dayjs from 'dayjs';

@Injectable()
export class AnalyticsAdvancedService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get sales trends (weekly/monthly comparison)
   */
  async getSalesTrends(tenantId: string, period: 'week' | 'month' | 'year' = 'month') {
    const now = dayjs();
    let periods: { start: Date; end: Date; label: string }[] = [];

    if (period === 'week') {
      // Last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const weekStart = now.subtract(i, 'weeks').startOf('isoWeek');
        const weekEnd = weekStart.endOf('isoWeek');
        periods.push({
          start: weekStart.toDate(),
          end: weekEnd.toDate(),
          label: weekStart.format('WW/YYYY'),
        });
      }
    } else if (period === 'month') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthStart = now.subtract(i, 'months').startOf('month');
        const monthEnd = monthStart.endOf('month');
        periods.push({
          start: monthStart.toDate(),
          end: monthEnd.toDate(),
          label: monthStart.format('MMM YYYY'),
        });
      }
    } else if (period === 'year') {
      // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const yearStart = now.subtract(i, 'years').startOf('year');
        const yearEnd = yearStart.endOf('year');
        periods.push({
          start: yearStart.toDate(),
          end: yearEnd.toDate(),
          label: yearStart.format('YYYY'),
        });
      }
    }

    const trends = await Promise.all(
      periods.map(async (p) => {
        const sales = await this.prisma.sale.findMany({
          where: {
            tenantId,
            createdAt: {
              gte: p.start,
              lte: p.end,
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

        const revenue = sales.reduce((sum, s) => sum + s.totalCents, 0);
        const cost = sales.reduce((sum, sale) => {
          return (
            sum +
            sale.items.reduce((itemSum, item) => {
              return itemSum + (item.product?.costCents || 0) * item.quantity;
            }, 0)
          );
        }, 0);

        return {
          period: p.label,
          salesCount: sales.length,
          revenue,
          cost,
          profit: revenue - cost,
          averageTicket: sales.length > 0 ? revenue / sales.length : 0,
        };
      })
    );

    return trends;
  }

  /**
   * Get customer segmentation (RFM Analysis)
   */
  async getCustomerSegmentation(tenantId: string) {
    const now = new Date();
    const sixMonthsAgo = dayjs(now).subtract(6, 'months').toDate();

    const customers = await this.prisma.customer.findMany({
      where: { tenantId },
      include: {
        sales: {
          where: {
            createdAt: { gte: sixMonthsAgo },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const segments = {
      champions: [] as any[],
      loyal: [] as any[],
      potentialLoyalist: [] as any[],
      atRisk: [] as any[],
      cantLose: [] as any[],
      hibernating: [] as any[],
      newCustomers: [] as any[],
    };

    customers.forEach((customer) => {
      if (customer.sales.length === 0) return;

      // Recency (days since last purchase)
      const lastPurchase = customer.sales[0].createdAt;
      const recency = dayjs(now).diff(dayjs(lastPurchase), 'days');

      // Frequency (number of purchases)
      const frequency = customer.sales.length;

      // Monetary (total spent)
      const monetary = customer.sales.reduce((sum, sale) => sum + sale.totalCents, 0);

      const customerData = {
        id: customer.id,
        name: customer.name,
        recency,
        frequency,
        monetary,
        lastPurchase: dayjs(lastPurchase).format('YYYY-MM-DD'),
      };

      // Segmentation logic
      if (recency <= 30 && frequency >= 5 && monetary >= 10000) {
        segments.champions.push(customerData);
      } else if (recency <= 60 && frequency >= 3 && monetary >= 5000) {
        segments.loyal.push(customerData);
      } else if (recency <= 30 && frequency <= 2) {
        segments.newCustomers.push(customerData);
      } else if (recency <= 90 && frequency >= 2 && monetary >= 3000) {
        segments.potentialLoyalist.push(customerData);
      } else if (recency > 90 && recency <= 180 && monetary >= 5000) {
        segments.atRisk.push(customerData);
      } else if (recency > 180 && monetary >= 10000) {
        segments.cantLose.push(customerData);
      } else if (recency > 180) {
        segments.hibernating.push(customerData);
      }
    });

    return {
      segments: {
        champions: {
          count: segments.champions.length,
          customers: segments.champions.slice(0, 10),
          description: 'Compran frecuentemente, gastaron mucho y recientemente',
        },
        loyal: {
          count: segments.loyal.length,
          customers: segments.loyal.slice(0, 10),
          description: 'Clientes fieles con compras regulares',
        },
        potentialLoyalist: {
          count: segments.potentialLoyalist.length,
          customers: segments.potentialLoyalist.slice(0, 10),
          description: 'Clientes recientes con potencial de fidelización',
        },
        newCustomers: {
          count: segments.newCustomers.length,
          customers: segments.newCustomers.slice(0, 10),
          description: 'Clientes nuevos que compraron recientemente',
        },
        atRisk: {
          count: segments.atRisk.length,
          customers: segments.atRisk.slice(0, 10),
          description: 'Buenos clientes que no compran hace tiempo',
        },
        cantLose: {
          count: segments.cantLose.length,
          customers: segments.cantLose.slice(0, 10),
          description: 'Mejores clientes que están inactivos',
        },
        hibernating: {
          count: segments.hibernating.length,
          customers: segments.hibernating.slice(0, 10),
          description: 'Clientes inactivos hace mucho tiempo',
        },
      },
      summary: {
        totalCustomers: customers.length,
        activeCustomers:
          segments.champions.length +
          segments.loyal.length +
          segments.potentialLoyalist.length +
          segments.newCustomers.length,
        atRiskCustomers: segments.atRisk.length + segments.cantLose.length,
        inactiveCustomers: segments.hibernating.length,
      },
    };
  }

  /**
   * Get product performance analysis
   */
  async getProductPerformance(tenantId: string, period: string = '90d') {
    const startDate = dayjs().subtract(parseInt(period.replace('d', '')), 'days').toDate();
    const endDate = new Date();

    const items = await this.prisma.saleItem.findMany({
      where: {
        sale: {
          tenantId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
      include: {
        product: {
          include: {
            stock: true,
            category: true,
          },
        },
      },
    });

    const productMetrics: Record<string, any> = {};

    items.forEach((item) => {
      const productId = item.productId;

      if (!productMetrics[productId]) {
        const currentStock = item.product?.stock.reduce((sum, s) => sum + s.quantity, 0) || 0;

        productMetrics[productId] = {
          id: productId,
          name: item.product?.name || 'Desconocido',
          sku: item.product?.sku || '-',
          category: item.product?.category?.name || 'Sin categoría',
          quantitySold: 0,
          revenue: 0,
          cost: 0,
          currentStock,
          price: item.product?.priceCents || 0,
          productCost: item.product?.costCents || 0,
        };
      }

      productMetrics[productId].quantitySold += item.quantity;
      productMetrics[productId].revenue += item.totalCents;
      productMetrics[productId].cost += (item.product?.costCents || 0) * item.quantity;
    });

    const products = Object.values(productMetrics).map((p: any) => ({
      ...p,
      profit: p.revenue - p.cost,
      profitMargin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
      turnoverRate:
        p.currentStock > 0 ? p.quantitySold / (p.currentStock + p.quantitySold) : 0,
      daysOfStock:
        p.quantitySold > 0
          ? (p.currentStock / (p.quantitySold / parseInt(period.replace('d', '')))) *
            parseInt(period.replace('d', ''))
          : 999,
    }));

    return {
      products: products.sort((a, b) => b.revenue - a.revenue),
      summary: {
        totalProducts: products.length,
        totalRevenue: products.reduce((sum, p) => sum + p.revenue, 0),
        totalProfit: products.reduce((sum, p) => sum + p.profit, 0),
        averageMargin:
          products.length > 0
            ? products.reduce((sum, p) => sum + p.profitMargin, 0) / products.length
            : 0,
      },
    };
  }

  /**
   * Get hourly sales pattern
   */
  async getHourlySalesPattern(tenantId: string, days: number = 30) {
    const startDate = dayjs().subtract(days, 'days').toDate();

    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        totalCents: true,
      },
    });

    const hourlyData: Record<number, { count: number; revenue: number }> = {};

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { count: 0, revenue: 0 };
    }

    sales.forEach((sale) => {
      const hour = dayjs(sale.createdAt).hour();
      hourlyData[hour].count += 1;
      hourlyData[hour].revenue += sale.totalCents;
    });

    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour: parseInt(hour),
      hourLabel: `${hour.padStart(2, '0')}:00`,
      salesCount: data.count,
      revenue: data.revenue,
      averageTicket: data.count > 0 ? data.revenue / data.count : 0,
    }));
  }
}
