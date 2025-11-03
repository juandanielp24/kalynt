import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClient } from '@retail/database';
import { AFIPService } from '@retail/ar';
import { CreateSaleDto, CompleteSaleDto, QuerySalesDto } from './dto';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private afipService: AFIPService,
    @Inject('NOTIFICATIONS_SERVICE') private notificationsService?: any
  ) {}

  /**
   * Crea una nueva venta (borrador)
   */
  async create(tenantId: string, userId: string, dto: CreateSaleDto) {
    this.logger.log(`Creating sale for tenant ${tenantId}, user ${userId}`);

    // 1. Validar que todos los productos existen y tienen stock
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
        deletedAt: null,
      },
      include: {
        stock: {
          where: {
            locationId: dto.locationId,
          },
        },
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Some products not found');
    }

    // 2. Validar stock disponible
    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId)!;
      const stock = product.stock[0];

      if (!stock || stock.quantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product ${product.name}. Available: ${stock?.quantity || 0}, Requested: ${item.quantity}`
        );
      }
    }

    // 3. Calcular totales
    const calculations = this.calculateTotals(dto.items, products);

    // 4. Crear venta en transacción
    const sale = await this.prisma.$transaction(async (tx) => {
      // Generar número de venta secuencial
      const lastSale = await tx.sale.findFirst({
        where: { tenantId },
        orderBy: { saleNumber: 'desc' },
        select: { saleNumber: true },
      });

      const nextNumber = lastSale
        ? String(parseInt(lastSale.saleNumber) + 1).padStart(8, '0')
        : '00000001';

      // Crear venta
      const newSale = await tx.sale.create({
        data: {
          tenantId,
          userId,
          locationId: dto.locationId,
          saleNumber: nextNumber,
          saleDate: new Date(),
          subtotalCents: calculations.subtotalCents,
          taxCents: calculations.taxCents,
          discountCents: dto.discountCents || 0,
          totalCents: calculations.totalCents - (dto.discountCents || 0),
          paymentMethod: dto.paymentMethod,
          paymentStatus: 'PENDING',
          customerName: dto.customerName,
          customerCuit: dto.customerCuit,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          notes: dto.notes,
          status: 'DRAFT',
        },
      });

      // Crear items de venta
      await tx.saleItem.createMany({
        data: dto.items.map((item) => {
          const product = products.find((p) => p.id === item.productId)!;
          const subtotalCents = item.unitPriceCents * item.quantity;
          const taxCents = Math.round(subtotalCents * Number(product.taxRate));

          return {
            saleId: newSale.id,
            productId: item.productId,
            productName: product.name,
            productSku: product.sku,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            taxRate: product.taxRate,
            discountCents: item.discountCents || 0,
            subtotalCents,
            taxCents,
            totalCents: subtotalCents + taxCents - (item.discountCents || 0),
          };
        }),
      });

      // Actualizar stock (decrementar)
      for (const item of dto.items) {
        await tx.stock.update({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: dto.locationId,
            },
          },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Log de auditoría
      await tx.auditLog.create({
        data: {
          tenantId,
          userId,
          action: 'create',
          entity: 'sale',
          entityId: newSale.id,
          changes: {
            sale: newSale,
            items: dto.items,
          },
        },
      });

      return newSale;
    });

    this.logger.log(`Sale created: ${sale.id} (${sale.saleNumber})`);

    // Retornar venta completa con items
    return this.findOne(tenantId, sale.id);
  }

  /**
   * Completa una venta y genera factura AFIP
   */
  async complete(tenantId: string, saleId: string, dto?: CompleteSaleDto) {
    this.logger.log(`Completing sale ${saleId}`);

    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, tenantId, status: 'DRAFT' },
      include: {
        items: true,
        tenant: true,
      },
    });

    if (!sale) {
      throw new BadRequestException('Sale not found or already completed');
    }

    // 1. Marcar pago como completado
    await this.prisma.sale.update({
      where: { id: saleId },
      data: {
        paymentStatus: 'COMPLETED',
      },
    });

    // 2. Determinar tipo de factura según condición fiscal
    const invoiceType = this.determineInvoiceType(
      sale.tenant.fiscalCondition!,
      sale.customerCuit
    );

    this.logger.log(`Generating ${invoiceType} invoice for sale ${saleId}`);

    // 3. Generar factura AFIP
    const afipResponse = await this.afipService.generateInvoice({
      saleId: sale.id,
      tenantId,
      invoiceType,
      customerCuit: sale.customerCuit || undefined,
      customerName: sale.customerName || undefined,
      items: sale.items.map((item) => ({
        description: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPriceCents,
        taxRate: Number(item.taxRate),
        total: item.totalCents,
      })),
      subtotal: sale.subtotalCents,
      tax: sale.taxCents,
      total: sale.totalCents,
    });

    // 4. Actualizar con datos de factura
    if (afipResponse.success) {
      const completedSale = await this.prisma.sale.update({
        where: { id: saleId },
        data: {
          status: 'COMPLETED',
          invoiceType,
          invoiceNumber: this.formatInvoiceNumber(
            afipResponse.numero_comprobante!
          ),
          cae: afipResponse.cae,
          caeExpiration: this.parseAFIPDate(afipResponse.cae_vencimiento!),
          notes: {
            ...((typeof sale.notes === 'object' ? sale.notes : {}) as object),
            afipResponse: {
              cae: afipResponse.cae,
              caeExpiration: afipResponse.cae_vencimiento,
              invoiceNumber: afipResponse.numero_comprobante,
              processDate: afipResponse.fecha_proceso,
              qrCode: afipResponse.qr_code,
            },
          },
        },
        include: {
          items: true,
        },
      });

      this.logger.log(`Sale completed successfully. CAE: ${afipResponse.cae}`);

      // Enviar recibo por email si está disponible el servicio de notificaciones
      if (this.notificationsService && sale.customerEmail) {
        this.notificationsService.sendSaleReceipt(saleId).catch((err: any) => {
          this.logger.error(`Failed to send sale receipt email: ${err.message}`);
        });
      }

      return {
        success: true,
        sale: completedSale,
        invoice: afipResponse,
      };
    } else {
      this.logger.error('AFIP invoice generation failed', afipResponse.errors);

      throw new BadRequestException(
        `Invoice generation failed: ${JSON.stringify(afipResponse.errors)}`
      );
    }
  }

  /**
   * Busca todas las ventas con filtros
   */
  async findAll(tenantId: string, query: QuerySalesDto) {
    const { page = 1, limit = 50, status, paymentStatus, dateFrom, dateTo, search, locationId } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
    };

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (locationId) {
      where.locationId = locationId;
    }

    if (dateFrom || dateTo) {
      where.saleDate = {};
      if (dateFrom) where.saleDate.gte = new Date(dateFrom);
      if (dateTo) where.saleDate.lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { saleNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerCuit: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            select: {
              id: true,
              productName: true,
              quantity: true,
              unitPriceCents: true,
              totalCents: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          location: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { saleDate: 'desc' },
      }),
      this.prisma.sale.count({ where }),
    ]);

    return {
      data: sales,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca una venta por ID
   */
  async findOne(tenantId: string, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        location: true,
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    return sale;
  }

  /**
   * Cancela una venta y restaura el stock
   */
  async cancel(tenantId: string, saleId: string) {
    const sale = await this.prisma.sale.findFirst({
      where: { id: saleId, tenantId },
      include: { items: true },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    if (sale.status === 'COMPLETED' || sale.status === 'CANCELLED') {
      throw new BadRequestException('Cannot cancel this sale');
    }

    // Restaurar stock en transacción
    await this.prisma.$transaction(async (tx) => {
      // Actualizar status
      await tx.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELLED' },
      });

      // Restaurar stock
      for (const item of sale.items) {
        await tx.stock.update({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: sale.locationId,
            },
          },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });
      }
    });

    return { success: true, message: 'Sale cancelled successfully' };
  }

  /**
   * Calcula totales de la venta
   */
  private calculateTotals(items: any[], products: any[]) {
    let subtotalCents = 0;
    let taxCents = 0;

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      const itemSubtotal = item.unitPriceCents * item.quantity;
      const itemTax = Math.round(itemSubtotal * Number(product.taxRate));

      subtotalCents += itemSubtotal;
      taxCents += itemTax;
    }

    return {
      subtotalCents,
      taxCents,
      totalCents: subtotalCents + taxCents,
    };
  }

  /**
   * Determina el tipo de factura según condición fiscal
   */
  private determineInvoiceType(
    fiscalCondition: string,
    customerCuit?: string | null
  ): 'A' | 'B' | 'C' {
    if (fiscalCondition === 'RI') {
      return customerCuit ? 'A' : 'B';
    }
    return 'C';
  }

  /**
   * Formatea número de factura (0001-00012345)
   */
  private formatInvoiceNumber(number: number): string {
    return `0001-${String(number).padStart(8, '0')}`;
  }

  /**
   * Parsea fecha de AFIP (YYYYMMDD) a Date
   */
  private parseAFIPDate(dateString: string): Date {
    const year = parseInt(dateString.slice(0, 4), 10);
    const month = parseInt(dateString.slice(4, 6), 10) - 1;
    const day = parseInt(dateString.slice(6, 8), 10);
    return new Date(year, month, day);
  }

  /**
   * Obtiene el estado del servidor AFIP
   */
  async getAFIPStatus() {
    try {
      return await this.afipService.checkServerStatus();
    } catch (error: any) {
      this.logger.error('Error checking AFIP status', error);
      return {
        appserver: 'ERROR',
        dbserver: 'ERROR',
        authserver: 'ERROR',
        error: error.message,
      };
    }
  }

  /**
   * Valida un CUIT
   */
  validateCUIT(cuit: string): boolean {
    return this.afipService.validateCUIT(cuit);
  }
}
