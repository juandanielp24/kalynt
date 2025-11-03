import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as crypto from 'crypto';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { AFIP_URLS, TOKEN_TTL } from '../../constants/argentina.constants';
import { WSAACredentials, WSAAConfig } from './wsaa.types';
import { DateFormatter } from '../utils/date-formatter';

/**
 * WSAA - Web Service de Autenticación y Autorización
 * 
 * Maneja la autenticación con AFIP y obtención de tokens
 * para usar en otros servicios (WSFEv1, etc.)
 */
@Injectable()
export class WSAAService {
  private readonly logger = new Logger(WSAAService.name);
  private credentials: WSAACredentials | null = null;

  constructor(private config: ConfigService) {}

  /**
   * Obtiene credenciales válidas (token + sign)
   * Reutiliza credenciales si están vigentes, sino genera nuevas
   */
  async getCredentials(service: string = 'wsfe'): Promise<WSAACredentials> {
    // Verificar si tenemos credenciales válidas
    if (this.credentials && this.isCredentialsValid(this.credentials)) {
      this.logger.debug(\`Using cached credentials for service: \${service}\`);
      return this.credentials;
    }

    // Generar nuevas credenciales
    this.logger.log(\`Authenticating with AFIP for service: \${service}\`);
    return this.authenticate(service);
  }

  /**
   * Verifica si las credenciales están vigentes
   */
  private isCredentialsValid(credentials: WSAACredentials): boolean {
    // Verificar si expiran en más de 5 minutos
    const now = new Date();
    const expiresIn = credentials.expirationTime.getTime() - now.getTime();
    const fiveMinutes = 5 * 60 * 1000;

    return expiresIn > fiveMinutes;
  }

  /**
   * Proceso completo de autenticación con AFIP
   */
  private async authenticate(service: string): Promise<WSAACredentials> {
    try {
      // 1. Generar Login Ticket Request (LTR)
      const ltr = this.generateLTR(service);
      this.logger.debug('LTR generated');

      // 2. Firmar LTR con certificado
      const cms = this.signLTR(ltr);
      this.logger.debug('LTR signed');

      // 3. Llamar a WSAA
      const response = await this.callWSAA(cms);
      this.logger.debug('WSAA called successfully');

      // 4. Parsear y almacenar credenciales
      this.credentials = await this.parseWSAAResponse(response);
      this.logger.log(\`Authentication successful. Token expires at: \${this.credentials.expirationTime}\`);

      return this.credentials;
    } catch (error: any) {
      this.logger.error(\`WSAA authentication failed: \${error.message}\`, error.stack);
      throw new Error(\`AFIP authentication failed: \${error.message}\`);
    }
  }

  /**
   * Genera el Login Ticket Request (LTR)
   */
  private generateLTR(service: string): string {
    const uniqueId = Date.now();
    const now = new Date();
    const expirationTime = new Date(now.getTime() + TOKEN_TTL * 1000);

    const generationTime = DateFormatter.toWSAAFormat(now);
    const expiration = DateFormatter.toWSAAFormat(expirationTime);

    return \`<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>\${uniqueId}</uniqueId>
    <generationTime>\${generationTime}</generationTime>
    <expirationTime>\${expiration}</expirationTime>
  </header>
  <service>\${service}</service>
</loginTicketRequest>\`;
  }

  /**
   * Firma el LTR con el certificado
   */
  private signLTR(ltr: string): string {
    const certPath = this.config.get<string>('AFIP_CERT_PATH');
    const keyPath = this.config.get<string>('AFIP_KEY_PATH');

    if (!certPath || !keyPath) {
      throw new Error('AFIP certificate paths not configured');
    }

    if (!fs.existsSync(certPath)) {
      throw new Error(\`Certificate not found: \${certPath}\`);
    }

    if (!fs.existsSync(keyPath)) {
      throw new Error(\`Private key not found: \${keyPath}\`);
    }

    const cert = fs.readFileSync(certPath, 'utf-8');
    const key = fs.readFileSync(keyPath, 'utf-8');

    // Crear firma PKCS#7
    const sign = crypto.createSign('SHA256');
    sign.update(ltr);
    sign.end();
    
    const signature = sign.sign(key);
    const base64Signature = signature.toString('base64');

    // Crear CMS (simplificado - en producción usar librería crypto completa)
    return base64Signature;
  }

  /**
   * Llama al servicio WSAA de AFIP
   */
  private async callWSAA(cms: string): Promise<string> {
    const environment = this.config.get<string>('AFIP_ENVIRONMENT', 'testing');
    const url = AFIP_URLS[environment as 'testing' | 'production'].wsaa;

    this.logger.debug(\`Calling WSAA at: \${url}\`);

    const soapEnvelope = \`<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope 
  xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" 
  xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">
  <soapenv:Header/>
  <soapenv:Body>
    <wsaa:loginCms>
      <wsaa:in0>\${cms}</wsaa:in0>
    </wsaa:loginCms>
  </soapenv:Body>
</soapenv:Envelope>\`;

    try {
      const response = await axios.post(url, soapEnvelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '',
        },
        timeout: 30000, // 30 seconds
      });

      return response.data;
    } catch (error: any) {
      if (error.response) {
        this.logger.error(\`WSAA HTTP error: \${error.response.status} - \${error.response.data}\`);
      }
      throw error;
    }
  }

  /**
   * Parsea la respuesta XML de WSAA
   */
  private async parseWSAAResponse(xml: string): Promise<WSAACredentials> {
    try {
      const parsed = await parseStringPromise(xml, {
        explicitArray: false,
        tagNameProcessors: [(name) => name.replace(/^.*:/, '')], // Remove namespace prefixes
      });

      // Navegar la estructura del XML
      const envelope = parsed.Envelope || parsed['soapenv:Envelope'];
      const body = envelope.Body || envelope['soapenv:Body'];
      const loginResponse = body.loginCmsResponse || body['ns1:loginCmsResponse'];
      const loginReturn = loginResponse.loginCmsReturn || loginResponse['ns1:loginCmsReturn'];

      // Extraer credenciales
      const token = loginReturn.token;
      const sign = loginReturn.sign;
      const expirationTimeStr = loginReturn.header?.expirationTime;

      if (!token || !sign || !expirationTimeStr) {
        throw new Error('Invalid WSAA response: missing credentials');
      }

      // Parsear fecha de expiración
      const expirationTime = new Date(expirationTimeStr);

      return {
        token,
        sign,
        expirationTime,
      };
    } catch (error: any) {
      this.logger.error(\`Failed to parse WSAA response: \${error.message}\`);
      this.logger.debug(\`XML response: \${xml}\`);
      throw new Error(\`Failed to parse WSAA response: \${error.message}\`);
    }
  }

  /**
   * Limpia las credenciales en caché (útil para testing)
   */
  clearCredentials(): void {
    this.credentials = null;
    this.logger.debug('Credentials cache cleared');
  }

  /**
   * Genera un TRA (Ticket Request Access) para debugging/testing
   * @public Para testing
   */
  public createTRA(service: string = 'wsfe'): string {
    return this.generateLTR(service);
  }

  /**
   * Firma un TRA y devuelve el CMS para debugging/testing
   * @public Para testing
   */
  public signTRA(tra: string): string {
    return this.signLTR(tra);
  }

  /**
   * Verifica si hay credenciales en caché
   */
  hasValidCredentials(): boolean {
    return this.credentials !== null && this.isCredentialsValid(this.credentials);
  }

  /**
   * Obtiene tiempo restante de validez de credenciales en segundos
   */
  getCredentialsTimeToLive(): number {
    if (!this.credentials) return 0;

    const now = new Date();
    const ttl = Math.floor((this.credentials.expirationTime.getTime() - now.getTime()) / 1000);

    return Math.max(0, ttl);
  }
}
