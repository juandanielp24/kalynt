import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { WSAAService } from '../wsaa/wsaa.service';
import { AFIP_URLS } from '../../constants/argentina.constants';
import { 
  InvoiceRequest, 
  InvoiceResponse, 
  LastInvoiceResponse,
  InvoiceQuery,
  InvoiceInfo,
  AFIPServerStatus 
} from './wsfev1.types';

/**
 * WSFEv1 - Web Service de Facturación Electrónica versión 1
 * 
 * Maneja la generación y consulta de comprobantes electrónicos
 */
@Injectable()
export class WSFEv1Service {
  private readonly logger = new Logger(WSFEv1Service.name);

  constructor(
    private config: ConfigService,
    private wsaaService: WSAAService
  ) {}

  /**
   * Verifica el estado de los servidores de AFIP
   */
  async getServerStatus(): Promise<AFIPServerStatus> {
    const credentials = await this.wsaaService.getCredentials('wsfe');
    const cuit = this.config.get<string>('AFIP_CUIT');

    const soapBody = `
    <FEDummy xmlns="http://ar.gov.afip.dif.FEV1/">
    </FEDummy>`;

    try {
      const response = await this.callWS('FEDummy', soapBody);
      const parsed = await this.parseResponse(response);

      const result = parsed.FEDummyResponse?.FEDummyResult;

      return {
        appServer: result?.AppServer === 'OK' ? 'OK' : 'ERROR',
        dbServer: result?.DbServer === 'OK' ? 'OK' : 'ERROR',
        authServer: result?.AuthServer === 'OK' ? 'OK' : 'ERROR',
      };
    } catch (error: any) {
      this.logger.error(`Failed to get server status: ${error.message}`);
      return {
        appServer: 'ERROR',
        dbServer: 'ERROR',
        authServer: 'ERROR',
      };
    }
  }

  /**
   * Obtiene el último número de comprobante autorizado
   */
  async getLastInvoiceNumber(
    invoiceType: number,
    salePoint: number
  ): Promise<number> {
    const credentials = await this.wsaaService.getCredentials('wsfe');
    const cuit = this.config.get<string>('AFIP_CUIT');

    const soapBody = `
    <FECompUltimoAutorizado xmlns="http://ar.gov.afip.dif.FEV1/">
      <Auth>
        <Token>${credentials.token}</Token>
        <Sign>${credentials.sign}</Sign>
        <Cuit>${cuit}</Cuit>
      </Auth>
      <PtoVta>${salePoint}</PtoVta>
      <CbteTipo>${invoiceType}</CbteTipo>
    </FECompUltimoAutorizado>`;

    try {
      const response = await this.callWS('FECompUltimoAutorizado', soapBody);
      const parsed = await this.parseResponse(response);

      const result = parsed.FECompUltimoAutorizadoResponse?.FECompUltimoAutorizadoResult;
      const lastNumber = parseInt(result?.CbteNro || '0');

      this.logger.debug(`Last invoice number for type ${invoiceType}, point ${salePoint}: ${lastNumber}`);

      return lastNumber;
    } catch (error: any) {
      this.logger.error(`Failed to get last invoice number: ${error.message}`);
      throw new Error(`Failed to get last invoice number: ${error.message}`);
    }
  }

  /**
   * Genera un comprobante electrónico
   */
  async generateInvoice(invoice: InvoiceRequest): Promise<InvoiceResponse> {
    const credentials = await this.wsaaService.getCredentials('wsfe');
    const cuit = this.config.get<string>('AFIP_CUIT');

    this.logger.log(`Generating invoice: Type ${invoice.invoiceType}, Point ${invoice.salePoint}, Number ${invoice.invoiceNumber}`);

    // Construir el request SOAP
    const soapBody = this.buildInvoiceRequest(credentials, cuit, invoice);

    try {
      const response = await this.callWS('FECAESolicitar', soapBody);
      const invoiceResponse = await this.parseInvoiceResponse(response);

      if (invoiceResponse.result === 'A') {
        this.logger.log(`Invoice authorized: CAE ${invoiceResponse.cae}`);
      } else {
        this.logger.warn(`Invoice rejected or partial: ${JSON.stringify(invoiceResponse.errors)}`);
      }

      return invoiceResponse;
    } catch (error: any) {
      this.logger.error(`Failed to generate invoice: ${error.message}`);
      throw new Error(`Failed to generate invoice: ${error.message}`);
    }
  }

