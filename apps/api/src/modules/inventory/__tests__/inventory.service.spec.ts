import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from '../inventory.service';
import { PrismaClient } from '@retail/database';
import { BadRequestException } from '@nestjs/common';

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: jest.Mocked<PrismaClient>;

  const mockPrisma = {
    stock: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: 'PRISMA',
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get('PRISMA');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('adjustStock', () => {
    it('should successfully adjust stock quantity', async () => {
      const mockStock = {
        id: 'stock-1',
        productId: 'product-1',
        locationId: 'location-1',
        quantity: 100,
        minQuantity: 10,
      };

      const updatedStock = {
        ...mockStock,
        quantity: 95,
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        mockPrisma.stock.findUnique.mockResolvedValue(mockStock as any);
        mockPrisma.stock.update.mockResolvedValue(updatedStock as any);
        mockPrisma.auditLog.create.mockResolvedValue({} as any);

        return await callback(mockPrisma as any);
      });

      const result = await service.adjustStock(
        'tenant-1',
        'product-1',
        'location-1',
        -5,
        'Manual adjustment',
        'user-1'
      );

      expect(result.quantity).toBe(95);
    });

    it('should throw BadRequestException if stock record not found', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        mockPrisma.stock.findUnique.mockResolvedValue(null);
        return await callback(mockPrisma as any);
      });

      await expect(
        service.adjustStock(
          'tenant-1',
          'product-1',
          'location-1',
          -5,
          'Test',
          'user-1'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if resulting stock would be negative', async () => {
      const mockStock = {
        id: 'stock-1',
        quantity: 10,
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        mockPrisma.stock.findUnique.mockResolvedValue(mockStock as any);
        return await callback(mockPrisma as any);
      });

      await expect(
        service.adjustStock(
          'tenant-1',
          'product-1',
          'location-1',
          -15,
          'Test',
          'user-1'
        )
      ).rejects.toThrow('Resulting stock cannot be negative');
    });
  });

  describe('transferStock', () => {
    it('should successfully transfer stock between locations', async () => {
      const mockFromStock = {
        id: 'stock-1',
        productId: 'product-1',
        locationId: 'location-1',
        quantity: 100,
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        mockPrisma.stock.findUnique.mockResolvedValue(mockFromStock as any);
        mockPrisma.stock.update.mockResolvedValue({} as any);
        mockPrisma.stock.upsert.mockResolvedValue({} as any);
        mockPrisma.auditLog.create.mockResolvedValue({} as any);

        return await callback(mockPrisma as any);
      });

      const result = await service.transferStock(
        'tenant-1',
        'product-1',
        'location-1',
        'location-2',
        10,
        'user-1'
      );

      expect(result.success).toBe(true);
      expect(result.quantity).toBe(10);
    });

    it('should throw BadRequestException if quantity is not positive', async () => {
      await expect(
        service.transferStock(
          'tenant-1',
          'product-1',
          'location-1',
          'location-2',
          0,
          'user-1'
        )
      ).rejects.toThrow('Quantity must be positive');
    });

    it('should throw BadRequestException if source and destination are the same', async () => {
      await expect(
        service.transferStock(
          'tenant-1',
          'product-1',
          'location-1',
          'location-1',
          10,
          'user-1'
        )
      ).rejects.toThrow('Source and destination locations must be different');
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      const mockFromStock = {
        id: 'stock-1',
        quantity: 5,
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        mockPrisma.stock.findUnique.mockResolvedValue(mockFromStock as any);
        return await callback(mockPrisma as any);
      });

      await expect(
        service.transferStock(
          'tenant-1',
          'product-1',
          'location-1',
          'location-2',
          10,
          'user-1'
        )
      ).rejects.toThrow('Insufficient stock in source location');
    });
  });

  describe('getStockMovements', () => {
    it('should return stock movements with filters', async () => {
      const mockMovements = [
        {
          id: '1',
          tenantId: 'tenant-1',
          entity: 'stock',
          action: 'stock_adjustment',
          createdAt: new Date(),
        },
      ];

      mockPrisma.auditLog.findMany.mockResolvedValue(mockMovements as any);

      const result = await service.getStockMovements(
        'tenant-1',
        'product-1',
        'location-1'
      );

      expect(result).toEqual(mockMovements);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalled();
    });
  });

  describe('getLowStockProducts', () => {
    it('should return products with low stock', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Test Product',
          sku: 'TEST-001',
          deletedAt: null,
          trackStock: true,
          stock: [
            {
              locationId: 'location-1',
              location: { name: 'Main Warehouse' },
              quantity: 5,
              minQuantity: 10,
            },
          ],
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts as any);

      const result = await service.getLowStockProducts('tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'product-1',
        name: 'Test Product',
        sku: 'TEST-001',
        stock: [
          {
            locationId: 'location-1',
            locationName: 'Main Warehouse',
            currentStock: 5,
            minStock: 10,
            deficit: 5,
          },
        ],
      });
    });

    it('should filter out products with adequate stock', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Test Product',
          sku: 'TEST-001',
          deletedAt: null,
          trackStock: true,
          stock: [
            {
              locationId: 'location-1',
              location: { name: 'Main Warehouse' },
              quantity: 50,
              minQuantity: 10,
            },
          ],
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts as any);

      const result = await service.getLowStockProducts('tenant-1');

      expect(result).toHaveLength(0);
    });
  });

  describe('getInventorySummary', () => {
    it('should return inventory summary by location', async () => {
      const mockProducts = [
        {
          id: 'product-1',
          name: 'Test Product',
          deletedAt: null,
          costCents: 5000,
          stock: [
            {
              locationId: 'location-1',
              location: { name: 'Main Warehouse' },
              quantity: 100,
              minQuantity: 10,
            },
          ],
        },
        {
          id: 'product-2',
          name: 'Test Product 2',
          deletedAt: null,
          costCents: 10000,
          stock: [
            {
              locationId: 'location-1',
              location: { name: 'Main Warehouse' },
              quantity: 0,
              minQuantity: 5,
            },
          ],
        },
      ];

      mockPrisma.product.findMany.mockResolvedValue(mockProducts as any);

      const result = await service.getInventorySummary('tenant-1');

      expect(result.totalProducts).toBe(2);
      expect(result.outOfStockCount).toBe(1);
      expect(result.byLocation['Main Warehouse']).toBeDefined();
      expect(result.byLocation['Main Warehouse'].totalItems).toBe(2);
      expect(result.byLocation['Main Warehouse'].totalQuantity).toBe(100);
    });
  });
});
