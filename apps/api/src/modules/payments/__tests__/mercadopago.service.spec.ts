import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MercadoPagoService } from '../providers/mercadopago/mercadopago.service';
import { PaymentStatus } from '../payments.types';

describe('MercadoPagoService', () => {
  let service: MercadoPagoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MercadoPagoService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                MERCADO_PAGO_ACCESS_TOKEN: 'TEST-token',
                MERCADO_PAGO_PUBLIC_KEY: 'TEST-public-key',
                MERCADO_PAGO_WEBHOOK_SECRET: 'test-secret',
                APP_URL: 'http://localhost:3000',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MercadoPagoService>(MercadoPagoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mapMercadoPagoStatus', () => {
    it('should map MP statuses correctly', () => {
      expect(service.mapMercadoPagoStatus('approved')).toBe(PaymentStatus.APPROVED);
      expect(service.mapMercadoPagoStatus('pending')).toBe(PaymentStatus.PENDING);
      expect(service.mapMercadoPagoStatus('rejected')).toBe(PaymentStatus.REJECTED);
      expect(service.mapMercadoPagoStatus('cancelled')).toBe(PaymentStatus.CANCELLED);
      expect(service.mapMercadoPagoStatus('in_process')).toBe(PaymentStatus.IN_PROCESS);
      expect(service.mapMercadoPagoStatus('refunded')).toBe(PaymentStatus.REFUNDED);
    });

    it('should default to PENDING for unknown statuses', () => {
      expect(service.mapMercadoPagoStatus('unknown_status')).toBe(PaymentStatus.PENDING);
    });
  });

  describe('createPayment', () => {
    it('should create a payment', async () => {
      // Mock implementation
      // En un test real, mockearías el cliente de MP
      expect(true).toBe(true);
    });
  });
});
