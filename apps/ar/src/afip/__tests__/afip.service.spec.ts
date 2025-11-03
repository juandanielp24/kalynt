import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { AFIPService } from '../afip.service';
import { WSFEv1Service } from '../wsfev1/wsfev1.service';
import { WSAAService } from '../wsaa/wsaa.service';
import { PrismaClient } from '@retail/database';

describe('AFIPService', () => {
  let service: AFIPService;
  let wsfev1Service: WSFEv1Service;
  let wsaaService: WSAAService;
  let prisma: PrismaClient;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        AFIP_CUIT: '20409378472',
        AFIP_ENVIRONMENT: 'testing',
        AFIP_PUNTO_VENTA: 1,
        AFIP_CERT_PATH: './certs/cert-test.pem',
        AFIP_KEY_PATH: './certs/key-test.pem',
      };
      return config[key] !== undefined ? config[key] : defaultValue;
    }),
  };

  const mockWSFEv1Service = {
    getLastInvoiceNumber: jest.fn(),
    generateInvoice: jest.fn(),
    queryInvoice: jest.fn(),
    getServerStatus: jest.fn(),
  };

  const mockWSAAService = {
    getCredentials: jest.fn(),
    clearCredentials: jest.fn(),
  };

  const mockPrismaClient = {
    sale: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AFIPService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: WSFEv1Service,
          useValue: mockWSFEv1Service,
        },
        {
          provide: WSAAService,
          useValue: mockWSAAService,
        },
        {
          provide: 'PRISMA',
          useValue: mockPrismaClient,
        },
      ],
    }).compile();

    service = module.get<AFIPService>(AFIPService);
    wsfev1Service = module.get<WSFEv1Service>(WSFEv1Service);
    wsaaService = module.get<WSAAService>(WSAAService);
    prisma = module.get('PRISMA');

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkStatus', () => {
    it('should return AFIP server status successfully', async () => {
      mockWSFEv1Service.getServerStatus.mockResolvedValue({
        appServer: 'OK',
        dbServer: 'OK',
        authServer: 'OK',
      });

      const result = await service.checkStatus();

      expect(result.connected).toBe(true);
      expect(result.environment).toBe('testing');
      expect(result.servers.app).toBe('OK');
      expect(result.servers.db).toBe('OK');
      expect(result.servers.auth).toBe('OK');
    });

    it('should handle connection errors gracefully', async () => {
      mockWSFEv1Service.getServerStatus.mockRejectedValue(new Error('Connection failed'));

      const result = await service.checkStatus();

      expect(result.connected).toBe(false);
      expect(result.servers.app).toBe('ERROR');
    });
  });

  describe('generateInvoiceForSale', () => {
    const mockSale = {
      id: 'sale-123',
      saleNumber: 'V-00001',
      tenantId: 'tenant-123',
      subtotalCents: 100000,
      taxCents: 21000,
      totalCents: 121000,
      cae: null,
      invoiceType: null,
      invoiceNumber: null,
      tenant: {
        cuit: '20409378472',
      },
      items: [
        {
          id: 'item-1',
          productName: 'Test Product',
          quantity: 1,
          unitPriceCents: 100000,
          totalCents: 100000,
        },
      ],
    };

    it('should generate invoice successfully for Factura B', async () => {
      mockPrismaClient.sale.findUnique.mockResolvedValue(mockSale);
      mockWSFEv1Service.getLastInvoiceNumber.mockResolvedValue(100);
      mockWSFEv1Service.generateInvoice.mockResolvedValue({
        result: 'A',
        cae: '12345678901234',
        caeExpirationDate: '20250125',
        invoiceNumber: 101,
        errors: [],
      });
      mockPrismaClient.sale.update.mockResolvedValue({});

      const result = await service.generateInvoiceForSale({
        saleId: 'sale-123',
        tenantId: 'tenant-123',
        invoiceType: 'B',
        items: [],
        subtotal: 1000,
        tax: 210,
        total: 1210,
      });

      expect(result.success).toBe(true);
      expect(result.cae).toBe('12345678901234');
      expect(result.invoiceNumber).toBe('00001-00000101');
      expect(mockWSFEv1Service.generateInvoice).toHaveBeenCalled();
      expect(mockPrismaClient.sale.update).toHaveBeenCalled();
    });

    it('should throw error if sale not found', async () => {
      mockPrismaClient.sale.findUnique.mockResolvedValue(null);

      await expect(
        service.generateInvoiceForSale({
          saleId: 'non-existent',
          tenantId: 'tenant-123',
          invoiceType: 'B',
          items: [],
          subtotal: 1000,
          tax: 210,
          total: 1210,
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if invoice already generated', async () => {
      mockPrismaClient.sale.findUnique.mockResolvedValue({
        ...mockSale,
        cae: '12345678901234',
      });

      await expect(
        service.generateInvoiceForSale({
          saleId: 'sale-123',
          tenantId: 'tenant-123',
          invoiceType: 'B',
          items: [],
          subtotal: 1000,
          tax: 210,
          total: 1210,
        })
      ).rejects.toThrow('Invoice already generated for this sale');
    });

    it('should handle AFIP rejection', async () => {
      mockPrismaClient.sale.findUnique.mockResolvedValue(mockSale);
      mockWSFEv1Service.getLastInvoiceNumber.mockResolvedValue(100);
      mockWSFEv1Service.generateInvoice.mockResolvedValue({
        result: 'R',
        errors: [{ code: 10048, message: 'CUIT invalido' }],
      });
      mockPrismaClient.sale.update.mockResolvedValue({});

      const result = await service.generateInvoiceForSale({
        saleId: 'sale-123',
        tenantId: 'tenant-123',
        invoiceType: 'B',
        items: [],
        subtotal: 1000,
        tax: 210,
        total: 1210,
      });

      expect(result.success).toBe(false);
      expect(result.afipResponse?.errors).toBeDefined();
      expect(mockPrismaClient.sale.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sale-123' },
          data: expect.objectContaining({
            invoiceError: expect.any(String),
          }),
        })
      );
    });

    it('should require CUIT for Factura A', async () => {
      mockPrismaClient.sale.findUnique.mockResolvedValue(mockSale);
      mockWSFEv1Service.getLastInvoiceNumber.mockResolvedValue(100);

      await expect(
        service.generateInvoiceForSale({
          saleId: 'sale-123',
          tenantId: 'tenant-123',
          invoiceType: 'A',
          // No customerCuit provided
          items: [],
          subtotal: 1000,
          tax: 210,
          total: 1210,
        })
      ).rejects.toThrow('Valid CUIT required for Factura A');
    });
  });

  describe('getNextInvoiceNumber', () => {
    it('should return next invoice number formatted', async () => {
      mockWSFEv1Service.getLastInvoiceNumber.mockResolvedValue(99);

      const result = await service.getNextInvoiceNumber('B');

      expect(result).toBe('00001-00000100');
    });
  });

  describe('clearCache', () => {
    it('should clear credentials cache', () => {
      service.clearCache();

      expect(mockWSAAService.clearCredentials).toHaveBeenCalled();
    });
  });
});
