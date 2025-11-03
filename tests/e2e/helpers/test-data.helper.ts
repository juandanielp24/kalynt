import { PrismaClient } from '@retail/database';

export class TestDataHelper {
  public prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL },
      },
    });
  }

  async createProduct(tenantId: string, data?: Partial<any>) {
    const timestamp = Date.now();
    return await this.prisma.product.create({
      data: {
        tenantId,
        sku: data?.sku || `SKU-${timestamp}`,
        name: data?.name || `Test Product ${timestamp}`,
        description: data?.description,
        costCents: data?.costCents || 100000, // $1000
        priceCents: data?.priceCents || 150000, // $1500
        taxRate: data?.taxRate || 0.21,
        trackStock: data?.trackStock ?? true,
        isActive: data?.isActive ?? true,
        categoryId: data?.categoryId,
        barcode: data?.barcode,
        imageUrl: data?.imageUrl,
      },
    });
  }

  async createStock(
    tenantId: string,
    productId: string,
    locationId: string,
    quantity: number = 100
  ) {
    // Check if stock already exists
    const existing = await this.prisma.stock.findUnique({
      where: {
        productId_locationId: {
          productId,
          locationId,
        },
      },
    });

    if (existing) {
      // Update existing stock
      return await this.prisma.stock.update({
        where: {
          productId_locationId: {
            productId,
            locationId,
          },
        },
        data: {
          quantity,
        },
      });
    }

    // Create new stock
    return await this.prisma.stock.create({
      data: {
        tenantId,
        productId,
        locationId,
        quantity,
        minQuantity: 10,
        maxQuantity: 1000,
      },
    });
  }

  async createCategory(tenantId: string, name: string, parentId?: string) {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    return await this.prisma.category.create({
      data: {
        tenantId,
        name,
        slug,
        parentId,
      },
    });
  }

  async createLocation(tenantId: string, data?: Partial<any>) {
    return await this.prisma.location.create({
      data: {
        tenantId,
        name: data?.name || 'Test Location',
        type: data?.type || 'store',
        isActive: data?.isActive ?? true,
        address: data?.address,
        city: data?.city,
        province: data?.province,
        country: data?.country || 'AR',
        phone: data?.phone,
        email: data?.email,
      },
    });
  }

  async createSale(tenantId: string, userId: string, locationId: string, data?: Partial<any>) {
    const timestamp = Date.now();
    const saleNumber = `SALE-${timestamp}`;

    return await this.prisma.sale.create({
      data: {
        tenantId,
        userId,
        locationId,
        saleNumber,
        subtotalCents: data?.subtotalCents || 100000,
        taxCents: data?.taxCents || 21000,
        totalCents: data?.totalCents || 121000,
        paymentMethod: data?.paymentMethod || 'cash',
        paymentStatus: data?.paymentStatus || 'completed',
        status: data?.status || 'completed',
        customerName: data?.customerName,
        customerEmail: data?.customerEmail,
        customerCuit: data?.customerCuit,
        discountCents: data?.discountCents || 0,
      },
    });
  }

  async createSaleItem(saleId: string, productId: string, data?: Partial<any>) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const quantity = data?.quantity || 1;
    const unitPriceCents = data?.unitPriceCents || product.priceCents;
    const taxRate = data?.taxRate || product.taxRate;
    const discountCents = data?.discountCents || 0;

    const subtotalCents = unitPriceCents * quantity - discountCents;
    const taxCents = Math.round(subtotalCents * Number(taxRate));
    const totalCents = subtotalCents + taxCents;

    return await this.prisma.saleItem.create({
      data: {
        saleId,
        productId,
        productName: product.name,
        productSku: product.sku,
        quantity,
        unitPriceCents,
        taxRate,
        discountCents,
        subtotalCents,
        taxCents,
        totalCents,
      },
    });
  }

  async cleanup(tenantId: string) {
    // Delete all data related to the tenant
    // Order matters due to foreign key constraints
    await this.prisma.saleItem.deleteMany({
      where: {
        sale: { tenantId },
      },
    });
    await this.prisma.sale.deleteMany({ where: { tenantId } });
    await this.prisma.stock.deleteMany({ where: { tenantId } });
    await this.prisma.product.deleteMany({ where: { tenantId } });
    await this.prisma.category.deleteMany({ where: { tenantId } });
    await this.prisma.location.deleteMany({ where: { tenantId } });
    await this.prisma.user.deleteMany({ where: { tenantId } });
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  // Helper to wait for a condition
  async waitFor(
    condition: () => Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error('Condition not met within timeout');
  }
}
