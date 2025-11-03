import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './indicators/database.indicator';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private database: DatabaseHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database
      () => this.database.isHealthy('database'),

      // Memory (no debe exceder 150MB en RSS)
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),

      // Disk (al menos 10% libre)
      () =>
        this.disk.checkStorage('storage', {
          path: '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  readiness() {
    // Verifica si la app está lista para recibir tráfico
    return this.health.check([
      () => this.database.isHealthy('database'),
    ]);
  }

  @Get('liveness')
  @HealthCheck()
  liveness() {
    // Verifica si la app está viva (para k8s)
    return this.health.check([]);
  }
}
