import { Controller, Post, Get, Body, Query, Logger } from '@nestjs/common';
import { AFIPService } from './afip.service';
import {
  GenerateInvoiceDto,
  GetLastInvoiceNumberDto,
  InvoiceQueryDto,
} from './dto';

/**
 * AFIPController - REST endpoints para operaciones con AFIP
 */
@Controller('afip')
export class AFIPController {
  private readonly logger = new Logger(AFIPController.name);

  constructor(private afipService: AFIPService) {}

  /**
   * GET /afip/status
   * Verifica el estado de los servidores de AFIP
   */
  @Get('status')
  async getServerStatus() {
    this.logger.debug('GET /afip/status');
    return this.afipService.checkServerStatus();
  }

  /**
   * GET /afip/last-invoice-number
   * Obtiene el último número de comprobante autorizado
   *
   * Query params:
   * - invoiceType: number
   * - salePoint: number
   */
  @Get('last-invoice-number')
  async getLastInvoiceNumber(@Query() dto: GetLastInvoiceNumberDto) {
    this.logger.debug(`GET /afip/last-invoice-number - Type: ${dto.invoiceType}, Point: ${dto.salePoint}`);

    const lastNumber = await this.afipService.getLastInvoiceNumber(dto);

    return {
      invoiceType: dto.invoiceType,
      salePoint: dto.salePoint,
      lastNumber,
      nextNumber: lastNumber + 1,
    };
  }

  /**
   * POST /afip/generate-invoice
   * Genera una factura electrónica en AFIP
   */
  @Post('generate-invoice')
  async generateInvoice(@Body() dto: GenerateInvoiceDto) {
    this.logger.log(`POST /afip/generate-invoice - Type: ${dto.invoiceType}, Point: ${dto.salePoint}`);

    const response = await this.afipService.generateInvoice(dto);

    return {
      success: response.result === 'A',
      data: response,
      formattedNumber: this.afipService.formatInvoiceNumber(dto.salePoint, dto.invoiceNumber),
    };
  }

  /**
   * GET /afip/query-invoice
   * Consulta información de un comprobante
   *
   * Query params:
   * - invoiceType: number
   * - salePoint: number
   * - invoiceNumber: number
   */
  @Get('query-invoice')
  async queryInvoice(@Query() dto: InvoiceQueryDto) {
    this.logger.debug(`GET /afip/query-invoice - Type: ${dto.invoiceType}, Point: ${dto.salePoint}, Number: ${dto.invoiceNumber}`);

    const invoice = await this.afipService.queryInvoice(dto);

    if (!invoice) {
      return {
        found: false,
        message: 'Invoice not found in AFIP',
      };
    }

    return {
      found: true,
      data: invoice,
      formattedNumber: this.afipService.formatInvoiceNumber(dto.salePoint, dto.invoiceNumber),
    };
  }

  /**
   * POST /afip/clear-cache
   * Limpia las credenciales en caché (útil para testing)
   */
  @Post('clear-cache')
  async clearCache() {
    this.logger.log('POST /afip/clear-cache');
    this.afipService.clearCache();

    return {
      success: true,
      message: 'AFIP credentials cache cleared',
    };
  }

  /**
   * GET /afip/current-date
   * Obtiene la fecha actual en formato AFIP (YYYYMMDD)
   */
  @Get('current-date')
  getCurrentDate() {
    const afipDate = this.afipService.getCurrentAFIPDate();

    return {
      afipFormat: afipDate,
      humanFormat: `${afipDate.slice(0, 4)}-${afipDate.slice(4, 6)}-${afipDate.slice(6, 8)}`,
    };
  }
}
