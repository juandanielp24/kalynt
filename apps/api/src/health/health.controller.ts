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
      () => this.checkMemory(),
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

  private async checkMemory() {
    const usage = process.memoryUsage();
    const threshold = 0.9; // 90%
    const heapUsed = usage.heapUsed / usage.heapTotal;

    return {
      memory: {
        status: heapUsed < threshold ? 'up' : 'down',
        heapUsed: Math.round(heapUsed * 100),
        details: usage,
      },
    };
  }
}
