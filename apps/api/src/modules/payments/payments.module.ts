import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { WebhooksController } from './webhooks.controller';
import { PaymentsService } from './payments.service';
import { MercadoPagoService } from './providers/mercadopago/mercadopago.service';

@Module({
  imports: [ConfigModule],
  controllers: [PaymentsController, WebhooksController],
  providers: [PaymentsService, MercadoPagoService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
