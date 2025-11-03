import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import {
  ReportType,
  ReportFormat,
  ReportOptions,
  ReportMetadata,
  SalesReportData,
  InventoryReportData,
  FinancialReportData,
  ProductsReportData,
  CustomersReportData,
  TaxReportData,
  ReportData,
} from './report.types';
import { ExcelGenerator } from './generators/excel.generator';
import { PDFGenerator } from './generators/pdf.generator';
import { CSVGenerator } from './generators/csv.generator';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private excelGenerator: ExcelGenerator,
    private pdfGenerator: PDFGenerator,
    private csvGenerator: CSVGenerator,
  ) {}

  async generateReport(
    options: ReportOptions,
  ): Promise<{ buffer: Buffer; filename: string; mimeType: string }> {
    this.logger.log(
      `Generating ${options.format} report for ${options.type} (tenant: ${options.tenantId})`,
    );

    // Fetch data based on report type
    const data = await this.fetchReportData(options);

    // Get tenant name
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: options.tenantId },
      select: { name: true },
    });

    // Build metadata
    const metadata: ReportMetadata = {
      title: this.getReportTitle(options.type),
      description: this.getReportDescription(options),
      generatedAt: new Date(),
      generatedBy: options.userId,
      tenantName: tenant?.name || 'Retail POS',
      filters: options.filters,
    };

    // Generate report in requested format
    let buffer: Buffer;
    let filename: string;
    let mimeType: string;

    switch (options.format) {
      case ReportFormat.EXCEL:
        buffer = await this.excelGenerator.generate(
          options.type,
          data,
          metadata,
        );
        filename = `${options.type}-${Date.now()}.xlsx`;
        mimeType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;

      case ReportFormat.PDF:
        buffer = await this.pdfGenerator.generate(options.type, data, metadata);
        filename = `${options.type}-${Date.now()}.pdf`;
        mimeType = 'application/pdf';
        break;

      case ReportFormat.CSV:
        const csvString = this.csvGenerator.generate(options.type, data);
        buffer = Buffer.from(csvString, 'utf-8');
        filename = `${options.type}-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;

      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }

    this.logger.log(`Report generated successfully: ${filename}`);
    return { buffer, filename, mimeType };
  }

  private async fetchReportData(options: ReportOptions): Promise<ReportData> {
    switch (options.type) {
      case ReportType.SALES:
        return await this.fetchSalesData(options);
      case ReportType.INVENTORY:
        return await this.fetchInventoryData(options);
      case ReportType.FINANCIAL:
        return await this.fetchFinancialData(options);
      case ReportType.PRODUCTS:
        return await this.fetchProductsData(options);
      case ReportType.CUSTOMERS:
        return await this.fetchCustomersData(options);
      case ReportType.TAX:
        return await this.fetchTaxData(options);
      default:
        throw new Error(`Unsupported report type: ${options.type}`);
    }
  }

  private async fetchSalesData(
    options: ReportOptions,
  ): Promise<SalesReportData> {
    const { tenantId, filters } = options;

    const where: any = {
      tenantId,
      status: 'completed',
    };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    if (filters.locationId) {
      where.locationId = filters.locationId;
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        location: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate summary
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalCents, 0);
    const totalTax = sales.reduce((sum, sale) => sum + (sale.taxCents || 0), 0);
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate top products
    const productSales = new Map<
      string,
      { name: string; quantity: number; revenue: number }
    >();

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = productSales.get(item.productId) || {
          name: item.product.name,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += item.quantity;
        existing.revenue += item.unitPriceCents * item.quantity;
        productSales.set(item.productId, existing);
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      sales: sales.map((sale) => ({
        saleNumber: sale.saleNumber,
        date: sale.createdAt,
        customerName: sale.customerName || undefined,
        items: sale.items.length,
        subtotalCents: sale.subtotalCents,
        taxCents: sale.taxCents,
        totalCents: sale.totalCents,
        paymentMethod: sale.paymentMethod,
        location: sale.location?.name || 'Principal',
        status: sale.status,
      })),
      summary: {
        totalSales,
        totalRevenue,
        totalTax,
        averageTicket,
        topProducts,
      },
    };
  }

  private async fetchInventoryData(
    options: ReportOptions,
  ): Promise<InventoryReportData> {
    const { tenantId, filters } = options;

    const where: any = {
      tenantId,
    };

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.locationId) {
      where.stock = {
        some: {
          locationId: filters.locationId,
        },
      };
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: true,
        stock: filters.locationId
          ? {
              where: { locationId: filters.locationId },
            }
          : true,
      },
    });

    const productsData = products.map((product) => {
      const totalStock = product.stock.reduce(
        (sum, level) => sum + level.quantity,
        0,
      );

      // Get min/max from first stock level (or default)
      const firstStock = product.stock[0];
      const minStock = firstStock?.minQuantity || 0;
      const maxStock = firstStock?.maxQuantity || 999999;

      let status: 'normal' | 'low' | 'out' | 'excess' = 'normal';
      if (totalStock === 0) {
        status = 'out';
      } else if (totalStock < minStock) {
        status = 'low';
      } else if (totalStock > maxStock) {
        status = 'excess';
      }

      return {
        sku: product.sku,
        name: product.name,
        category: product.category?.name || 'Sin categoría',
        stock: totalStock,
        minStock,
        maxStock,
        costCents: product.costCents,
        priceCents: product.priceCents,
        totalValueCents: totalStock * product.costCents,
        status,
      };
    });

    const summary = {
      totalProducts: productsData.length,
      totalValue: productsData.reduce(
        (sum, p) => sum + p.totalValueCents,
        0,
      ),
      lowStockItems: productsData.filter((p) => p.status === 'low').length,
      outOfStockItems: productsData.filter((p) => p.status === 'out').length,
      excessStockItems: productsData.filter((p) => p.status === 'excess')
        .length,
    };

    return {
      products: productsData,
      summary,
    };
  }

  private async fetchFinancialData(
    options: ReportOptions,
  ): Promise<FinancialReportData> {
    const { tenantId, filters } = options;

    const where: any = {
      tenantId,
      status: 'completed',
    };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Calculate revenue by payment method
    const revenue = {
      cash: 0,
      card: 0,
      transfer: 0,
      mercadoPago: 0,
      total: 0,
    };

    sales.forEach((sale) => {
      const amount = sale.totalCents;
      switch (sale.paymentMethod) {
        case 'cash':
          revenue.cash += amount;
          break;
        case 'card':
          revenue.card += amount;
          break;
        case 'transfer':
          revenue.transfer += amount;
          break;
        case 'mercado_pago':
          revenue.mercadoPago += amount;
          break;
      }
      revenue.total += amount;
    });

    // Calculate profit
    let totalCost = 0;
    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        totalCost += (item.product.costCents || 0) * item.quantity;
      });
    });

    const grossProfit = revenue.total - totalCost;

    // Mock expenses (in a real app, fetch from expenses table)
    const expenses = {
      purchases: totalCost,
      salaries: 0,
      rent: 0,
      utilities: 0,
      other: 0,
      total: totalCost,
    };

    const netProfit = grossProfit - expenses.total;
    const margin = revenue.total > 0 ? (netProfit / revenue.total) * 100 : 0;

    // Calculate taxes
    const totalTax = sales.reduce((sum, sale) => sum + (sale.taxCents || 0), 0);

    return {
      revenue,
      expenses,
      profit: {
        gross: grossProfit,
        net: netProfit,
        margin,
      },
      taxes: {
        collected: totalTax,
        paid: 0, // Mock - should come from tax payments table
        pending: totalTax,
      },
    };
  }

  private async fetchProductsData(
    options: ReportOptions,
  ): Promise<ProductsReportData> {
    const { tenantId, filters } = options;

    const where: any = {
      tenantId,
      status: 'completed',
    };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    // Aggregate product performance
    const productPerformance = new Map<
      string,
      {
        name: string;
        sku: string;
        category: string;
        unitsSold: number;
        revenue: number;
        cost: number;
      }
    >();

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        const existing = productPerformance.get(item.productId) || {
          name: item.product.name,
          sku: item.product.sku,
          category: item.product.category?.name || 'Sin categoría',
          unitsSold: 0,
          revenue: 0,
          cost: 0,
        };

        existing.unitsSold += item.quantity;
        existing.revenue += item.unitPriceCents * item.quantity;
        existing.cost += item.product.costCents * item.quantity;

        productPerformance.set(item.productId, existing);
      });
    });

    const products = Array.from(productPerformance.values()).map((p) => ({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitsSold: p.unitsSold,
      revenue: p.revenue,
      profit: p.revenue - p.cost,
      margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
    }));

    // Sort by revenue
    products.sort((a, b) => b.revenue - a.revenue);

    const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
    const totalProfit = products.reduce((sum, p) => sum + p.profit, 0);

    return {
      products,
      summary: {
        topPerformers: products.slice(0, 5).map((p) => ({
          name: p.name,
          revenue: p.revenue,
        })),
        underperformers: products.slice(-5).map((p) => ({
          name: p.name,
          revenue: p.revenue,
        })),
        totalRevenue,
        totalProfit,
      },
    };
  }

  private async fetchCustomersData(
    options: ReportOptions,
  ): Promise<CustomersReportData> {
    const { tenantId, filters } = options;

    const where: any = {
      tenantId,
      status: 'completed',
      customerEmail: {
        not: null,
      },
    };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const sales = await this.prisma.sale.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group sales by customer email
    const customerMap = new Map<
      string,
      {
        name: string;
        email: string;
        phone?: string;
        purchases: Array<{ totalCents: number; createdAt: Date }>;
      }
    >();

    sales.forEach((sale) => {
      if (!sale.customerEmail) return;

      const existing = customerMap.get(sale.customerEmail) || {
        name: sale.customerName || 'Sin nombre',
        email: sale.customerEmail,
        phone: undefined, // Not stored in Sale model
        purchases: [],
      };

      existing.purchases.push({
        totalCents: sale.totalCents,
        createdAt: sale.createdAt,
      });

      customerMap.set(sale.customerEmail, existing);
    });

    const customersData = Array.from(customerMap.values()).map((customer) => {
      const totalPurchases = customer.purchases.length;
      const totalSpent = customer.purchases.reduce(
        (sum, p) => sum + p.totalCents,
        0,
      );
      const averageTicket = totalSpent / totalPurchases;
      const lastPurchase = customer.purchases[0]?.createdAt || new Date();

      return {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalPurchases,
        totalSpent,
        averageTicket,
        lastPurchase,
      };
    });

    // Sort by total spent
    customersData.sort((a, b) => b.totalSpent - a.totalSpent);

    const periodStart = filters.startDate || new Date(new Date().getFullYear(), 0, 1);
    const newCustomers = Array.from(customerMap.values()).filter((c) =>
      c.purchases.some((p) => p.createdAt >= periodStart),
    ).length;

    const repeatCustomers = customersData.filter(
      (c) => c.totalPurchases > 1,
    ).length;

    const totalRevenue = customersData.reduce((sum, c) => sum + c.totalSpent, 0);
    const averageSpendPerCustomer =
      customersData.length > 0 ? totalRevenue / customersData.length : 0;

    return {
      customers: customersData,
      summary: {
        totalCustomers: customersData.length,
        newCustomers,
        repeatCustomers,
        totalRevenue,
        averageSpendPerCustomer,
      },
    };
  }

  private async fetchTaxData(options: ReportOptions): Promise<TaxReportData> {
    const { tenantId, filters } = options;

    const where: any = {
      tenantId,
      status: 'completed',
      invoiceNumber: {
        not: null,
      },
    };

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const sales = await this.prisma.sale.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const invoices = sales.map((sale) => ({
      number: sale.invoiceNumber || '',
      type: sale.invoiceType || 'B',
      date: sale.createdAt,
      customerCuit: sale.customerCuit || undefined,
      customerName: sale.customerName || undefined,
      netAmount: sale.subtotalCents,
      taxAmount: sale.taxCents,
      totalAmount: sale.totalCents,
      cae: sale.cae || '',
      status: 'approved',
    }));

    const totalInvoices = invoices.length;
    const totalNetAmount = invoices.reduce(
      (sum, inv) => sum + inv.netAmount,
      0,
    );
    const totalTaxAmount = invoices.reduce(
      (sum, inv) => sum + inv.taxAmount,
      0,
    );
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // Group by invoice type
    const byInvoiceType: Record<string, { count: number; amount: number }> = {};
    invoices.forEach((inv) => {
      if (!byInvoiceType[inv.type]) {
        byInvoiceType[inv.type] = { count: 0, amount: 0 };
      }
      byInvoiceType[inv.type].count++;
      byInvoiceType[inv.type].amount += inv.totalAmount;
    });

    return {
      period: {
        startDate: filters.startDate || new Date(),
        endDate: filters.endDate || new Date(),
      },
      invoices,
      summary: {
        totalInvoices,
        totalNetAmount,
        totalTaxAmount,
        totalAmount,
        byInvoiceType,
      },
    };
  }

  private getReportTitle(type: ReportType): string {
    const titles = {
      [ReportType.SALES]: 'Reporte de Ventas',
      [ReportType.INVENTORY]: 'Reporte de Inventario',
      [ReportType.FINANCIAL]: 'Reporte Financiero',
      [ReportType.PRODUCTS]: 'Reporte de Productos',
      [ReportType.CUSTOMERS]: 'Reporte de Clientes',
      [ReportType.TAX]: 'Reporte de Impuestos AFIP',
    };
    return titles[type] || 'Reporte';
  }

  private getReportDescription(options: ReportOptions): string {
    const parts: string[] = [];

    if (options.filters.startDate && options.filters.endDate) {
      parts.push(
        `Período: ${options.filters.startDate.toLocaleDateString('es-AR')} - ${options.filters.endDate.toLocaleDateString('es-AR')}`,
      );
    }

    if (options.filters.locationId) {
      parts.push('Filtrado por sucursal');
    }

    if (options.filters.categoryId) {
      parts.push('Filtrado por categoría');
    }

    return parts.length > 0 ? parts.join(' | ') : 'Todos los registros';
  }
}
