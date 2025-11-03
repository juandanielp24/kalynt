import { AFIPConfig } from './afip.types';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Obtiene la configuración de AFIP desde variables de entorno
 */
export function getAFIPConfig(configService: ConfigService): AFIPConfig {
  const production = configService.get('AFIP_PRODUCTION', 'false') === 'true';
  const cuit = configService.get<string>('AFIP_CUIT');

  if (!cuit) {
    throw new Error('AFIP_CUIT environment variable is required');
  }

  // Determinar paths de certificados
  const certPath = configService.get<string>('AFIP_CERT_PATH') ||
    path.resolve(
      __dirname,
      '../../../certs',
      production ? 'cert.pem' : 'cert-test.pem'
    );

  const keyPath = configService.get<string>('AFIP_KEY_PATH') ||
    path.resolve(
      __dirname,
      '../../../certs',
      production ? 'key.pem' : 'key-test.pem'
    );

  // Validar que los certificados existan (en desarrollo, solo advertir)
  if (!fs.existsSync(certPath)) {
    const message = `AFIP certificate not found at ${certPath}`;
    if (production) {
      throw new Error(message);
    } else {
      console.warn(`[AFIP] ${message} - Service will be limited`);
    }
  }

  if (!fs.existsSync(keyPath)) {
    const message = `AFIP private key not found at ${keyPath}`;
    if (production) {
      throw new Error(message);
    } else {
      console.warn(`[AFIP] ${message} - Service will be limited`);
    }
  }

  return {
    cuit,
    certPath,
    keyPath,
    production,
    puntoVenta: parseInt(configService.get('AFIP_PUNTO_VENTA', '1'), 10),
  };
}

/**
 * Valida la configuración de AFIP
 */
export function validateAFIPConfig(config: AFIPConfig): void {
  // Validar CUIT
  if (!/^\d{11}$/.test(config.cuit.replace(/[-]/g, ''))) {
    throw new Error(`Invalid AFIP CUIT format: ${config.cuit}`);
  }

  // Validar punto de venta
  if (config.puntoVenta < 1 || config.puntoVenta > 9999) {
    throw new Error(`Invalid AFIP punto de venta: ${config.puntoVenta} (must be 1-9999)`);
  }

  // Validar que los paths sean absolutos
  if (!path.isAbsolute(config.certPath)) {
    throw new Error('AFIP_CERT_PATH must be an absolute path');
  }

  if (!path.isAbsolute(config.keyPath)) {
    throw new Error('AFIP_KEY_PATH must be an absolute path');
  }
}

/**
 * URLs de los servicios AFIP según ambiente
 */
export const AFIP_URLS = {
  production: {
    wsaa: 'https://wsaa.afip.gov.ar/ws/services/LoginCms',
    wsfev1: 'https://servicios1.afip.gov.ar/wsfev1/service.asmx',
  },
  testing: {
    wsaa: 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms',
    wsfev1: 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx',
  },
};

/**
 * Obtiene las URLs de los servicios según ambiente
 */
export function getAFIPUrls(production: boolean) {
  return production ? AFIP_URLS.production : AFIP_URLS.testing;
}
