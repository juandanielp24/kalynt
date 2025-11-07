import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './indicators/database.indicator';
import { RedisHealthIndicator } from './indicators/redis.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: DatabaseHealthIndicator,
    private redis: RedisHealthIndicator,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
      () => this.checkDiskSpace(),
      () => this.memory.checkHeap('memory', 150 * 1024 * 1024), // 150 MB
    ]);
  }

  @Get('liveness')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('readiness')
  @HealthCheck()
  readiness() {
    return this.health.check([
      () => this.db.isHealthy('database'),
      () => this.redis.isHealthy('redis'),
    ]);
  }

  private async checkDiskSpace() {
    return this.disk.checkStorage('disk', {
      path: '/',
      thresholdPercent: 0.9,
    });
  }
}
