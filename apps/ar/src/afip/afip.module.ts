import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WSAAService } from './wsaa/wsaa.service';
import { WSFEv1Service } from './wsfev1/wsfev1.service';
import { AFIPService } from './afip.service';
import { AFIPController } from './afip.controller';

/**
 * AFIPModule - Módulo de integración con AFIP
 *
 * Proporciona servicios para:
 * - Autenticación con AFIP (WSAA)
 * - Facturación electrónica (WSFEv1)
 * - Consulta de comprobantes
 * - Validaciones y utilidades
 *
 * @example
 * // En AppModule:
 * imports: [
 *   AFIPModule,
 *   // ... otros módulos
 * ]
 *
 * // En un servicio:
 * constructor(private afipService: AFIPService) {}
 *
 * const response = await this.afipService.generateInvoice(invoiceDto);
 */
@Module({
  imports: [ConfigModule],
  controllers: [AFIPController],
  providers: [WSAAService, WSFEv1Service, AFIPService],
  exports: [AFIPService],
})
export class AFIPModule {}
