import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Afip from '@afipsdk/afip.js';
import { PrismaClient } from '@retail/database';
import {
  AFIPConfig,
  AFIPInvoiceData,
  AFIPInvoiceResponse,
  AFIPInvoiceType,
  AFIPDocumentType,
  AFIPConceptType,
  AFIPIVACode,
  InvoiceGenerationRequest,
  AFIPServerStatus,
  SalesPoint,
} from './afip.types';
import { getAFIPConfig, validateAFIPConfig } from './afip.config';
import { validateCUIT } from './utils/cuit-validator';
import { calculateIVA, getIVACodeFromRate } from './utils/iva-calculator';
import { formatInvoiceNumber, generateInvoiceQRData } from './utils/invoice-number';
import * as fs from 'fs';

@Injectable()
export class AFIPService {
  private readonly logger = new Logger(AFIPService.name);
  private afip: any;
  private config: AFIPConfig;
  private initialized = false;

  constructor(
    private configService: ConfigService,
    @Inject('PRISMA') private prisma: PrismaClient
  ) {
    try {
      this.config = getAFIPConfig(configService);
      validateAFIPConfig(this.config);

      // Solo inicializar si existen los certificados
      if (fs.existsSync(this.config.certPath) && fs.existsSync(this.config.keyPath)) {
        this.afip = new Afip({
          CUIT: this.config.cuit,
          cert: this.config.certPath,
          key: this.config.keyPath,
          production: this.config.production,
        });

        this.initialized = true;

        this.logger.log(
          `AFIP Service initialized for CUIT ${this.config.cuit} (${
            this.config.production ? 'PRODUCTION' : 'TESTING'
          })`
        );
      } else {
        this.logger.warn(
          'AFIP certificates not found. Service will be limited. ' +
          'Generate certificates following docs/argentina/AFIP-setup-guide.md'
        );
      }
    } catch (error) {
      this.logger.error('Error initializing AFIP service', error);
      throw error;
    }
  }

