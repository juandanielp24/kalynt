import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;
  private context: string = 'Application';

  constructor(private configService: ConfigService) {
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const env = this.configService.get('NODE_ENV', 'development');
    const logLevel = this.configService.get('LOG_LEVEL', 'info');

    // Formato personalizado
    const customFormat = winston.format.printf(({ level, message, timestamp, context, trace, ...metadata }) => {
      let msg = `${timestamp} [${level}] [${context || this.context}] ${message}`;

      // Agregar metadata si existe
      if (Object.keys(metadata).length > 0) {
        msg += ` ${JSON.stringify(metadata)}`;
      }

      // Agregar stack trace si existe
      if (trace) {
        msg += `\n${trace}`;
      }

      return msg;
    });

    // Transports
    const transports: winston.transport[] = [];

    // Console (desarrollo)
    if (env === 'development') {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            customFormat
          ),
        })
      );
    }

    // File rotation (producción)
    if (env === 'production') {
      // Error logs
      transports.push(
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      );

      // Combined logs
      transports.push(
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      );
    }

    return winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.metadata()
      ),
      transports,
      exitOnError: false,
    });
  }

  setContext(context: string) {
    this.context = context;
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, {
      context: context || this.context,
      trace,
    });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context: context || this.context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context: context || this.context });
  }

  // Métodos adicionales para logging estructurado
  logWithMetadata(message: string, metadata: Record<string, any>, context?: string) {
    this.logger.info(message, {
      context: context || this.context,
      ...metadata,
    });
  }

  logRequest(req: any, res: any, duration: number) {
    this.logger.info('HTTP Request', {
      context: 'HTTP',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      tenantId: req.headers['x-tenant-id'],
      userId: req.user?.id,
    });
  }

  logError(error: Error, context?: string) {
    this.logger.error(error.message, {
      context: context || this.context,
      stack: error.stack,
      name: error.name,
    });
  }

  logSaleTransaction(saleId: string, tenantId: string, totalCents: number, metadata?: any) {
    this.logger.info('Sale Transaction', {
      context: 'Sales',
      saleId,
      tenantId,
      totalCents,
      ...metadata,
    });
  }

  logAFIPRequest(cuit: string, invoiceType: string, success: boolean, cae?: string) {
    this.logger.info('AFIP Request', {
      context: 'AFIP',
      cuit,
      invoiceType,
      success,
      cae,
      timestamp: new Date().toISOString(),
    });
  }

  logPaymentProcessed(paymentId: string, method: string, amountCents: number, status: string) {
    this.logger.info('Payment Processed', {
      context: 'Payments',
      paymentId,
      method,
      amountCents,
      status,
    });
  }
}
