import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaClient } from '@retail/database';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private prisma: PrismaClient) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Intenta hacer un query simple
      await this.prisma.$queryRaw`SELECT 1`;

      return this.getStatus(key, true, {
        message: 'Database connection is healthy',
      });
    } catch (error) {
      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, {
          message: error.message,
        })
      );
    }
  }
}
