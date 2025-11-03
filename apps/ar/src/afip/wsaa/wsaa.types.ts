/**
 * Tipos para WSAA (Web Service de Autenticación y Autorización)
 */

export interface WSAACredentials {
  token: string;
  sign: string;
  expirationTime: Date;
}

export interface WSAALoginTicketRequest {
  header: {
    uniqueId: number;
    generationTime: Date;
    expirationTime: Date;
  };
  service: string;
}

export interface WSAAConfig {
  environment: 'testing' | 'production';
  certPath: string;
  keyPath: string;
  cuit: string;
}

export interface WSAAAuthResponse {
  credentials: {
    token: string;
    sign: string;
  };
  header: {
    source: string;
    destination: string;
    uniqueId: number;
    generationTime: string;
    expirationTime: string;
  };
}
