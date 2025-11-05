import { Test, TestingModule } from '@nestjs/testing';
import { StockTransfersService } from '../stock-transfers.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransferStatus, StockMovementType } from '@retail/database';

// Mock PrismaClient
const mockPrismaClient = {
  stockTransfer: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  location: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  product: {
    findFirst: jest.fn(),
  },
  stock: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    fields: {
      minQuantity: 'minQuantity',
    },
  },
  stockTransferItem: {
    update: jest.fn(),
  },
  stockMovement: {
    create: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrismaClient)),
};

describe('StockTransfersService', () => {
  let service: StockTransfersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockTransfersService,
        {
          provide: 'PRISMA',
          useValue: mockPrismaClient,
        },
      ],
    }).compile();

    service = module.get<StockTransfersService>(StockTransfersService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('generateTransferNumber', () => {
    it('should generate TRF-00001 for first transfer', async () => {
      mockPrismaClient.stockTransfer.findFirst.mockResolvedValue(null);

      const result = await service.generateTransferNumber('tenant-1');

      expect(result).toBe('TRF-00001');
      expect(mockPrismaClient.stockTransfer.findFirst).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { createdAt: 'desc' },
        select: { transferNumber: true },
      });
    });

    it('should increment transfer number correctly', async () => {
      mockPrismaClient.stockTransfer.findFirst.mockResolvedValue({
        transferNumber: 'TRF-00042',
      });

      const result = await service.generateTransferNumber('tenant-1');

      expect(result).toBe('TRF-00043');
    });

    it('should pad numbers correctly', async () => {
      mockPrismaClient.stockTransfer.findFirst.mockResolvedValue({
        transferNumber: 'TRF-00009',
      });

      const result = await service.generateTransferNumber('tenant-1');

      expect(result).toBe('TRF-00010');
    });
  });

  describe('createTransfer', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const fromLocationId = 'location-warehouse';
    const toLocationId = 'location-store';
    const productId = 'product-1';

    const validDto = {
      fromLocationId,
      toLocationId,
      items: [
        {
          productId,
          quantityRequested: 10,
          notes: 'Test item',
        },
      ],
      notes: 'Test transfer',
    };

    beforeEach(() => {
      // Mock location lookups
      mockPrismaClient.location.findFirst
        .mockResolvedValueOnce({
          id: fromLocationId,
          name: 'Warehouse',
          tenantId,
          isActive: true,
        })
        .mockResolvedValueOnce({
          id: toLocationId,
          name: 'Store 1',
          tenantId,
          isActive: true,
        });

      // Mock product lookup
      mockPrismaClient.product.findFirst.mockResolvedValue({
        id: productId,
        name: 'Test Product',
        sku: 'TEST-001',
        tenantId,
      });

      // Mock stock availability
      mockPrismaClient.stock.findFirst.mockResolvedValue({
        id: 'stock-1',
        productId,
        locationId: fromLocationId,
        quantity: 100,
      });

      // Mock transfer number generation
      mockPrismaClient.stockTransfer.findFirst.mockResolvedValue(null);

      // Mock transfer creation
      mockPrismaClient.stockTransfer.create.mockResolvedValue({
        id: 'transfer-1',
        transferNumber: 'TRF-00001',
        tenantId,
        fromLocationId,
        toLocationId,
        status: TransferStatus.PENDING,
        items: [
          {
            id: 'item-1',
            productId,
            quantityRequested: 10,
            product: {
              id: productId,
              name: 'Test Product',
              sku: 'TEST-001',
            },
          },
        ],
      });
    });

    it('should create a transfer successfully', async () => {
      // Mock getTransfer for final result
      const expectedTransfer = {
        id: 'transfer-1',
        transferNumber: 'TRF-00001',
        status: TransferStatus.PENDING,
        fromLocationId,
        toLocationId,
      };

      mockPrismaClient.stockTransfer.findFirst.mockResolvedValueOnce(expectedTransfer);

      const result = await service.createTransfer(tenantId, userId, validDto);

      expect(mockPrismaClient.stockTransfer.create).toHaveBeenCalled();
      expect(result).toEqual(expectedTransfer);
    });

    it('should throw BadRequestException if source and destination are the same', async () => {
      const invalidDto = {
        ...validDto,
        toLocationId: fromLocationId,
      };

      await expect(service.createTransfer(tenantId, userId, invalidDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createTransfer(tenantId, userId, invalidDto)).rejects.toThrow(
        'Source and destination locations must be different'
      );
    });

    it('should throw NotFoundException if source location not found', async () => {
      mockPrismaClient.location.findFirst
        .mockResolvedValueOnce(null) // Source location not found
        .mockResolvedValueOnce({ id: toLocationId }); // Destination exists

      await expect(service.createTransfer(tenantId, userId, validDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.createTransfer(tenantId, userId, validDto)).rejects.toThrow(
        'Source location not found'
      );
    });

    it('should throw NotFoundException if destination location not found', async () => {
      mockPrismaClient.location.findFirst
        .mockResolvedValueOnce({ id: fromLocationId }) // Source exists
        .mockResolvedValueOnce(null); // Destination not found

      await expect(service.createTransfer(tenantId, userId, validDto)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.createTransfer(tenantId, userId, validDto)).rejects.toThrow(
        'Destination location not found'
      );
    });

    it('should throw NotFoundException if product not found', async () => {
      mockPrismaClient.product.findFirst.mockResolvedValue(null);

      await expect(service.createTransfer(tenantId, userId, validDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw BadRequestException if insufficient stock', async () => {
      mockPrismaClient.stock.findFirst.mockResolvedValue({
        id: 'stock-1',
        quantity: 5, // Less than requested (10)
      });

      await expect(service.createTransfer(tenantId, userId, validDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.createTransfer(tenantId, userId, validDto)).rejects.toThrow(
        /Insufficient stock/
      );
    });

    it('should throw BadRequestException if product has no stock record', async () => {
      mockPrismaClient.stock.findFirst.mockResolvedValue(null);

      await expect(service.createTransfer(tenantId, userId, validDto)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('approveTransfer', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const transferId = 'transfer-1';

    const mockPendingTransfer = {
      id: transferId,
      status: TransferStatus.PENDING,
      fromLocationId: 'location-1',
      toLocationId: 'location-2',
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantityRequested: 10,
          product: {
            id: 'product-1',
            name: 'Test Product',
            sku: 'TEST-001',
          },
        },
      ],
    };

    beforeEach(() => {
      // Mock getTransfer
      mockPrismaClient.stockTransfer.findFirst.mockResolvedValue(mockPendingTransfer);

      // Mock stock availability check
      mockPrismaClient.stock.findFirst.mockResolvedValue({
        id: 'stock-1',
        quantity: 100,
      });

      // Mock update
      mockPrismaClient.stockTransfer.update.mockResolvedValue({
        ...mockPendingTransfer,
        status: TransferStatus.APPROVED,
      });
    });

    it('should approve a pending transfer successfully', async () => {
      const result = await service.approveTransfer(transferId, tenantId, userId);

      expect(mockPrismaClient.stockTransfer.update).toHaveBeenCalledWith({
        where: { id: transferId },
        data: expect.objectContaining({
          status: TransferStatus.APPROVED,
          approvedById: userId,
          approvedAt: expect.any(Date),
        }),
      });
    });

    it('should throw BadRequestException if transfer is not PENDING', async () => {
      mockPrismaClient.stockTransfer.findFirst.mockResolvedValue({
        ...mockPendingTransfer,
        status: TransferStatus.APPROVED,
      });

      await expect(service.approveTransfer(transferId, tenantId, userId)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.approveTransfer(transferId, tenantId, userId)).rejects.toThrow(
        /must be in PENDING status/
      );
    });

    it('should throw BadRequestException if stock became insufficient', async () => {
      mockPrismaClient.stock.findFirst.mockResolvedValue({
        id: 'stock-1',
        quantity: 5, // Insufficient
      });

      await expect(service.approveTransfer(transferId, tenantId, userId)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.approveTransfer(transferId, tenantId, userId)).rejects.toThrow(
        /Insufficient stock/
      );
    });

    it('should include notes in approval', async () => {
      const notes = 'Approved with conditions';
      await service.approveTransfer(transferId, tenantId, userId, { notes });

      expect(mockPrismaClient.stockTransfer.update).toHaveBeenCalledWith({
        where: { id: transferId },
        data: expect.objectContaining({
          notes,
        }),
      });
    });
  });

  describe('sendTransfer', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const transferId = 'transfer-1';

    const mockApprovedTransfer = {
      id: transferId,
      status: TransferStatus.APPROVED,
      fromLocationId: 'location-1',
      toLocationId: 'location-2',
      transferNumber: 'TRF-00001',
      fromLocation: { name: 'Warehouse' },
      toLocation: { name: 'Store 1' },
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantityRequested: 10,
          product: {
            id: 'product-1',
            name: 'Test Product',
            sku: 'TEST-001',
          },
        },
      ],
    };

    beforeEach(() => {
      // Mock getTransfer
      mockPrismaClient.stockTransfer.findFirst.mockResolvedValue(mockApprovedTransfer);

      // Mock stock availability in transaction
      mockPrismaClient.stock.findFirst.mockResolvedValue({
        id: 'stock-1',
        quantity: 100,
      });

      // Mock stock update
      mockPrismaClient.stock.update.mockResolvedValue({});

      // Mock stock movement creation
      mockPrismaClient.stockMovement.create.mockResolvedValue({});

      // Mock transfer item update
      mockPrismaClient.stockTransferItem.update.mockResolvedValue({});

      // Mock transfer update
      mockPrismaClient.stockTransfer.update.mockResolvedValue({
        ...mockApprovedTransfer,
        status: TransferStatus.IN_TRANSIT,
      });
    });

    it('should send an approved transfer and create stock movements', async () => {
      await service.sendTransfer(transferId, tenantId, userId);

      // Verify stock was decremented
      expect(mockPrismaClient.stock.update).toHaveBeenCalledWith({
        where: { id: 'stock-1' },
        data: {
          quantity: { decrement: 10 },
        },
      });

      // Verify TRANSFER_OUT movement was created
      expect(mockPrismaClient.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: StockMovementType.TRANSFER_OUT,
          quantity: -10,
          locationId: 'location-1',
          transferId,
        }),
      });

      // Verify transfer status updated
      expect(mockPrismaClient.stockTransfer.update).toHaveBeenCalledWith({
        where: { id: transferId },
        data: expect.objectContaining({
          status: TransferStatus.IN_TRANSIT,
          sentById: userId,
          sentAt: expect.any(Date),
        }),
      });

      // Verify item quantity was updated
      expect(mockPrismaClient.stockTransferItem.update).toHaveBeenCalledWith({
        where: { id: 'item-1' },
        data: { quantitySent: 10 },
      });
    });

    it('should throw BadRequestException if transfer is not APPROVED', async () => {
      mockPrismaClient.stockTransfer.findFirst.mockResolvedValue({
        ...mockApprovedTransfer,
        status: TransferStatus.PENDING,
      });

      await expect(service.sendTransfer(transferId, tenantId, userId)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.sendTransfer(transferId, tenantId, userId)).rejects.toThrow(
        /must be in APPROVED status/
      );
    });

    it('should support custom sent quantities', async () => {
      const sendDto = {
        items: [
          {
            productId: 'product-1',
            quantitySent: 8, // Less than requested (10)
          },
        ],
      };

      await service.sendTransfer(transferId, tenantId, userId, sendDto);

      expect(mockPrismaClient.stock.update).toHaveBeenCalledWith({
        where: { id: 'stock-1' },
        data: {
          quantity: { decrement: 8 },
        },
      });
    });

    it('should include tracking information', async () => {
      const sendDto = {
        trackingNumber: 'TRACK-123',
        shippingMethod: 'Express',
      };

      await service.sendTransfer(transferId, tenantId, userId, sendDto);

      expect(mockPrismaClient.stockTransfer.update).toHaveBeenCalledWith({
        where: { id: transferId },
        data: expect.objectContaining({
          trackingNumber: 'TRACK-123',
          shippingMethod: 'Express',
        }),
      });
    });
  });

  describe('receiveTransfer', () => {
    const tenantId = 'tenant-1';
    const userId = 'user-1';
    const transferId = 'transfer-1';

    const mockInTransitTransfer = {
      id: transferId,
      status: TransferStatus.IN_TRANSIT,
      fromLocationId: 'location-1',
      toLocationId: 'location-2',
      transferNumber: 'TRF-00001',
      fromLocation: { name: 'Warehouse' },
      toLocation: { name: 'Store 1' },
      items: [
        {
          id: 'item-1',
          productId: 'product-1',
          quantityRequested: 10,
          quantitySent: 10,
          product: {
            id: 'product-1',
            name: 'Test Product',
            sku: 'TEST-001',
          },
        },
      ],
    };

    beforeEach(() => {
      // Mock getTransfer
      mockPrismaClient.stockTransfer.findFirst.mockResolvedValue(mockInTransitTransfer);

      // Mock existing stock at destination
      mockPrismaClient.stock.findFirst.mockResolvedValue({
        id: 'stock-2',
        quantity: 50,
      });

      // Mock stock update
      mockPrismaClient.stock.update.mockResolvedValue({});

      // Mock stock movement creation
      mockPrismaClient.stockMovement.create.mockResolvedValue({});

      // Mock transfer item update
      mockPrismaClient.stockTransferItem.update.mockResolvedValue({});

      // Mock transfer update
      mockPrismaClient.stockTransfer.update.mockResolvedValue({
        ...mockInTransitTransfer,
        status: TransferStatus.RECEIVED,
      });
    });

    it('should receive a transfer and create stock movements', async () => {
      await service.receiveTransfer(transferId, tenantId, userId);

      // Verify stock was incremented
      expect(mockPrismaClient.stock.update).toHaveBeenCalledWith({
        where: { id: 'stock-2' },
        data: {
          quantity: { increment: 10 },
        },
      });

      // Verify TRANSFER_IN movement was created
      expect(mockPrismaClient.stockMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: StockMovementType.TRANSFER_IN,
          quantity: 10,
          locationId: 'location-2',
          transferId,
        }),
      });

      // Verify transfer status updated
      expect(mockPrismaClient.stockTransfer.update).toHaveBeenCalledWith({
        where: { id: transferId },
        data: expect.objectContaining({
          status: TransferStatus.RECEIVED,
          receivedById: userId,
          receivedAt: expect.any(Date),
        }),
      });
    });

    it('should create stock record if it does not exist at destination', async () => {
      mockPrismaClient.stock.findFirst.mockResolvedValue(null);
      mockPrismaClient.stock.create.mockResolvedValue({
        id: 'stock-new',
        quantity: 0,
      });

      await service.receiveTransfer(transferId, tenantId, userId);

      expect(mockPrismaClient.stock.create).toHaveBeenCalledWith({
        data: {
          tenantId,
          productId: 'product-1',
          locationId: 'location-2',
          quantity: 0,
          minQuantity: 0,
        },
      });
    });

    it('should throw BadRequestException if transfer is not IN_TRANSIT', async () => {
      mockPrismaClient.stockTransfer.findFirst.mockResolvedValue({
        ...mockInTransitTransfer,
        status: TransferStatus.APPROVED,
      });

      await expect(service.receiveTransfer(transferId, tenantId, userId)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.receiveTransfer(transferId, tenantId, userId)).rejects.toThrow(
        /must be in IN_TRANSIT status/
      );
    });

    it('should support custom received quantities', async () => {
      const receiveDto = {
        items: [
          {
            productId: 'product-1',
            quantityReceived: 9, // Less than sent (damaged/lost)
          },
        ],
      };

      await service.receiveTransfer(transferId, tenantId, userId, receiveDto);

      expect(mockPrismaClient.stock.update).toHaveBeenCalledWith({
        where: { id: 'stock-2' },
        data: {
          quantity: { increment: 9 },
        },
      });
    });
  });

  describe('getRestockSuggestions', () => {
    const tenantId = 'tenant-1';
    const locationId = 'location-store';

    const mockLocation = {
      id: locationId,
      name: 'Store 1',
      code: 'ST01',
      tenantId,
      isActive: true,
    };

    beforeEach(() => {
      mockPrismaClient.location.findFirst.mockResolvedValue(mockLocation);
    });

    it('should return empty suggestions if no low stock items', async () => {
      mockPrismaClient.stock.findMany.mockResolvedValue([]);

      const result = await service.getRestockSuggestions(locationId, tenantId);

      expect(result.suggestions).toEqual([]);
      expect(result.location).toEqual({
        id: locationId,
        name: 'Store 1',
        code: 'ST01',
      });
    });

    it('should find restock suggestions for low stock items', async () => {
      const lowStockItems = [
        {
          id: 'stock-1',
          productId: 'product-1',
          locationId,
          quantity: 5,
          minQuantity: 20,
          product: {
            id: 'product-1',
            name: 'Product A',
            sku: 'SKU-A',
          },
        },
      ];

      const availableStock = [
        {
          id: 'stock-2',
          productId: 'product-1',
          quantity: 100,
          location: {
            id: 'warehouse-1',
            name: 'Main Warehouse',
            code: 'WH01',
            type: 'WAREHOUSE',
            isWarehouse: true,
          },
        },
        {
          id: 'stock-3',
          productId: 'product-1',
          quantity: 30,
          location: {
            id: 'store-2',
            name: 'Store 2',
            code: 'ST02',
            type: 'STORE',
            isWarehouse: false,
          },
        },
      ];

      mockPrismaClient.stock.findMany
        .mockResolvedValueOnce(lowStockItems) // Low stock query
        .mockResolvedValueOnce(availableStock); // Available stock query

      const result = await service.getRestockSuggestions(locationId, tenantId);

      expect(result.suggestions).toHaveLength(1);
      expect(result.suggestions[0]).toEqual({
        product: {
          id: 'product-1',
          name: 'Product A',
          sku: 'SKU-A',
        },
        currentQuantity: 5,
        minQuantity: 20,
        neededQuantity: 15,
        suggestedSources: [
          {
            locationId: 'warehouse-1',
            locationName: 'Main Warehouse',
            locationCode: 'WH01',
            availableQuantity: 100,
            isWarehouse: true,
          },
          {
            locationId: 'store-2',
            locationName: 'Store 2',
            locationCode: 'ST02',
            availableQuantity: 30,
            isWarehouse: false,
          },
        ],
      });
    });

    it('should prioritize warehouses in suggestions', async () => {
      const lowStockItems = [
        {
          id: 'stock-1',
          productId: 'product-1',
          locationId,
          quantity: 0,
          minQuantity: 10,
          product: {
            id: 'product-1',
            name: 'Product A',
            sku: 'SKU-A',
          },
        },
      ];

      mockPrismaClient.stock.findMany
        .mockResolvedValueOnce(lowStockItems)
        .mockResolvedValueOnce([
          {
            id: 'stock-2',
            quantity: 50,
            location: {
              id: 'warehouse-1',
              name: 'Warehouse',
              code: 'WH01',
              isWarehouse: true,
            },
          },
        ]);

      await service.getRestockSuggestions(locationId, tenantId);

      // Verify query prioritizes warehouses
      expect(mockPrismaClient.stock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ location: { isWarehouse: 'desc' } }, { quantity: 'desc' }],
        })
      );
    });

    it('should throw NotFoundException if location not found', async () => {
      mockPrismaClient.location.findFirst.mockResolvedValue(null);

      await expect(service.getRestockSuggestions(locationId, tenantId)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should exclude the target location from suggestions', async () => {
      const lowStockItems = [
        {
          id: 'stock-1',
          productId: 'product-1',
          locationId,
          quantity: 5,
          minQuantity: 20,
          product: {
            id: 'product-1',
            name: 'Product A',
            sku: 'SKU-A',
          },
        },
      ];

      mockPrismaClient.stock.findMany
        .mockResolvedValueOnce(lowStockItems)
        .mockResolvedValueOnce([]);

      await service.getRestockSuggestions(locationId, tenantId);

      // Verify available stock query excludes current location
      expect(mockPrismaClient.stock.findMany).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          where: expect.objectContaining({
            locationId: { not: locationId },
          }),
        })
      );
    });
  });

  describe('getTransferStats', () => {
    const tenantId = 'tenant-1';

    beforeEach(() => {
      mockPrismaClient.stockTransfer.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(10) // pending
        .mockResolvedValueOnce(5) // approved
        .mockResolvedValueOnce(8) // inTransit
        .mockResolvedValueOnce(70) // received
        .mockResolvedValueOnce(5) // cancelled
        .mockResolvedValueOnce(2); // rejected
    });

    it('should return transfer statistics', async () => {
      const result = await service.getTransferStats(tenantId);

      expect(result).toEqual({
        totalTransfers: 100,
        byStatus: {
          pending: 10,
          approved: 5,
          inTransit: 8,
          received: 70,
          cancelled: 5,
          rejected: 2,
        },
      });
    });

    it('should filter by location if provided', async () => {
      const locationId = 'location-1';

      await service.getTransferStats(tenantId, locationId);

      // Verify count was called with OR condition
      expect(mockPrismaClient.stockTransfer.count).toHaveBeenCalledWith({
        where: {
          tenantId,
          OR: [{ fromLocationId: locationId }, { toLocationId: locationId }],
        },
      });
    });
  });
});
