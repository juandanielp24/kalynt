import { Injectable, Logger, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@retail/database';
import { WSFEv1Service } from './wsfev1/wsfev1.service';
import { WSAAService } from './wsaa/wsaa.service';
import {
  AFIP_INVOICE_TYPES,
  AFIP_DOCUMENT_TYPES,
  AFIP_CONCEPT_TYPES,
  AFIP_IVA_CODES,
} from '../constants/argentina.constants';
import { CuitValidator } from './utils/cuit-validator';
import { DateFormatter } from './utils/date-formatter';
import { InvoiceFormatter } from './utils/invoice-formatter';
import { InvoiceMapper } from './utils/invoice-mapper';
import { InvoiceRequest, InvoiceResponse, InvoiceInfo } from './wsfev1/wsfev1.types';

export interface GenerateInvoiceRequest {
  saleId: string;
  tenantId: string;
  invoiceType: 'A' | 'B' | 'C' | 'E';
  customerCuit?: string;
  customerName?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}

export interface AFIPInvoiceResponse {
  success: boolean;
  cae?: string;
  cae_vencimiento?: string;
  numero_comprobante?: number;
  resultado?: string;
  errors?: Array<{ code: number; message: string }>;
}

/**
 * AFIPService - Servicio principal (Orquestador)
 *
 * Maneja la lógica de negocio completa de facturación electrónica:
 * - Integración con base de datos (ventas)
 * - Generación de facturas para ventas
 * - Consulta de facturas
 * - Validaciones de negocio
 */
@Injectable()
export class AFIPService {
  private readonly logger = new Logger(AFIPService.name);

  constructor(
    @Inject('PRISMA') private prisma: PrismaClient,
    private configService: ConfigService,
    private wsfev1Service: WSFEv1Service,
    private wsaaService: WSAAService,
  ) {}

  /**
   * Genera una factura electrónica para una venta
   */
  async generateInvoiceForSale(request: GenerateInvoiceRequest): Promise<{
    success: boolean;
    cae?: string;
    caeExpiration?: string;
    invoiceNumber?: string;
    invoiceType?: string;
    afipResponse?: AFIPInvoiceResponse;
  }> {
    try {
      this.logger.log(`Generating invoice for sale ${request.saleId}`);

      // 1. Validar y obtener datos de la venta
      const sale = await this.prisma.sale.findUnique({
        where: { id: request.saleId },
        include: {
          tenant: true,
          items: true,
        },
      });

      if (!sale) {
        throw new BadRequestException('Sale not found');
      }

      if (sale.cae) {
        throw new BadRequestException('Invoice already generated for this sale');
      }

      // 2. Determinar tipo de comprobante
      const invoiceTypeCode = this.getInvoiceTypeCode(request.invoiceType);
      const puntoVenta = this.configService.get<number>('AFIP_PUNTO_VENTA', 1);

      // 3. Obtener próximo número de comprobante
      const lastNumber = await this.wsfev1Service.getLastInvoiceNumber(
        invoiceTypeCode,
        puntoVenta
      );
      const nextNumber = lastNumber + 1;

      this.logger.debug(`Next invoice number: ${nextNumber}`);

      // 4. Preparar datos para AFIP
      const afipRequest = await this.buildAFIPRequest(
        sale,
        request,
        invoiceTypeCode,
        puntoVenta,
        nextNumber
      );

      // 5. Enviar a AFIP
      const afipResponse = await this.wsfev1Service.generateInvoice(afipRequest);

      if (afipResponse.result !== 'A') {
        this.logger.error('AFIP invoice generation failed', afipResponse.errors);

        // Guardar error en la venta
        await this.prisma.sale.update({
          where: { id: request.saleId },
          data: {
            invoiceError: JSON.stringify(afipResponse.errors),
          },
        });

        return {
          success: false,
          afipResponse: {
            success: false,
            errors: afipResponse.errors,
          },
        };
      }

      // 6. Actualizar venta con datos de AFIP
      const invoiceNumber = InvoiceFormatter.formatInvoiceNumber(puntoVenta, afipResponse.invoiceNumber!);

      await this.prisma.sale.update({
        where: { id: request.saleId },
        data: {
          invoiceType: request.invoiceType,
          invoiceNumber,
          cae: afipResponse.cae,
          caeExpiration: this.parseAFIPDate(afipResponse.caeExpirationDate!),
          afipResponse: JSON.stringify(afipResponse),
        },
      });

      this.logger.log(`Invoice generated successfully: ${invoiceNumber}, CAE: ${afipResponse.cae}`);

      return {
        success: true,
        cae: afipResponse.cae,
        caeExpiration: afipResponse.caeExpirationDate,
        invoiceNumber,
        invoiceType: request.invoiceType,
        afipResponse: {
          success: true,
          cae: afipResponse.cae,
          cae_vencimiento: afipResponse.caeExpirationDate,
          numero_comprobante: afipResponse.invoiceNumber,
          resultado: afipResponse.result,
        },
      };
    } catch (error) {
      this.logger.error(`Error generating invoice for sale ${request.saleId}`, error);
      throw error;
    }
  }

  /**
   * Construye el request para AFIP basado en la venta
   */
  private async buildAFIPRequest(
    sale: any,
    request: GenerateInvoiceRequest,
    invoiceTypeCode: number,
    puntoVenta: number,
    numeroComprobante: number
  ): Promise<InvoiceRequest> {
    const today = DateFormatter.toAFIPFormat(new Date());

    // Determinar tipo y número de documento del cliente
    let tipoDocumento: number;
    let numeroDocumento: number;

    if (request.invoiceType === 'B' || request.invoiceType === 'C') {
      // Factura B/C: si no hay CUIT, usar Consumidor Final
      if (request.customerCuit && CuitValidator.validate(request.customerCuit)) {
        tipoDocumento = AFIP_DOCUMENT_TYPES.CUIT;
        numeroDocumento = parseInt(request.customerCuit.replace(/[-\s]/g, ''), 10);
      } else {
        tipoDocumento = AFIP_DOCUMENT_TYPES.CONSUMIDOR_FINAL;
        numeroDocumento = 0;
      }
    } else {
      // Factura A: CUIT obligatorio
      if (!request.customerCuit || !CuitValidator.validate(request.customerCuit)) {
        throw new BadRequestException('Valid CUIT required for Factura A');
      }
      tipoDocumento = AFIP_DOCUMENT_TYPES.CUIT;
      numeroDocumento = parseInt(request.customerCuit.replace(/[-\s]/g, ''), 10);
    }

    // Calcular importes
    const subtotal = request.subtotal;
    const tax = request.tax;
    const total = request.total;

    // Agrupar IVA por alícuota usando InvoiceMapper
    const ivaArray = [];
    if (tax > 0) {
      // Asumir IVA 21% por defecto (simplificado)
      // En producción, deberías calcular por cada alícuota usando request.items
      ivaArray.push({
        id: AFIP_IVA_CODES.IVA_21,
        baseAmount: subtotal,
        taxAmount: tax,
      });
    }

    return {
      concept: AFIP_CONCEPT_TYPES.PRODUCTOS,
      invoiceType: invoiceTypeCode,
      salePoint: puntoVenta,
      invoiceNumber: numeroComprobante,
      invoiceDate: today,
      docType: tipoDocumento,
      docNum: numeroDocumento,
      totalAmount: total,
      netAmount: subtotal,
      exemptAmount: 0,
      taxAmount: tax,
      untaxedAmount: 0,
      currency: 'PES',
      exchangeRate: 1,
      iva: ivaArray,
    };
  }

  /**
   * Obtiene el código numérico del tipo de factura
   */
  private getInvoiceTypeCode(type: string): number {
    const typeMap: Record<string, number> = {
      A: AFIP_INVOICE_TYPES.FACTURA_A,
      B: AFIP_INVOICE_TYPES.FACTURA_B,
      C: AFIP_INVOICE_TYPES.FACTURA_C,
      E: AFIP_INVOICE_TYPES.FACTURA_E,
    };

    const code = typeMap[type];
    if (!code) {
      throw new BadRequestException(`Invalid invoice type: ${type}`);
    }

    return code;
  }

  /**
   * Parsea una fecha en formato AFIP (YYYYMMDD) a Date
   */
  private parseAFIPDate(dateStr: string): Date {
    return DateFormatter.fromAFIPFormat(dateStr);
  }

  /**
   * Consulta información de una factura en AFIP
   */
  async getInvoiceInfo(tenantId: string, invoiceNumber: string): Promise<InvoiceInfo | null> {
    try {
      // Parsear número de factura (formato: 00001-00000123)
      const { salePoint, invoiceNumber: num } = InvoiceFormatter.parseInvoiceNumber(invoiceNumber);

      // Buscar en DB para obtener tipo de comprobante
      const sale = await this.prisma.sale.findFirst({
        where: {
          tenantId,
          invoiceNumber,
        },
      });

      if (!sale) {
        throw new BadRequestException('Invoice not found');
      }

      const tipoComprobante = this.getInvoiceTypeCode(sale.invoiceType!);

      // Consultar en AFIP
      const info = await this.wsfev1Service.queryInvoice({
        invoiceType: tipoComprobante,
        salePoint,
        invoiceNumber: num,
      });

      return info;
    } catch (error) {
      this.logger.error('Error querying invoice info', error);
      throw error;
    }
  }

  /**
   * Verifica el estado del servidor AFIP
   */
  async checkStatus(): Promise<{
    connected: boolean;
    environment: string;
    servers: {
      app: string;
      db: string;
      auth: string;
    };
  }> {
    try {
      const status = await this.wsfev1Service.getServerStatus();
      const isProduction = this.configService.get('AFIP_ENVIRONMENT') === 'production';

      return {
        connected: true,
        environment: isProduction ? 'production' : 'testing',
        servers: {
          app: status.appServer,
          db: status.dbServer,
          auth: status.authServer,
        },
      };
    } catch (error) {
      this.logger.error('AFIP connection check failed', error);
      return {
        connected: false,
        environment: this.configService.get('AFIP_ENVIRONMENT') === 'production' ? 'production' : 'testing',
        servers: {
          app: 'ERROR',
          db: 'ERROR',
          auth: 'ERROR',
        },
      };
    }
  }

  /**
   * Anula una factura (genera nota de crédito)
   */
  async annulInvoice(tenantId: string, saleId: string, reason: string) {
    // TODO: Implementar generación de nota de crédito
    // Similar a generateInvoiceForSale pero con tipo NOTA_CREDITO_X
    this.logger.warn('Invoice annulment not implemented yet');
    throw new Error('Not implemented');
  }

  /**
   * Obtiene el próximo número disponible para un tipo de comprobante
   */
  async getNextInvoiceNumber(invoiceType: string): Promise<string> {
    const invoiceTypeCode = this.getInvoiceTypeCode(invoiceType);
    const puntoVenta = this.configService.get<number>('AFIP_PUNTO_VENTA', 1);

    const lastNumber = await this.wsfev1Service.getLastInvoiceNumber(
      invoiceTypeCode,
      puntoVenta
    );

    const nextNumber = lastNumber + 1;
    return InvoiceFormatter.formatInvoiceNumber(puntoVenta, nextNumber);
  }

  /**
   * Formatea un número de factura
   */
  formatInvoiceNumber(salePoint: number, invoiceNumber: number): string {
    return InvoiceFormatter.formatInvoiceNumber(salePoint, invoiceNumber);
  }

  /**
   * Obtiene la fecha actual en formato AFIP
   */
  getCurrentAFIPDate(): string {
    return DateFormatter.toAFIPFormat();
  }

  /**
   * Limpia las credenciales en caché (útil para testing)
   */
  clearCache(): void {
    this.wsaaService.clearCredentials();
    this.logger.debug('AFIP cache cleared');
  }
}
