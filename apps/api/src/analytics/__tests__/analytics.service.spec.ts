import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../analytics.service';
import { PrismaClient } from '@retail/database';
import { subDays, startOfDay, endOfDay } from 'date-fns';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: 'PRISMA',
          useValue: {
            sale: {
              aggregate: jest.fn(),
              groupBy: jest.fn(),
              findMany: jest.fn(),
            },
            product: {
              count: jest.fn(),
              findMany: jest.fn(),
            },
            stock: {
              count: jest.fn(),
            },
            saleItem: {
              groupBy: jest.fn(),
            },
            $queryRaw: jest.fn(),
            $queryRawUnsafe: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    prisma = module.get('PRISMA');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSalesMetrics', () => {
    it('should return sales metrics with comparison', async () => {
      const tenantId = 'tenant-1';
      const startDate = startOfDay(subDays(new Date(), 30));
      const endDate = endOfDay(new Date());

      const mockCurrentSales = {
        _sum: { totalCents: 100000 },
        _count: 10,
        _avg: { totalCents: 10000 },
      };

      const mockPreviousSales = {
        _sum: { totalCents: 80000 },
        _count: 8,
      };

      jest
        .spyOn(prisma.sale, 'aggregate')
        .mockResolvedValueOnce(mockCurrentSales as any)
        .mockResolvedValueOnce(mockPreviousSales as any);

      const result = await service.getSalesMetrics(tenantId, startDate, endDate);

      expect(result.totalRevenue).toBe(100000);
      expect(result.totalSales).toBe(10);
      expect(result.revenueChange).toBeCloseTo(25, 1); // (100000 - 80000) / 80000 * 100
      expect(result.averageTicket).toBe(10000);
    });

    it('should handle zero previous revenue', async () => {
      const mockCurrentSales = {
        _sum: { totalCents: 100000 },
        _count: 10,
        _avg: { totalCents: 10000 },
      };

      const mockPreviousSales = {
        _sum: { totalCents: 0 },
        _count: 0,
      };

      jest
        .spyOn(prisma.sale, 'aggregate')
        .mockResolvedValueOnce(mockCurrentSales as any)
        .mockResolvedValueOnce(mockPreviousSales as any);

      const result = await service.getSalesMetrics(
        'tenant-1',
        new Date(),
        new Date()
      );

      expect(result.revenueChange).toBe(0);
    });
  });

  describe('getTopProducts', () => {
    it('should return top selling products', async () => {
      const mockTopProducts = [
        {
          productId: 'product-1',
          _sum: { quantity: 100, totalCents: 50000 },
          _count: 20,
        },
        {
          productId: 'product-2',
          _sum: { quantity: 80, totalCents: 40000 },
          _count: 15,
        },
      ];

      const mockProducts = [
        {
          id: 'product-1',
          name: 'Product 1',
          sku: 'SKU-001',
          priceCents: 500,
          imageUrl: 'image1.jpg',
        },
        {
          id: 'product-2',
          name: 'Product 2',
          sku: 'SKU-002',
          priceCents: 500,
          imageUrl: 'image2.jpg',
        },
      ];

      jest.spyOn(prisma.saleItem, 'groupBy').mockResolvedValue(mockTopProducts as any);
      jest.spyOn(prisma.product, 'findMany').mockResolvedValue(mockProducts as any);

      const result = await service.getTopProducts(
        'tenant-1',
        { startDate: new Date(), endDate: new Date() },
        10
      );

      expect(result).toHaveLength(2);
      expect(result[0].productId).toBe('product-1');
      expect(result[0].name).toBe('Product 1');
      expect(result[0].unitsSold).toBe(100);
      expect(result[0].revenue).toBe(50000);
    });
  });

  describe('getSalesByCategory', () => {
    it('should return sales grouped by category', async () => {
      const mockData = [
        {
          categoryId: 'cat-1',
          categoryName: 'Electronics',
          revenue: BigInt(100000),
          count: BigInt(50),
        },
        {
          categoryId: 'cat-2',
          categoryName: 'Clothing',
          revenue: BigInt(80000),
          count: BigInt(40),
        },
      ];

      jest.spyOn(prisma, '$queryRaw').mockResolvedValue(mockData as any);

      const result = await service.getSalesByCategory('tenant-1', {
        startDate: new Date(),
        endDate: new Date(),
      });

      expect(result).toHaveLength(2);
      expect(result[0].categoryName).toBe('Electronics');
      expect(result[0].revenue).toBe(100000);
      expect(result[0].salesCount).toBe(50);
    });
  });

  describe('getSalesTrends', () => {
    it('should return daily trends', async () => {
      const mockTrends = [
        {
          period: new Date('2024-01-01'),
          revenue: BigInt(10000),
          count: BigInt(5),
          avgTicket: 2000,
        },
        {
          period: new Date('2024-01-02'),
          revenue: BigInt(15000),
          count: BigInt(7),
          avgTicket: 2142.85,
        },
      ];

      jest.spyOn(prisma, '$queryRawUnsafe').mockResolvedValue(mockTrends as any);

      const result = await service.getSalesTrends('tenant-1', 'daily', 30);

      expect(result).toHaveLength(2);
      expect(result[0].revenue).toBe(10000);
      expect(result[0].salesCount).toBe(5);
    });
  });
});
