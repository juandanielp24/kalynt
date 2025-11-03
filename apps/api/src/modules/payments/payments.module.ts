import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MercadoPagoProvider } from './providers/mercadopago.provider';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MercadoPagoProvider],
  exports: [PaymentsService, MercadoPagoProvider],
})
export class PaymentsModule {}