  /**
   * Verifica que el servicio esté inicializado
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'AFIP service not initialized. Please configure certificates.'
      );
    }
  }

  /**
   * Genera una factura electrónica en AFIP
   */
  async generateInvoice(
    request: InvoiceGenerationRequest
  ): Promise<AFIPInvoiceResponse> {
    this.ensureInitialized();

    try {
      // 1. Obtener tenant y validar configuración AFIP
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: request.tenantId },
      });

      if (!tenant) {
        throw new Error('Tenant not found');
      }

      if (!tenant.cuit) {
        throw new Error('Tenant CUIT not configured');
      }

      // 2. Determinar tipo de comprobante AFIP según tipo de factura
      const tipoComprobante = this.mapInvoiceType(request.invoiceType);

      // 3. Obtener último número de comprobante
      const lastInvoiceNumber = await this.getLastInvoiceNumber(
        tipoComprobante,
        this.config.puntoVenta
      );
      const nextInvoiceNumber = lastInvoiceNumber + 1;

      // 4. Preparar datos del comprobante
      const invoiceData = this.prepareInvoiceData(
        request,
        tipoComprobante,
        nextInvoiceNumber
      );

      // 5. Enviar a AFIP
      this.logger.log(
        `Sending invoice to AFIP: Type ${tipoComprobante}, Number ${nextInvoiceNumber}`
      );

      const response = await this.afip.ElectronicBilling.createVoucher(invoiceData);

      // 6. Guardar transacción para auditoría
      await this.saveAFIPTransaction(request.saleId, {
        request: invoiceData,
        response,
      });

      // 7. Procesar respuesta
      if (response.CAE) {
        this.logger.log(`Invoice approved. CAE: ${response.CAE}`);

        // Generar QR code
        const qrData = generateInvoiceQRData({
          cuit: this.config.cuit,
          pointOfSale: this.config.puntoVenta,
          invoiceType: tipoComprobante,
          invoiceNumber: nextInvoiceNumber,
          total: request.total / 100,
          currency: 'PES',
          cae: response.CAE,
          caeExpiration: response.CAEFchVto,
          documentType: invoiceData.tipo_documento,
          documentNumber: invoiceData.numero_documento,
        });

        return {
          success: true,
          cae: response.CAE,
          cae_vencimiento: response.CAEFchVto,
          numero_comprobante: nextInvoiceNumber,
          fecha_proceso: response.FchProceso,
          resultado: response.Resultado,
          qr_code: qrData,
        };
      } else {
        this.logger.error('Invoice rejected by AFIP', response.Observaciones);

        return {
          success: false,
          errors: response.Observaciones?.map((obs: any) => ({
            code: obs.Code,
            message: obs.Msg,
          })) || [],
          observations: response.Observaciones?.map((obs: any) => ({
            code: obs.Code,
            message: obs.Msg,
          })) || [],
        };
      }
    } catch (error: any) {
      this.logger.error('Error generating invoice', error);

      return {
        success: false,
        errors: [
          {
            code: -1,
            message: error.message || 'Unknown error',
          },
        ],
      };
    }
  }

  /**
   * Obtiene el último número de comprobante autorizado
   */
  async getLastInvoiceNumber(
    tipoComprobante: AFIPInvoiceType,
    puntoVenta: number
  ): Promise<number> {
    this.ensureInitialized();

    try {
      const lastNumber = await this.afip.ElectronicBilling.getLastVoucher(
        puntoVenta,
        tipoComprobante
      );

      this.logger.debug(
        `Last invoice number for type ${tipoComprobante}, PV ${puntoVenta}: ${lastNumber}`
      );

      return lastNumber || 0;
    } catch (error) {
      this.logger.error('Error getting last invoice number', error);
      return 0;
    }
  }

  /**
   * Prepara los datos del comprobante según formato AFIP
   */
  private prepareInvoiceData(
    request: InvoiceGenerationRequest,
    tipoComprobante: AFIPInvoiceType,
    numeroComprobante: number
  ): AFIPInvoiceData {
    const today = new Date();
    const fechaComprobante = this.formatDate(today);

    // Convertir centavos a pesos con 2 decimales
    const subtotal = Math.round(request.subtotal) / 100;
    const tax = Math.round(request.tax) / 100;
    const total = Math.round(request.total) / 100;

    // Determinar tipo y número de documento del cliente
    let tipoDocumento = AFIPDocumentType.CONSUMIDOR_FINAL;
    let numeroDocumento = '0';

    if (request.customerCuit) {
      tipoDocumento = AFIPDocumentType.CUIT;
      numeroDocumento = request.customerCuit.replace(/[-]/g, '');
    } else if (request.customerDocumentType && request.customerDocumentNumber) {
      tipoDocumento = request.customerDocumentType;
      numeroDocumento = request.customerDocumentNumber;
    }

    // Preparar IVA discriminado (RG 5614/2024: obligatorio en todos los tipos)
    // Agrupar por tasa si hay múltiples items con diferentes tasas
    const ivaByRate = new Map<number, { base: number; importe: number }>();

    for (const item of request.items) {
      const ivaCode = getIVACodeFromRate(item.taxRate);
      const itemSubtotal = (item.quantity * item.unitPrice) / 100;
      const itemTax = calculateIVA(itemSubtotal, ivaCode);

      const existing = ivaByRate.get(ivaCode) || { base: 0, importe: 0 };
      ivaByRate.set(ivaCode, {
        base: existing.base + itemSubtotal,
        importe: existing.importe + itemTax,
      });
    }

    const iva = Array.from(ivaByRate.entries()).map(([codigo, amounts]) => ({
      codigo,
      base_imponible: Math.round(amounts.base * 100) / 100,
      importe: Math.round(amounts.importe * 100) / 100,
    }));

    // Preparar items opcionales
    const items = request.items.map((item) => ({
      codigo: item.description.slice(0, 20),
      descripcion: item.description,
      cantidad: item.quantity,
      unidad_medida: 'unidades',
      precio_unitario: item.unitPrice / 100,
      importe_iva: (item.total * item.taxRate) / 100,
      importe_total: item.total / 100,
    }));

    const invoiceData: AFIPInvoiceData = {
      tipo_comprobante: tipoComprobante,
      punto_venta: this.config.puntoVenta,
      numero_comprobante: numeroComprobante,
      fecha_comprobante: fechaComprobante,
      concepto: AFIPConceptType.PRODUCTOS,

      tipo_documento: tipoDocumento,
      numero_documento: numeroDocumento,

      importe_total: total,
      importe_neto: subtotal,
      importe_iva: tax,
      importe_tributos: 0,
      importe_operaciones_exentas: 0,

      iva,
      items,

      codigo_moneda: 'PES',
      cotizacion_moneda: 1,
    };

    // Agregar comprobante asociado si es nota de crédito/débito
    if (request.associatedInvoice) {
      invoiceData.comprobantes_asociados = [
        {
          tipo: request.associatedInvoice.type,
          punto_venta: request.associatedInvoice.pointOfSale,
          numero: request.associatedInvoice.number,
        },
      ];
    }

    return invoiceData;
  }

  /**
   * Mapea tipo de factura simplificado a código AFIP
   */
  private mapInvoiceType(invoiceType: string): AFIPInvoiceType {
    const mapping: Record<string, AFIPInvoiceType> = {
      A: AFIPInvoiceType.FACTURA_A,
      B: AFIPInvoiceType.FACTURA_B,
      C: AFIPInvoiceType.FACTURA_C,
      E: AFIPInvoiceType.FACTURA_E,
    };

    const mapped = mapping[invoiceType];
    if (!mapped) {
      throw new Error(`Invalid invoice type: ${invoiceType}`);
    }

    return mapped;
  }

  /**
   * Formatea fecha para AFIP (YYYYMMDD)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Guarda transacción AFIP para auditoría
   */
  private async saveAFIPTransaction(saleId: string, data: any): Promise<void> {
    try {
      // Obtener tenantId de la venta
      const sale = await this.prisma.sale.findUnique({
        where: { id: saleId },
        select: { tenantId: true },
      });

      if (!sale) {
        this.logger.warn(`Sale ${saleId} not found for audit log`);
        return;
      }

      await this.prisma.auditLog.create({
        data: {
          tenantId: sale.tenantId,
          action: 'create',
          entity: 'afip_invoice',
          entityId: saleId,
          changes: data,
        },
      });
    } catch (error) {
      this.logger.error('Error saving AFIP transaction', error);
      // No lanzar error, solo registrar
    }
  }

  /**
   * Valida que el CUIT sea correcto (dígito verificador)
   */
  validateCUIT(cuit: string): boolean {
    return validateCUIT(cuit);
  }

  /**
   * Obtiene información de un comprobante ya emitido
   */
  async getInvoiceInfo(
    tipoComprobante: AFIPInvoiceType,
    puntoVenta: number,
    numeroComprobante: number
  ): Promise<any> {
    this.ensureInitialized();

    try {
      return await this.afip.ElectronicBilling.getVoucherInfo(
        numeroComprobante,
        puntoVenta,
        tipoComprobante
      );
    } catch (error) {
      this.logger.error('Error getting invoice info', error);
      throw error;
    }
  }

  /**
   * Obtiene puntos de venta habilitados
   */
  async getSalesPoints(): Promise<SalesPoint[]> {
    this.ensureInitialized();

    try {
      const response = await this.afip.ElectronicBilling.getSalesPoints();
      return response.map((point: any) => ({
        numero: point.PtoVta,
        bloqueado: point.Bloqueado === 'S',
        fecha_baja: point.FchBaja,
        tipo_emision: point.EmisionTipo,
      }));
    } catch (error) {
      this.logger.error('Error getting sales points', error);
      throw error;
    }
  }

  /**
   * Verifica el estado del servidor AFIP
   */
  async checkServerStatus(): Promise<AFIPServerStatus> {
    this.ensureInitialized();

    try {
      const response = await this.afip.ElectronicBilling.getServerStatus();

      return {
        appserver: response.AppServer === 'OK' ? 'OK' : 'ERROR',
        dbserver: response.DbServer === 'OK' ? 'OK' : 'ERROR',
        authserver: response.AuthServer === 'OK' ? 'OK' : 'ERROR',
      };
    } catch (error: any) {
      this.logger.error('Error checking AFIP server status', error);
      return {
        appserver: 'ERROR',
        dbserver: 'ERROR',
        authserver: 'ERROR',
      };
    }
  }

  /**
   * Obtiene el token de autorización de WSAA (para debugging)
   */
  async getAuthToken(): Promise<any> {
    this.ensureInitialized();

    try {
      return await this.afip.getAuth();
    } catch (error) {
      this.logger.error('Error getting auth token', error);
      throw error;
    }
  }
}
