import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class MetricsService {
  private metrics: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();

  constructor(private logger: LoggerService) {
    this.logger.setContext('MetricsService');
  }

  /**
   * Incrementa un contador
   */
  incrementCounter(
    name: string,
    value: number = 1,
    labels?: Record<string, string>,
  ) {
    const key = this.getKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    this.logger.debug(`Counter incremented: ${key} = ${current + value}`);
  }

  /**
   * Registra una métrica (gauge)
   */
  recordMetric(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ) {
    const key = this.getKey(name, labels);
    this.metrics.set(key, value);

    this.logger.debug(`Metric recorded: ${key} = ${value}`);
  }

  /**
   * Obtiene todas las métricas
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Obtiene todos los contadores
   */
  getCounters(): Record<string, number> {
    return Object.fromEntries(this.counters);
  }

  /**
   * Limpia todas las métricas (útil para testing)
   */
  reset() {
    this.metrics.clear();
    this.counters.clear();
    this.logger.debug('Metrics reset');
  }

  /**
   * Exporta métricas en formato Prometheus
   */
  getPrometheusFormat(): string {
    const lines: string[] = [];

    // Counters
    for (const [key, value] of this.counters.entries()) {
      lines.push(`${key} ${value}`);
    }

    // Metrics (gauges)
    for (const [key, value] of this.metrics.entries()) {
      lines.push(`${key} ${value}`);
    }

    return lines.join('\n');
  }

  // ========================================
  // Métricas de Negocio
  // ========================================

  /**
   * Registra una venta
   */
  recordSale(tenantId: string, amountCents: number) {
    this.incrementCounter('sales_total', 1, { tenant_id: tenantId });
    this.recordMetric('sales_amount_cents', amountCents, {
      tenant_id: tenantId,
    });

    this.logger.logWithMetadata('Sale metric recorded', {
      tenantId,
      amountCents,
    });
  }

  /**
   * Registra un pago
   */
  recordPayment(
    method: string,
    amountCents: number,
    success: boolean,
  ) {
    const status = success ? 'success' : 'failed';
    this.incrementCounter('payments_total', 1, { method, status });
    this.recordMetric('payment_amount_cents', amountCents, { method, status });

    this.logger.logWithMetadata('Payment metric recorded', {
      method,
      amountCents,
      status,
    });
  }

  /**
   * Registra una factura AFIP
   */
  recordAFIPInvoice(type: string, success: boolean) {
    const status = success ? 'success' : 'failed';
    this.incrementCounter('afip_invoices_total', 1, { type, status });

    this.logger.logWithMetadata('AFIP invoice metric recorded', {
      type,
      status,
    });
  }

  /**
   * Registra una llamada a la API
   */
  recordAPICall(
    endpoint: string,
    method: string,
    statusCode: number,
    durationMs: number,
  ) {
    this.incrementCounter('api_requests_total', 1, {
      endpoint,
      method,
      status: statusCode.toString(),
    });
    this.recordMetric('api_request_duration_ms', durationMs, {
      endpoint,
      method,
    });
  }

  /**
   * Registra error de base de datos
   */
  recordDatabaseError(operation: string) {
    this.incrementCounter('database_errors_total', 1, { operation });

    this.logger.warn(`Database error recorded: ${operation}`);
  }

  /**
   * Registra error de AFIP
   */
  recordAFIPError(errorType: string) {
    this.incrementCounter('afip_errors_total', 1, { error_type: errorType });

    this.logger.warn(`AFIP error recorded: ${errorType}`);
  }

  /**
   * Registra sesión de usuario
   */
  recordUserSession(tenantId: string, action: 'login' | 'logout') {
    this.incrementCounter('user_sessions_total', 1, {
      tenant_id: tenantId,
      action,
    });

    this.logger.logWithMetadata('User session metric recorded', {
      tenantId,
      action,
    });
  }

  // ========================================
  // Helpers
  // ========================================

  /**
   * Genera una clave única para la métrica con labels
   */
  private getKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelPairs = Object.entries(labels)
      .map(([key, value]) => `${key}="${value}"`)
      .join(',');

    return `${name}{${labelPairs}}`;
  }
}
