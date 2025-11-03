import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';

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
}
