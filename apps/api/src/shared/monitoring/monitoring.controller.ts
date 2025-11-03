import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MonitoringController {
  constructor(private metricsService: MetricsService) {}

  /**
   * Endpoint de métricas en formato JSON
   */
  @Get()
  getMetrics() {
    return {
      metrics: this.metricsService.getMetrics(),
      counters: this.metricsService.getCounters(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Endpoint de métricas en formato Prometheus
   */
  @Get('prometheus')
  @Header('Content-Type', 'text/plain')
  getPrometheusMetrics(): string {
    return this.metricsService.getPrometheusFormat();
  }
}
