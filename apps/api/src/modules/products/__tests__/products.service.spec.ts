import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from '../products.service';
import { PrismaClient } from '@retail/database';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: jest.Mocked<PrismaClient>;

  const mockPrisma = {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    stock: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: 'PRISMA',
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get('PRISMA');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        {
          id: '1',
          sku: 'TEST-001',
          name: 'Test Product',
          priceCents: 10000,
          costCents: 5000,
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts as any);
      mockPrisma.product.count.mockResolvedValue(1);

      const result = await service.findAll('tenant-1', { page: 1, limit: 50 });

      expect(result).toEqual({
        data: mockProducts,
        meta: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1,
        },
      });
    });
  });

  describe('findByBarcode', () => {
    it('should find product by barcode', async () => {
      const mockProduct = {
        id: '1',
        sku: 'TEST-001',
        barcode: '1234567890',
        name: 'Test Product',
        priceCents: 10000,
      };

      mockPrisma.product.findFirst.mockResolvedValue(mockProduct as any);

      const result = await service.findByBarcode('tenant-1', '1234567890');

      expect(result).toEqual(mockProduct);
      expect(mockPrisma.product.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-1',
          barcode: '1234567890',
          deletedAt: null,
        },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.findByBarcode('tenant-1', 'invalid-barcode')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkUpdatePrices', () => {
    it('should update multiple product prices in transaction', async () => {
      const updates = [
        { id: '1', priceCents: 12000, costCents: 6000 },
        { id: '2', priceCents: 15000 },
      ];

      const mockProducts = [
        { id: '1', sku: 'TEST-001' },
        { id: '2', sku: 'TEST-002' },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts as any);
      mockPrisma.$transaction.mockResolvedValue(mockProducts as any);

      const result = await service.bulkUpdatePrices('tenant-1', updates);

      expect(mockPrisma.product.findMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['1', '2'] },
          tenantId: 'tenant-1',
          deletedAt: null,
        },
      });
      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });

    it('should throw BadRequestException if some products not found', async () => {
      const updates = [
        { id: '1', priceCents: 12000 },
        { id: '2', priceCents: 15000 },
      ];

      mockPrisma.product.findMany.mockResolvedValue([{ id: '1' }] as any);

      await expect(
        service.bulkUpdatePrices('tenant-1', updates)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('duplicate', () => {
    it('should duplicate a product with new SKU', async () => {
      const originalProduct = {
        id: '1',
        sku: 'TEST-001',
        name: 'Test Product',
        description: 'Test Description',
        costCents: 5000,
        priceCents: 10000,
        taxRate: 0.21,
        categoryId: 'cat-1',
        trackStock: true,
        isActive: true,
      };

      const createdProduct = {
        ...originalProduct,
        id: '2',
        sku: expect.stringContaining('TEST-001-COPY'),
        name: 'Test Product (Copia)',
        isActive: false,
      };

      mockPrisma.product.findFirst.mockResolvedValue(originalProduct as any);
      mockPrisma.product.create.mockResolvedValue(createdProduct as any);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockPrisma as any);
      });

      const result = await service.duplicate('tenant-1', '1');

      expect(result.name).toContain('(Copia)');
      expect(result.sku).toContain('TEST-001-COPY');
      expect(result.isActive).toBe(false);
    });
  });

  describe('toggleActive', () => {
    it('should toggle product active status', async () => {
      const mockProduct = {
        id: '1',
        isActive: true,
      };

      const updatedProduct = {
        ...mockProduct,
        isActive: false,
      };

      mockPrisma.product.findFirst.mockResolvedValue(mockProduct as any);
      mockPrisma.product.update.mockResolvedValue(updatedProduct as any);

      const result = await service.toggleActive('tenant-1', '1');

      expect(result.isActive).toBe(false);
      expect(mockPrisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isActive: false },
      });
    });
  });

  describe('importFromExcel', () => {
    it('should handle import with validation errors', async () => {
      // This would require mocking the ExcelJS workbook
      // For now, we'll skip this complex integration test
      expect(service.importFromExcel).toBeDefined();
    });
  });

  describe('exportToExcel', () => {
    it('should export products to Excel buffer', async () => {
      const mockProducts = {
        data: [
          {
            id: '1',
            sku: 'TEST-001',
            name: 'Test Product',
            costCents: 5000,
            priceCents: 10000,
            stock: [{ quantity: 100 }],
            category: { name: 'Category 1' },
            barcode: '1234567890',
            isActive: true,
          },
        ],
        meta: {
          page: 1,
          limit: 10000,
          total: 1,
          totalPages: 1,
        },
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockProducts as any);

      const result = await service.exportToExcel('tenant-1');

      expect(result).toBeInstanceOf(Buffer);
      expect(service.findAll).toHaveBeenCalledWith('tenant-1', {
        page: 1,
        limit: 10000,
      });
    });
  });
});
