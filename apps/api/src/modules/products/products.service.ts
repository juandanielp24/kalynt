import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import { CreateProductDto, UpdateProductDto, ProductQueryDto, BulkUpdatePricesDto } from './dto';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ProductsService {
  constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

  async findAll(tenantId: string, query: ProductQueryDto) {
    const { page = 1, limit = 50, search, categoryId } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          stock: {
            include: {
              location: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        category: true,
        stock: {
          include: {
            location: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(tenantId: string, dto: CreateProductDto) {
    // Verificar SKU único
    const existing = await this.prisma.product.findFirst({
      where: { tenantId, sku: dto.sku, deletedAt: null },
    });

    if (existing) {
      throw new BadRequestException(`Product with SKU ${dto.sku} already exists`);
    }

    // Crear producto y stock inicial
    return this.prisma.$transaction(async (tx) => {
      const { initialStock, ...productData } = dto;

      const product = await tx.product.create({
        data: {
          tenantId,
          ...productData,
        },
      });

      // Crear stock en todas las ubicaciones
      if (initialStock) {
        await tx.stock.create({
          data: {
            tenantId,
            productId: product.id,
            locationId: initialStock.locationId,
            quantity: initialStock.quantity,
            minQuantity: initialStock.minQuantity || 0,
          },
        });
      }

      return product;
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(tenantId, id); // Verificar que existe

    const { initialStock, ...updateData } = dto as any;

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    // Soft delete
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async getStock(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    return this.prisma.stock.findMany({
      where: { tenantId, productId: id },
      include: {
        location: true,
      },
    });
  }

  /**
   * Búsqueda por código de barras
   */
  async findByBarcode(tenantId: string, barcode: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        tenantId,
        barcode,
        deletedAt: null,
      },
      include: {
        stock: {
          include: {
            location: true,
          },
        },
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with barcode ${barcode} not found`);
    }

    return product;
  }

  /**
   * Actualización masiva de precios
   */
  async bulkUpdatePrices(
    tenantId: string,
    updates: Array<{ id: string; priceCents: number; costCents?: number }>
  ) {
    // Validar que todos los productos existen y pertenecen al tenant
    const productIds = updates.map((u) => u.id);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
        deletedAt: null,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Some products not found');
    }

    // Actualizar en transacción
    return await this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.product.update({
          where: { id: update.id },
          data: {
            priceCents: update.priceCents,
            ...(update.costCents && { costCents: update.costCents }),
          },
        })
      )
    );
  }

  /**
   * Importar productos desde Excel
   */
  async importFromExcel(tenantId: string, buffer: Buffer, locationId: string) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];

    const products: CreateProductDto[] = [];
    const errors: string[] = [];

    // Leer rows (saltar header)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header

      try {
        const sku = row.getCell(1).value?.toString();
        const name = row.getCell(2).value?.toString();
        const costCents = Number(row.getCell(3).value) * 100;
        const priceCents = Number(row.getCell(4).value) * 100;
        const stock = Number(row.getCell(5).value);
        const barcode = row.getCell(6).value?.toString();

        if (!sku || !name || !priceCents) {
          errors.push(`Row ${rowNumber}: Missing required fields`);
          return;
        }

        products.push({
          sku,
          name,
          costCents: costCents || 0,
          priceCents,
          barcode,
          taxRate: 0.21,
          trackStock: true,
          isActive: true,
          initialStock: {
            locationId,
            quantity: stock || 0,
            minQuantity: 10,
          },
        });
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    });

    if (errors.length > 0 && products.length === 0) {
      throw new BadRequestException({
        message: 'Import failed - no valid products found',
        errors,
      });
    }

    // Crear productos en batch
    const created: any[] = [];
    for (const productDto of products) {
      try {
        const product = await this.create(tenantId, productDto);
        created.push(product);
      } catch (error: any) {
        errors.push(`SKU ${productDto.sku}: ${error.message}`);
      }
    }

    return {
      success: true,
      imported: created.length,
      failed: errors.length,
      errors,
    };
  }

  /**
   * Exportar productos a Excel
   */
  async exportToExcel(tenantId: string, filters?: any): Promise<Buffer> {
    const products = await this.findAll(tenantId, {
      page: 1,
      limit: 10000, // Export all
      ...filters,
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos');

    // Headers
    worksheet.columns = [
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Costo', key: 'cost', width: 12 },
      { header: 'Precio', key: 'price', width: 12 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Código Barras', key: 'barcode', width: 15 },
      { header: 'Activo', key: 'active', width: 10 },
    ];

    // Datos
    for (const product of products.data) {
      worksheet.addRow({
        sku: product.sku,
        name: product.name,
        category: product.category?.name || '',
        cost: product.costCents / 100,
        price: product.priceCents / 100,
        stock: product.stock[0]?.quantity || 0,
        barcode: product.barcode || '',
        active: product.isActive ? 'Sí' : 'No',
      });
    }

    // Formato
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    return (await workbook.xlsx.writeBuffer()) as any as Buffer;
  }

  /**
   * Duplicar producto
   */
  async duplicate(tenantId: string, id: string) {
    const original = await this.findOne(tenantId, id);

    // Generar nuevo SKU
    const timestamp = Date.now().toString().slice(-6);
    const newSku = `${original.sku}-COPY-${timestamp}`;

    return await this.create(tenantId, {
      sku: newSku,
      name: `${original.name} (Copia)`,
      description: original.description ?? undefined,
      costCents: original.costCents,
      priceCents: original.priceCents,
      taxRate: Number(original.taxRate),
      categoryId: original.categoryId ?? undefined,
      trackStock: original.trackStock,
      isActive: false, // Crear desactivado por defecto
    });
  }

  /**
   * Toggle active status
   */
  async toggleActive(tenantId: string, id: string) {
    const product = await this.findOne(tenantId, id);

    return await this.prisma.product.update({
      where: { id },
      data: {
        isActive: !product.isActive,
      },
    });
  }
}