  /**
   * Consulta información de un comprobante
   */
  async queryInvoice(query: InvoiceQuery): Promise<InvoiceInfo | null> {
    const credentials = await this.wsaaService.getCredentials('wsfe');
    const cuit = this.config.get<string>('AFIP_CUIT');

    const soapBody = `
    <FECompConsultar xmlns="http://ar.gov.afip.dif.FEV1/">
      <Auth>
        <Token>${credentials.token}</Token>
        <Sign>${credentials.sign}</Sign>
        <Cuit>${cuit}</Cuit>
      </Auth>
      <FeCompConsReq>
        <CbteTipo>${query.invoiceType}</CbteTipo>
        <PtoVta>${query.salePoint}</PtoVta>
        <CbteNro>${query.invoiceNumber}</CbteNro>
      </FeCompConsReq>
    </FECompConsultar>`;

    try {
      const response = await this.callWS('FECompConsultar', soapBody);
      const parsed = await this.parseResponse(response);

      const result = parsed.FECompConsultarResponse?.FECompConsultarResult;
      const invoice = result?.ResultGet;

      if (!invoice) {
        return null;
      }

      return {
        invoiceType: parseInt(invoice.CbteTipo),
        salePoint: parseInt(invoice.PtoVta),
        invoiceNumber: parseInt(invoice.CbteNro),
        invoiceDate: invoice.CbteFch,
        totalAmount: parseFloat(invoice.ImpTotal),
        cae: invoice.CodAutorizacion,
        caeExpirationDate: invoice.FchVto,
        emissionDate: invoice.FchProceso,
        processedDate: invoice.FchProceso,
      };
    } catch (error: any) {
      this.logger.error(`Failed to query invoice: ${error.message}`);
      return null;
    }
  }

