import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';

@Injectable()
export class LocationAnalyticsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get sales comparison across locations
   */
  async getSalesComparison(tenantId: string, options: {
    startDate: Date;
    endDate: Date;
  }) {
    const { startDate, endDate } = options;

    const salesByLocation = await this.prisma.sale.groupBy({
      by: ['locationId'],
      where: {
        tenantId,
        status: { not: 'VOIDED' },
        createdAt: {
          gte: startOfDay(startDate),
          lte: endOfDay(endDate),
        },
      },
      _sum: {
        totalCents: true,
      },
      _count: true,
    });

    // Get location details
    const locationIds = salesByLocation.map((s) => s.locationId);
    const locations = await this.prisma.location.findMany({
      where: { id: { in: locationIds } },
      select: { id: true, name: true, code: true },
    });

    const result = salesByLocation.map((sale) => {
      const location = locations.find((l) => l.id === sale.locationId);
      return {
        location,
        totalSales: sale._sum.totalCents || 0,
        salesCount: sale._count,
        averageSale: sale._count > 0 ? (sale._sum.totalCents || 0) / sale._count : 0,
      };
    });

    return result.sort((a, b) => b.totalSales - a.totalSales);
  }

  /**
   * Get stock distribution across locations
   */
  async getStockDistribution(tenantId: string, productId?: string) {
    const where: any = { tenantId };
    if (productId) {
      where.productId = productId;
    }

    const stockByLocation = await this.prisma.stock.groupBy({
      by: ['locationId'],
      where,
      _sum: {
        quantity: true,
      },
      _count: true,
    });

    // Get location details
    const locationIds = stockByLocation.map((s) => s.locationId);
    const locations = await this.prisma.location.findMany({
      where: { id: { in: locationIds } },
      select: { id: true, name: true, code: true, type: true },
    });

    const totalStock = stockByLocation.reduce((sum, s) => sum + (s._sum.quantity || 0), 0);

    const result = stockByLocation.map((stock) => {
      const location = locations.find((l) => l.id === stock.locationId);
      const quantity = stock._sum.quantity || 0;
      return {
        location,
        quantity,
        productsCount: stock._count,
        percentage: totalStock > 0 ? (quantity / totalStock) * 100 : 0,
      };
    });

    return result.sort((a, b) => b.quantity - a.quantity);
  }

  /**
   * Get performance metrics by location
   */
  async getLocationPerformance(locationId: string, tenantId: string, days: number = 30) {
    const startDate = subDays(new Date(), days);

    // Sales metrics
    const [salesData, previousSalesData] = await Promise.all([
      this.prisma.sale.aggregate({
        where: {
          locationId,
          tenantId,
          status: { not: 'VOIDED' },
          createdAt: { gte: startDate },
        },
        _sum: { totalCents: true },
        _count: true,
      }),
      this.prisma.sale.aggregate({
        where: {
          locationId,
          tenantId,
          status: { not: 'VOIDED' },
          createdAt: {
            gte: subDays(startDate, days),
            lt: startDate,
          },
        },
        _sum: { totalCents: true },
        _count: true,
      }),
    ]);

    const totalSales = salesData._sum.totalCents || 0;
    const salesCount = salesData._count;
    const previousTotalSales = previousSalesData._sum.totalCents || 0;
    const previousSalesCount = previousSalesData._count;

    // Stock metrics
    const [stockData, lowStockCount, outOfStockCount] = await Promise.all([
      this.prisma.stock.aggregate({
        where: { locationId, tenantId },
        _sum: { quantity: true },
        _count: true,
      }),
      this.prisma.stock.count({
        where: {
          locationId,
          tenantId,
          quantity: {
            gt: 0,
          },
        },
      }),
      this.prisma.stock.count({
        where: {
          locationId,
          tenantId,
          quantity: 0,
        },
      }),
    ]);

    // Transfer metrics
    const [incomingTransfers, outgoingTransfers] = await Promise.all([
      this.prisma.stockTransfer.count({
        where: {
          toLocationId: locationId,
          tenantId,
          createdAt: { gte: startDate },
        },
      }),
      this.prisma.stockTransfer.count({
        where: {
          fromLocationId: locationId,
          tenantId,
          createdAt: { gte: startDate },
        },
      }),
    ]);

    return {
      sales: {
        total: totalSales,
        count: salesCount,
        average: salesCount > 0 ? totalSales / salesCount : 0,
        growth:
          previousTotalSales > 0
            ? ((totalSales - previousTotalSales) / previousTotalSales) * 100
            : 0,
        countGrowth:
          previousSalesCount > 0
            ? ((salesCount - previousSalesCount) / previousSalesCount) * 100
            : 0,
      },
      stock: {
        totalProducts: stockData._count,
        totalUnits: stockData._sum.quantity || 0,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      },
      transfers: {
        incoming: incomingTransfers,
        outgoing: outgoingTransfers,
        total: incomingTransfers + outgoingTransfers,
      },
    };
  }

  /**
   * Get daily sales trend by location
   */
  async getDailySalesTrend(locationId: string, tenantId: string, days: number = 30) {
    const startDate = subDays(new Date(), days);

    const sales = await this.prisma.sale.findMany({
      where: {
        locationId,
        tenantId,
        status: { not: 'VOIDED' },
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        totalCents: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const salesByDate = new Map<string, { total: number; count: number }>();

    sales.forEach((sale) => {
      const date = format(sale.createdAt, 'yyyy-MM-dd');
      const current = salesByDate.get(date) || { total: 0, count: 0 };
      salesByDate.set(date, {
        total: current.total + sale.totalCents,
        count: current.count + 1,
      });
    });

    // Fill missing dates with zero
    const result: Array<{
      date: string;
      total: number;
      count: number;
      average: number;
    }> = [];
    for (let i = 0; i < days; i++) {
      const date = format(subDays(new Date(), days - i - 1), 'yyyy-MM-dd');
      const data = salesByDate.get(date) || { total: 0, count: 0 };
      result.push({
        date,
        total: data.total,
        count: data.count,
        average: data.count > 0 ? data.total / data.count : 0,
      });
    }

    return result;
  }

  /**
   * Get top selling products by location
   */
  async getTopProducts(locationId: string, tenantId: string, limit: number = 10) {
    const thirtyDaysAgo = subDays(new Date(), 30);

    const topProducts = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          locationId,
          tenantId,
          status: { not: 'VOIDED' },
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      _sum: {
        quantity: true,
        subtotalCents: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          subtotalCents: 'desc',
        },
      },
      take: limit,
    });

    // Get product details
    const productIds = topProducts.map((p) => p.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        sku: true,
        imageUrl: true,
      },
    });

    return topProducts.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      return {
        product,
        quantitySold: item._sum.quantity || 0,
        revenue: item._sum.subtotalCents || 0,
        salesCount: item._count,
      };
    });
  }
}
