import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from '../payments.service';
import { MercadoPagoService } from '../providers/mercadopago/mercadopago.service';
import { PrismaClient } from '@retail/database';
import { PaymentMethod, PaymentStatus } from '../payments.types';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let mercadoPagoService: MercadoPagoService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: MercadoPagoService,
          useValue: {
            createPayment: jest.fn().mockResolvedValue({
              id: 123456789,
              status: 'approved',
              transaction_amount: 1000,
              external_reference: 'sale-123',
            }),
            mapMercadoPagoStatus: jest.fn((status) => {
              const map = {
                approved: PaymentStatus.APPROVED,
                pending: PaymentStatus.PENDING,
                rejected: PaymentStatus.REJECTED,
              };
              return map[status] || PaymentStatus.PENDING;
            }),
          },
        },
        {
          provide: 'PRISMA',
          useValue: {
            sale: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            payment: {
              create: jest.fn(),
              update: jest.fn(),
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    mercadoPagoService = module.get<MercadoPagoService>(MercadoPagoService);
    prisma = module.get('PRISMA');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPayment - Cash', () => {
    it('should approve cash payments immediately', async () => {
      const mockSale = {
        id: 'sale-1',
        tenantId: 'tenant-1',
        saleNumber: 'V-00001',
        totalCents: 100000,
        status: 'pending',
      };

      jest.spyOn(prisma.sale, 'findUnique').mockResolvedValue(mockSale as any);
      jest.spyOn(prisma.payment, 'create').mockResolvedValue({
        id: 'payment-1',
        status: PaymentStatus.PENDING,
      } as any);
      jest.spyOn(prisma.payment, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.sale, 'update').mockResolvedValue({} as any);

      const result = await service.createPayment('tenant-1', {
        saleId: 'sale-1',
        method: PaymentMethod.CASH,
        amountCents: 100000,
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(PaymentStatus.APPROVED);
      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PaymentStatus.APPROVED,
          }),
        })
      );
    });
  });

  describe('createPayment - Mercado Pago', () => {
    it('should create MP payment and update status', async () => {
      const mockSale = {
        id: 'sale-1',
        tenantId: 'tenant-1',
        saleNumber: 'V-00001',
        totalCents: 100000,
        status: 'pending',
      };

      jest.spyOn(prisma.sale, 'findUnique').mockResolvedValue(mockSale as any);
      jest.spyOn(prisma.payment, 'create').mockResolvedValue({
        id: 'payment-1',
        status: PaymentStatus.PENDING,
      } as any);
      jest.spyOn(prisma.payment, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.sale, 'update').mockResolvedValue({} as any);

      const result = await service.createPayment('tenant-1', {
        saleId: 'sale-1',
        method: PaymentMethod.MERCADO_PAGO,
        amountCents: 100000,
        customerEmail: 'test@example.com',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe(PaymentStatus.APPROVED);
      expect(mercadoPagoService.createPayment).toHaveBeenCalled();
    });
  });

  describe('processWebhookNotification', () => {
    it('should process webhook and update payment status', async () => {
      const mockSale = {
        id: 'sale-1',
        tenantId: 'tenant-1',
      };

      const mockPayment = {
        id: 'payment-1',
        saleId: 'sale-1',
        externalId: '123456789',
        status: PaymentStatus.PENDING,
      };

      jest.spyOn(prisma.sale, 'findUnique').mockResolvedValue(mockSale as any);
      jest.spyOn(prisma.payment, 'findFirst').mockResolvedValue(mockPayment as any);
      jest.spyOn(prisma.payment, 'update').mockResolvedValue({} as any);
      jest.spyOn(prisma.sale, 'update').mockResolvedValue({} as any);

      jest.spyOn(mercadoPagoService, 'getPaymentInfo').mockResolvedValue({
        id: 123456789,
        status: 'approved',
        transaction_amount: 1000,
        external_reference: 'sale-1',
      } as any);

      await service.processWebhookNotification('123456789', 'payment');

      expect(prisma.payment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: PaymentStatus.APPROVED,
          }),
        })
      );
    });
  });
});
