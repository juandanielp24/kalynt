import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import * as dayjs from 'dayjs';

@Injectable()
export class SalesReportsDataService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get sales summary data
   */
  async getSalesSummaryData(tenantId: string, filters: any) {
    const startDate = filters?.startDate
      ? new Date(filters.startDate)
      : dayjs().subtract(30, 'days').toDate();
    const endDate = filters?.endDate ? new Date(filters.endDate) : new Date();

    // Get sales by date
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(filters?.locationId && { locationId: filters.locationId }),
        ...(filters?.userId && { userId: filters.userId }),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        location: true,
        user: true,
      },
    });

    // Calculate totals (convert cents to currency)
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalCents / 100, 0);
    const totalCost = sales.reduce((sum, sale) => {
      return (
        sum +
        sale.items.reduce((itemSum, item) => {
          return itemSum + (item.product?.costCents || 0) * item.quantity / 100;
        }, 0)
      );
    }, 0);
    const totalProfit = totalRevenue - totalCost;
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Sales by date
    const salesByDate = this.groupSalesByDate(sales);

    // Sales by payment method
    const salesByPaymentMethod = this.groupSalesByPaymentMethod(sales);

    // Sales by location
    const salesByLocation = this.groupSalesByLocation(sales);

    // Sales by user
    const salesByUser = this.groupSalesByUser(sales);

    // Top products
    const topProducts = await this.getTopProducts(tenantId, startDate, endDate, 10);

    return {
      period: {
        startDate: dayjs(startDate).format('DD/MM/YYYY'),
        endDate: dayjs(endDate).format('DD/MM/YYYY'),
      },
      summary: {
        totalSales,
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        averageTicket,
      },
      salesByDate,
      salesByPaymentMethod,
      salesByLocation,
      salesByUser,
      topProducts,
    };
  }

  /**
   * Get sales detail data
   */
  async getSalesDetailData(tenantId: string, filters: any) {
    const startDate = filters?.startDate
      ? new Date(filters.startDate)
      : dayjs().subtract(30, 'days').toDate();
    const endDate = filters?.endDate ? new Date(filters.endDate) : new Date();

    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        ...(filters?.locationId && { locationId: filters.locationId }),
        ...(filters?.userId && { userId: filters.userId }),
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        location: true,
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert cents to currency
    const salesWithCurrency = sales.map((sale) => ({
      ...sale,
      subtotal: sale.subtotalCents / 100,
      discount: sale.discountCents / 100,
      totalAmount: sale.totalCents / 100,
      items: sale.items.map((item) => ({
        ...item,
        unitPrice: item.unitPriceCents / 100,
        subtotal: item.subtotalCents / 100,
        total: item.totalCents / 100,
      })),
    }));

    return {
      period: {
        startDate: dayjs(startDate).format('DD/MM/YYYY'),
        endDate: dayjs(endDate).format('DD/MM/YYYY'),
      },
      sales: salesWithCurrency,
    };
  }

  /**
   * Group sales by date
   */
  private groupSalesByDate(sales: any[]) {
    const grouped: Record<string, { count: number; revenue: number; profit: number }> = {};

    sales.forEach((sale) => {
      const date = dayjs(sale.createdAt).format('YYYY-MM-DD');
      if (!grouped[date]) {
        grouped[date] = { count: 0, revenue: 0, profit: 0 };
      }

      const cost = sale.items.reduce((sum: number, item: any) => {
        return sum + ((item.product?.costCents || 0) * item.quantity) / 100;
      }, 0);

      const revenue = sale.totalCents / 100;

      grouped[date].count += 1;
      grouped[date].revenue += revenue;
      grouped[date].profit += revenue - cost;
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date: dayjs(date).format('DD/MM/YYYY'),
        ...data,
      }))
      .sort((a, b) => dayjs(a.date, 'DD/MM/YYYY').diff(dayjs(b.date, 'DD/MM/YYYY')));
  }

  /**
   * Group sales by payment method
   */
  private groupSalesByPaymentMethod(sales: any[]) {
    const grouped: Record<string, { count: number; revenue: number }> = {};

    sales.forEach((sale) => {
      const method = sale.paymentMethod || 'Sin especificar';
      if (!grouped[method]) {
        grouped[method] = { count: 0, revenue: 0 };
      }

      grouped[method].count += 1;
      grouped[method].revenue += sale.totalCents / 100;
    });

    return Object.entries(grouped)
      .map(([method, data]) => ({
        method,
        ...data,
        percentage: 0, // Will be calculated later
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Group sales by location
   */
  private groupSalesByLocation(sales: any[]) {
    const grouped: Record<string, { count: number; revenue: number; locationName: string }> = {};

    sales.forEach((sale) => {
      const locationId = sale.locationId || 'no-location';
      if (!grouped[locationId]) {
        grouped[locationId] = {
          count: 0,
          revenue: 0,
          locationName: sale.location?.name || 'Sin ubicación',
        };
      }

      grouped[locationId].count += 1;
      grouped[locationId].revenue += sale.totalCents / 100;
    });

    return Object.entries(grouped)
      .map(([locationId, data]) => ({
        locationId,
        ...data,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Group sales by user
   */
  private groupSalesByUser(sales: any[]) {
    const grouped: Record<string, { count: number; revenue: number; userName: string }> = {};

    sales.forEach((sale) => {
      const userId = sale.userId;
      if (!grouped[userId]) {
        grouped[userId] = {
          count: 0,
          revenue: 0,
          userName: sale.user?.name || 'Usuario desconocido',
        };
      }

      grouped[userId].count += 1;
      grouped[userId].revenue += sale.totalCents / 100;
    });

    return Object.entries(grouped)
      .map(([userId, data]) => ({
        userId,
        ...data,
        averageTicket: data.count > 0 ? data.revenue / data.count : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  /**
   * Get top products
   */
  private async getTopProducts(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ) {
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
        product: true,
      },
    });

    const grouped: Record<
      string,
      {
        productId: string;
        productName: string;
        productSku: string;
        quantity: number;
        revenue: number;
      }
    > = {};

    items.forEach((item) => {
      const productId = item.productId;
      if (!grouped[productId]) {
        grouped[productId] = {
          productId,
          productName: item.product?.name || 'Producto desconocido',
          productSku: item.product?.sku || '-',
          quantity: 0,
          revenue: 0,
        };
      }

      grouped[productId].quantity += item.quantity;
      grouped[productId].revenue += item.totalCents / 100;
    });

    return Object.values(grouped)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  }
}
