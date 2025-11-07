import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import * as dayjs from 'dayjs';

@Injectable()
export class InventoryReportsDataService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  /**
   * Get inventory stock data
   */
  async getInventoryStockData(tenantId: string, filters: any) {
    const whereClause: any = { tenantId };

    if (filters?.locationId) {
      whereClause.locationId = filters.locationId;
    }

    if (filters?.categoryId) {
      whereClause.product = {
        categoryId: filters.categoryId,
      };
    }

    // Get all stock with product details
    const stockItems = await this.prisma.stock.findMany({
      where: whereClause,
      include: {
        product: {
          include: {
            category: true,
          },
        },
        location: true,
      },
    });

    // Calculate totals
    const totalProducts = new Set(stockItems.map(item => item.productId)).size;
    const totalStock = stockItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = stockItems.reduce((sum, item) => {
      const costCents = item.product?.costCents || 0;
      return sum + (costCents * item.quantity) / 100;
    }, 0);

    // Low stock items (quantity <= minQuantity)
    const lowStockItems = stockItems.filter(item => {
      return item.quantity <= item.minQuantity;
    });

    // Out of stock items
    const outOfStockItems = stockItems.filter(item => item.quantity === 0);

    // Group by category
    const stockByCategory = this.groupStockByCategory(stockItems);

    // Group by location
    const stockByLocation = this.groupStockByLocation(stockItems);

    // Stock status distribution
    const stockStatus = {
      normal: stockItems.filter(item => {
        return item.quantity > item.minQuantity;
      }).length,
      low: lowStockItems.length,
      out: outOfStockItems.length,
    };

    return {
      summary: {
        totalProducts,
        totalStock,
        totalValue,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
      },
      stockByCategory,
      stockByLocation,
      stockStatus,
      lowStockItems: lowStockItems.map(item => ({
        productId: item.productId,
        productName: item.product?.name || 'Desconocido',
        productSku: item.product?.sku || '-',
        locationName: item.location?.name || 'Sin ubicación',
        currentStock: item.quantity,
        minStock: item.minQuantity,
        difference: item.quantity - item.minQuantity,
      })),
      outOfStockItems: outOfStockItems.map(item => ({
        productId: item.productId,
        productName: item.product?.name || 'Desconocido',
        productSku: item.product?.sku || '-',
        locationName: item.location?.name || 'Sin ubicación',
      })),
    };
  }

  /**
   * Get inventory movements data
   */
  async getInventoryMovementsData(tenantId: string, filters: any) {
    const startDate = filters?.startDate
      ? new Date(filters.startDate)
      : dayjs().subtract(30, 'days').toDate();
    const endDate = filters?.endDate ? new Date(filters.endDate) : new Date();

    const whereClause: any = {
      tenantId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (filters?.locationId) {
      whereClause.OR = [
        { fromLocationId: filters.locationId },
        { toLocationId: filters.locationId },
      ];
    }

    if (filters?.productId) {
      whereClause.items = {
        some: {
          productId: filters.productId,
        },
      };
    }

    // Get transfers (inventory movements)
    const transfers = await this.prisma.stockTransfer.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        fromLocation: true,
        toLocation: true,
        requestedBy: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate summary
    const totalMovements = transfers.length;
    const totalItemsMoved = transfers.reduce((sum, transfer) => {
      return sum + transfer.items.reduce((itemSum, item) => itemSum + (item.quantitySent ?? item.quantityRequested), 0);
    }, 0);

    // Group by status
    const movementsByStatus = this.groupTransfersByStatus(transfers);

    // Group by date
    const movementsByDate = this.groupTransfersByDate(transfers);

    // Group by product
    const movementsByProduct = this.groupTransfersByProduct(transfers);

    // Recent movements
    const recentMovements = transfers.slice(0, 50).map(transfer => ({
      id: transfer.id,
      transferNumber: transfer.transferNumber,
      sourceLocation: transfer.fromLocation?.name || '-',
      destinationLocation: transfer.toLocation?.name || '-',
      status: transfer.status,
      itemCount: transfer.items.length,
      totalQuantity: transfer.items.reduce((sum, item) => sum + (item.quantitySent ?? item.quantityRequested), 0),
      createdAt: transfer.createdAt,
      createdBy: transfer.requestedBy?.name || 'Desconocido',
    }));

    return {
      period: {
        startDate: dayjs(startDate).format('DD/MM/YYYY'),
        endDate: dayjs(endDate).format('DD/MM/YYYY'),
      },
      summary: {
        totalMovements,
        totalItemsMoved,
      },
      movementsByStatus,
      movementsByDate,
      movementsByProduct,
      recentMovements,
    };
  }

  /**
   * Get products performance data
   */
  async getProductsPerformanceData(tenantId: string, filters: any) {
    const startDate = filters?.startDate
      ? new Date(filters.startDate)
      : dayjs().subtract(30, 'days').toDate();
    const endDate = filters?.endDate ? new Date(filters.endDate) : new Date();

    // Get sales items for the period
    const saleItems = await this.prisma.saleItem.findMany({
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
            category: true,
          },
        },
        sale: true,
      },
    });

    // Group by product
    const productPerformance: Record<
      string,
      {
        productId: string;
        productName: string;
        productSku: string;
        categoryName: string;
        quantitySold: number;
        revenue: number;
        cost: number;
        profit: number;
        salesCount: number;
      }
    > = {};

    saleItems.forEach(item => {
      const productId = item.productId;
      if (!productPerformance[productId]) {
        productPerformance[productId] = {
          productId,
          productName: item.product?.name || 'Desconocido',
          productSku: item.product?.sku || '-',
          categoryName: item.product?.category?.name || 'Sin categoría',
          quantitySold: 0,
          revenue: 0,
          cost: 0,
          profit: 0,
          salesCount: 0,
        };
      }

      const revenue = item.totalCents / 100;
      const cost = ((item.product?.costCents || 0) * item.quantity) / 100;

      productPerformance[productId].quantitySold += item.quantity;
      productPerformance[productId].revenue += revenue;
      productPerformance[productId].cost += cost;
      productPerformance[productId].profit += revenue - cost;
      productPerformance[productId].salesCount += 1;
    });

    const performanceArray = Object.values(productPerformance);

    // Calculate totals
    const totalRevenue = performanceArray.reduce((sum, p) => sum + p.revenue, 0);
    const totalProfit = performanceArray.reduce((sum, p) => sum + p.profit, 0);

    // Top performers (by revenue)
    const topPerformers = [...performanceArray]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((p, index) => ({
        rank: index + 1,
        ...p,
        profitMargin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
      }));

    // Worst performers (by revenue, excluding zero sales)
    const worstPerformers = [...performanceArray]
      .filter(p => p.revenue > 0)
      .sort((a, b) => a.revenue - b.revenue)
      .slice(0, 10)
      .map((p, index) => ({
        rank: index + 1,
        ...p,
        profitMargin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
      }));

    // Most profitable (by profit margin)
    const mostProfitable = [...performanceArray]
      .filter(p => p.revenue > 0)
      .map(p => ({
        ...p,
        profitMargin: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.profitMargin - a.profitMargin)
      .slice(0, 10);

    // Performance by category
    const performanceByCategory = this.groupPerformanceByCategory(performanceArray);

    return {
      period: {
        startDate: dayjs(startDate).format('DD/MM/YYYY'),
        endDate: dayjs(endDate).format('DD/MM/YYYY'),
      },
      summary: {
        totalProducts: performanceArray.length,
        totalRevenue,
        totalProfit,
        averageProfitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      },
      topPerformers,
      worstPerformers,
      mostProfitable,
      performanceByCategory,
    };
  }

  /**
   * Group stock by category
   */
  private groupStockByCategory(stockItems: any[]) {
    const grouped: Record<
      string,
      {
        categoryName: string;
        productCount: number;
        totalStock: number;
        totalValue: number;
      }
    > = {};

    stockItems.forEach(item => {
      const categoryId = item.product?.categoryId || 'no-category';
      const categoryName = item.product?.category?.name || 'Sin categoría';

      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          categoryName,
          productCount: 0,
          totalStock: 0,
          totalValue: 0,
        };
      }

      grouped[categoryId].productCount += 1;
      grouped[categoryId].totalStock += item.quantity;
      grouped[categoryId].totalValue += ((item.product?.costCents || 0) * item.quantity) / 100;
    });

    return Object.values(grouped).sort((a, b) => b.totalValue - a.totalValue);
  }

  /**
   * Group stock by location
   */
  private groupStockByLocation(stockItems: any[]) {
    const grouped: Record<
      string,
      {
        locationName: string;
        productCount: number;
        totalStock: number;
        totalValue: number;
      }
    > = {};

    stockItems.forEach(item => {
      const locationId = item.locationId || 'no-location';
      const locationName = item.location?.name || 'Sin ubicación';

      if (!grouped[locationId]) {
        grouped[locationId] = {
          locationName,
          productCount: 0,
          totalStock: 0,
          totalValue: 0,
        };
      }

      grouped[locationId].productCount += 1;
      grouped[locationId].totalStock += item.quantity;
      grouped[locationId].totalValue += ((item.product?.costCents || 0) * item.quantity) / 100;
    });

    return Object.values(grouped).sort((a, b) => b.totalValue - a.totalValue);
  }

  /**
   * Group transfers by status
   */
  private groupTransfersByStatus(transfers: any[]) {
    const grouped: Record<string, { count: number; itemsCount: number }> = {};

    transfers.forEach(transfer => {
      const status = transfer.status;
      if (!grouped[status]) {
        grouped[status] = { count: 0, itemsCount: 0 };
      }

      grouped[status].count += 1;
      grouped[status].itemsCount += transfer.items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      );
    });

    return Object.entries(grouped).map(([status, data]) => ({
      status,
      ...data,
    }));
  }

  /**
   * Group transfers by date
   */
  private groupTransfersByDate(transfers: any[]) {
    const grouped: Record<string, { count: number; itemsCount: number }> = {};

    transfers.forEach(transfer => {
      const date = dayjs(transfer.createdAt).format('YYYY-MM-DD');
      if (!grouped[date]) {
        grouped[date] = { count: 0, itemsCount: 0 };
      }

      grouped[date].count += 1;
      grouped[date].itemsCount += transfer.items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      );
    });

    return Object.entries(grouped)
      .map(([date, data]) => ({
        date: dayjs(date).format('DD/MM/YYYY'),
        ...data,
      }))
      .sort((a, b) => dayjs(a.date, 'DD/MM/YYYY').diff(dayjs(b.date, 'DD/MM/YYYY')));
  }

  /**
   * Group transfers by product
   */
  private groupTransfersByProduct(transfers: any[]) {
    const grouped: Record<
      string,
      {
        productName: string;
        productSku: string;
        totalQuantity: number;
        transferCount: number;
      }
    > = {};

    transfers.forEach(transfer => {
      transfer.items.forEach((item: any) => {
        const productId = item.productId;
        if (!grouped[productId]) {
          grouped[productId] = {
            productName: item.product?.name || 'Desconocido',
            productSku: item.product?.sku || '-',
            totalQuantity: 0,
            transferCount: 0,
          };
        }

        grouped[productId].totalQuantity += item.quantity;
        grouped[productId].transferCount += 1;
      });
    });

    return Object.values(grouped).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }

  /**
   * Group performance by category
   */
  private groupPerformanceByCategory(
    performanceArray: Array<{
      categoryName: string;
      quantitySold: number;
      revenue: number;
      profit: number;
    }>
  ) {
    const grouped: Record<
      string,
      {
        categoryName: string;
        quantitySold: number;
        revenue: number;
        profit: number;
        productCount: number;
      }
    > = {};

    performanceArray.forEach(item => {
      const categoryName = item.categoryName;
      if (!grouped[categoryName]) {
        grouped[categoryName] = {
          categoryName,
          quantitySold: 0,
          revenue: 0,
          profit: 0,
          productCount: 0,
        };
      }

      grouped[categoryName].quantitySold += item.quantitySold;
      grouped[categoryName].revenue += item.revenue;
      grouped[categoryName].profit += item.profit;
      grouped[categoryName].productCount += 1;
    });

    return Object.values(grouped)
      .map(cat => ({
        ...cat,
        profitMargin: cat.revenue > 0 ? (cat.profit / cat.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }
}