  /**
   * Construye el request SOAP para generación de factura
   */
  private buildInvoiceRequest(
    credentials: any,
    cuit: string,
    invoice: InvoiceRequest
  ): string {
    // Construir IVAs
    let ivaXml = '';
    if (invoice.iva && invoice.iva.length > 0) {
      const ivaItems = invoice.iva.map(iva => `
        <AlicIva>
          <Id>${iva.id}</Id>
          <BaseImp>${iva.baseAmount.toFixed(2)}</BaseImp>
          <Importe>${iva.taxAmount.toFixed(2)}</Importe>
        </AlicIva>
      `).join('');

      ivaXml = `<Iva>${ivaItems}</Iva>`;
    }

    // Construir tributos opcionales
    let tributesXml = '';
    if (invoice.tributes && invoice.tributes.length > 0) {
      const tributeItems = invoice.tributes.map(trib => `
        <Tributo>
          <Id>${trib.id}</Id>
          <Desc>${trib.description}</Desc>
          <BaseImp>${trib.baseAmount.toFixed(2)}</BaseImp>
          <Alic>${trib.rate.toFixed(2)}</Alic>
          <Importe>${trib.taxAmount.toFixed(2)}</Importe>
        </Tributo>
      `).join('');

      tributesXml = `<Tributos>${tributeItems}</Tributos>`;
    }

    // Construir comprobantes asociados
    let associatedXml = '';
    if (invoice.associatedInvoices && invoice.associatedInvoices.length > 0) {
      const assocItems = invoice.associatedInvoices.map(assoc => `
        <CbteAsoc>
          <Tipo>${assoc.type}</Tipo>
          <PtoVta>${assoc.salePoint}</PtoVta>
          <Nro>${assoc.number}</Nro>
          <Cuit>${assoc.cuit}</Cuit>
        </CbteAsoc>
      `).join('');

      associatedXml = `<CbtesAsoc>${assocItems}</CbtesAsoc>`;
    }

    // Fechas de servicio (solo si es concepto 2 o 3)
    let serviceXml = '';
    if (invoice.concept !== 1 && invoice.serviceFrom && invoice.serviceTo && invoice.serviceDueDate) {
      serviceXml = `
        <FchServDesde>${invoice.serviceFrom}</FchServDesde>
        <FchServHasta>${invoice.serviceTo}</FchServHasta>
        <FchVtoPago>${invoice.serviceDueDate}</FchVtoPago>
      `;
    }

    return `
    <FECAESolicitar xmlns="http://ar.gov.afip.dif.FEV1/">
      <Auth>
        <Token>${credentials.token}</Token>
        <Sign>${credentials.sign}</Sign>
        <Cuit>${cuit}</Cuit>
      </Auth>
      <FeCAEReq>
        <FeCabReq>
          <CantReg>1</CantReg>
          <PtoVta>${invoice.salePoint}</PtoVta>
          <CbteTipo>${invoice.invoiceType}</CbteTipo>
        </FeCabReq>
        <FeDetReq>
          <FECAEDetRequest>
            <Concepto>${invoice.concept}</Concepto>
            <DocTipo>${invoice.docType}</DocTipo>
            <DocNro>${invoice.docNum}</DocNro>
            <CbteDesde>${invoice.invoiceNumber}</CbteDesde>
            <CbteHasta>${invoice.invoiceNumber}</CbteHasta>
            <CbteFch>${invoice.invoiceDate}</CbteFch>
            <ImpTotal>${invoice.totalAmount.toFixed(2)}</ImpTotal>
            <ImpTotConc>${invoice.untaxedAmount.toFixed(2)}</ImpTotConc>
            <ImpNeto>${invoice.netAmount.toFixed(2)}</ImpNeto>
            <ImpOpEx>${invoice.exemptAmount.toFixed(2)}</ImpOpEx>
            <ImpIVA>${invoice.taxAmount.toFixed(2)}</ImpIVA>
            <ImpTrib>0.00</ImpTrib>
            <MonId>${invoice.currency}</MonId>
            <MonCotiz>${invoice.exchangeRate.toFixed(2)}</MonCotiz>
            ${serviceXml}
            ${ivaXml}
            ${tributesXml}
            ${associatedXml}
          </FECAEDetRequest>
        </FeDetReq>
      </FeCAEReq>
    </FECAESolicitar>`;
  }

  /**
   * Llama al web service de AFIP
   */
  private async callWS(method: string, body: string): Promise<string> {
    const environment = this.config.get<string>('AFIP_ENVIRONMENT', 'testing');
    const url = AFIP_URLS[environment as 'testing' | 'production'].wsfev1;

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope 
  xmlns:soap="http://www.w3.org/2003/05/soap-envelope" 
  xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soap:Header/>
  <soap:Body>
    ${body}
  </soap:Body>
</soap:Envelope>`;

    try {
      const response = await axios.post(url, soapEnvelope, {
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'SOAPAction': '',
        },
        timeout: 60000, // 60 seconds for invoice generation
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        this.logger.error(`WSFEv1 HTTP error: ${error.response.status}`);
        this.logger.debug(`Response data: ${error.response.data}`);
      }
      throw error;
    }
  }

  /**
   * Parsea la respuesta XML genérica
   */
  private async parseResponse(xml: string): Promise<any> {
    return await parseStringPromise(xml, {
      explicitArray: false,
      tagNameProcessors: [(name) => name.replace(/^.*:/, '')],
    });
  }

  /**
   * Parsea la respuesta de generación de factura
   */
  private async parseInvoiceResponse(xml: string): Promise<InvoiceResponse> {
    const parsed = await this.parseResponse(xml);

    const envelope = parsed.Envelope;
    const body = envelope.Body;
    const solicResponse = body.FECAESolicitarResponse;
    const result = solicResponse?.FECAESolicitarResult;

    if (!result) {
      throw new Error('Invalid invoice response structure');
    }

    // Extraer eventos/errores
    const events = this.extractMessages(result.Events?.Evt);
    const errors = this.extractMessages(result.Errors?.Err);

    // Extraer datos del comprobante
    const detResponse = result.FeDetResp?.FECAEDetResponse;

    if (!detResponse) {
      throw new Error('No invoice detail in response');
    }

    const observations = this.extractMessages(detResponse.Observaciones?.Obs);

    return {
      invoiceType: parseInt(result.FeCabResp?.CbteTipo || '0'),
      salePoint: parseInt(result.FeCabResp?.PtoVta || '0'),
      invoiceNumber: parseInt(detResponse.CbteDesde || '0'),
      invoiceDate: detResponse.CbteFch || '',
      cae: detResponse.CAE || '',
      caeExpirationDate: detResponse.CAEFchVto || '',
      result: detResponse.Resultado || 'R',
      observations,
      errors,
      events,
    };
  }

  /**
   * Extrae mensajes de errores/observaciones/eventos
   */
  private extractMessages(items: any): Array<{ code: number; message: string }> {
    if (!items) return [];

    const itemsArray = Array.isArray(items) ? items : [items];

    return itemsArray.map(item => ({
      code: parseInt(item.Code || item.Codigo || '0'),
      message: item.Msg || item.Mensaje || 'Unknown error',
    }));
  }

  /**
   * Construye un SOAP envelope para cualquier método WSFEV1
   * @public Para testing/debugging
   */
  public buildSOAPEnvelope(method: string, params: any): string {
    const paramsXML = this.objectToXML(params);

    return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soap:Header/>
  <soap:Body>
    <ar:${method}>
      ${paramsXML}
    </ar:${method}>
  </soap:Body>
</soap:Envelope>`;
  }

