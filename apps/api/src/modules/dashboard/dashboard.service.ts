import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/services/prisma.service';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from 'date-fns';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData(
    tenantId: string,
    dateFrom?: Date,
    dateTo?: Date
  ) {
    const from = dateFrom || startOfDay(new Date());
    const to = dateTo || endOfDay(new Date());

    // Ejecutar queries en paralelo para mejor performance
    const [overview, salesChart, topProducts, recentSales, lowStockProducts] =
      await Promise.all([
        this.getOverview(tenantId, from, to),
        this.getSalesChart(tenantId, from, to),
        this.getTopProducts(tenantId, from, to),
        this.getRecentSales(tenantId),
        this.getLowStockProducts(tenantId),
      ]);

    return {
      overview,
      salesChart,
      topProducts,
      recentSales,
      lowStockProducts,
    };
  }

  private async getOverview(tenantId: string, from: Date, to: Date) {
    const today = startOfDay(new Date());
    const yesterday = subDays(today, 1);

    // Ventas de hoy
    const salesToday = await this.prisma.sale.aggregate({
      where: {
        tenantId,
        createdAt: {
          gte: today,
          lte: endOfDay(today),
        },
        status: 'completed',
      },
      _sum: {
        totalCents: true,
      },
      _count: {
        id: true,
      },
    });

    // Ventas de ayer para calcular crecimiento
    const salesYesterday = await this.prisma.sale.aggregate({
      where: {
        tenantId,
        createdAt: {
          gte: yesterday,
          lt: today,
        },
        status: 'completed',
      },
      _sum: {
        totalCents: true,
      },
    });

    const totalSalesCents = salesToday._sum.totalCents || 0;
    const totalSalesYesterday = salesYesterday._sum.totalCents || 0;
    const transactionsCount = salesToday._count.id;

    // Calcular crecimiento porcentual
    let growthPercentage = 0;
    if (totalSalesYesterday > 0) {
      growthPercentage =
        ((totalSalesCents - totalSalesYesterday) / totalSalesYesterday) * 100;
    } else if (totalSalesCents > 0) {
      growthPercentage = 100;
    }

    // Ticket promedio
    const averageTicketCents =
      transactionsCount > 0 ? Math.round(totalSalesCents / transactionsCount) : 0;

    // Total de productos activos
    const productsCount = await this.prisma.product.count({
      where: {
        tenantId,
        isActive: true,
      },
    });

    return {
      totalSalesToday: productsCount,
      totalSalesCents,
      transactionsCount,
      averageTicketCents,
      growthPercentage: Number(growthPercentage.toFixed(2)),
    };
  }

  private async getSalesChart(tenantId: string, from: Date, to: Date) {
    // Generar array de días en el rango
    const days = eachDayOfInterval({ start: from, end: to });

    // Obtener ventas agrupadas por día
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: from,
          lte: to,
        },
        status: 'completed',
      },
      select: {
        createdAt: true,
        totalCents: true,
      },
    });

    // Agrupar ventas por día
    const salesByDay = new Map<string, { sales: number; revenue: number }>();

    days.forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      salesByDay.set(dateKey, { sales: 0, revenue: 0 });
    });

    sales.forEach((sale) => {
      const dateKey = format(sale.createdAt, 'yyyy-MM-dd');
      const current = salesByDay.get(dateKey) || { sales: 0, revenue: 0 };
      salesByDay.set(dateKey, {
        sales: current.sales + 1,
        revenue: current.revenue + sale.totalCents,
      });
    });

    // Convertir a array para el chart (revenue en centavos / 100 para el formato)
    return Array.from(salesByDay.entries()).map(([date, data]) => ({
      date: format(new Date(date), 'dd/MM'),
      sales: data.sales,
      revenue: data.revenue / 100, // Convertir a pesos para el chart
    }));
  }

  private async getTopProducts(tenantId: string, from: Date, to: Date) {
    // Obtener productos más vendidos por cantidad
    const topProducts = await this.prisma.saleItem.groupBy({
      by: ['productId'],
      where: {
        sale: {
          tenantId,
          createdAt: {
            gte: from,
            lte: to,
          },
          status: 'completed',
        },
      },
      _sum: {
        quantity: true,
        totalCents: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 10,
    });

    // Obtener información de productos
    const productsData = await Promise.all(
      topProducts.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true },
        });

        return {
          id: product?.id || '',
          name: product?.name || 'Producto eliminado',
          quantitySold: item._sum.quantity || 0,
          revenueCents: item._sum.totalCents || 0,
        };
      })
    );

    return productsData;
  }

  private async getRecentSales(tenantId: string) {
    const sales = await this.prisma.sale.findMany({
      where: {
        tenantId,
        status: 'completed',
      },
      select: {
        id: true,
        saleNumber: true,
        customerName: true,
        totalCents: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    return sales.map((sale) => ({
      id: sale.id,
      saleNumber: sale.saleNumber,
      customerName: sale.customerName || '',
      totalCents: sale.totalCents,
      createdAt: sale.createdAt.toISOString(),
    }));
  }

  private async getLowStockProducts(tenantId: string) {
    // Obtener productos con stock bajo (currentStock < minStock)
    const lowStockItems = await this.prisma.stock.findMany({
      where: {
        tenantId,
        product: {
          trackStock: true,
          isActive: true,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Filtrar y mapear productos con stock bajo
    const lowStock = lowStockItems
      .filter((item) => item.quantity <= item.minQuantity)
      .map((item) => ({
        id: item.product.id,
        name: item.product.name,
        currentStock: item.quantity,
        minStock: item.minQuantity,
      }))
      .sort((a, b) => a.currentStock - b.currentStock);

    return lowStock;
  }
}