  /**
   * Convierte un objeto JavaScript a XML
   * @public Para testing/debugging
   */
  public objectToXML(obj: any, indent: number = 0): string {
    let xml = '';
    const spaces = '  '.repeat(indent);

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'object') {
            xml += `${spaces}<ar:${key}>\n${this.objectToXML(item, indent + 1)}${spaces}</ar:${key}>\n`;
          } else {
            xml += `${spaces}<ar:${key}>${item}</ar:${key}>\n`;
          }
        }
      } else if (typeof value === 'object') {
        xml += `${spaces}<ar:${key}>\n${this.objectToXML(value, indent + 1)}${spaces}</ar:${key}>\n`;
      } else {
        xml += `${spaces}<ar:${key}>${value}</ar:${key}>\n`;
      }
    }

    return xml;
  }

  /**
   * Parsea errores de una respuesta XML
   * @public Para testing/debugging
   */
  public parseErrors(errorsXML: string): Array<{ code: number; message: string }> {
    const errors: Array<{ code: number; message: string }> = [];
    const errorMatches = errorsXML.matchAll(/<Err>(.*?)<\/Err>/gs);

    for (const match of errorMatches) {
      const errorXML = match[1];
      const codeMatch = errorXML.match(/<Code>(\d+)<\/Code>/);
      const msgMatch = errorXML.match(/<Msg>(.*?)<\/Msg>/);

      if (codeMatch && msgMatch) {
        errors.push({
          code: parseInt(codeMatch[1], 10),
          message: msgMatch[1],
        });
      }
    }

    return errors;
  }

  /**
   * Obtiene el último CAE autorizado (útil para verificaciones)
   */
  async getLastCAE(
    invoiceType: number,
    salePoint: number
  ): Promise<{ cae: string; expirationDate: string; invoiceNumber: number } | null> {
    try {
      const lastNumber = await this.getLastInvoiceNumber(invoiceType, salePoint);

      if (lastNumber === 0) return null;

      const invoice = await this.queryInvoice({
        invoiceType,
        salePoint,
        invoiceNumber: lastNumber,
      });

      if (!invoice) return null;

      return {
        cae: invoice.cae,
        expirationDate: invoice.caeExpirationDate,
        invoiceNumber: lastNumber,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get last CAE: ${error.message}`);
      return null;
    }
  }

  /**
   * Valida que un comprobante tenga CAE válido
   */
  async validateCAE(
    invoiceType: number,
    salePoint: number,
    invoiceNumber: number,
    cae: string
  ): Promise<boolean> {
    try {
      const invoice = await this.queryInvoice({
        invoiceType,
        salePoint,
        invoiceNumber,
      });

      return invoice !== null && invoice.cae === cae;
    } catch (error: any) {
      this.logger.error(`Failed to validate CAE: ${error.message}`);
      return false;
    }
  }
}
