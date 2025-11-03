import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './indicators/database.indicator';
import { PrismaClient } from '@retail/database';

@Module({
  imports: [TerminusModule, HttpModule],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator, PrismaClient],
})
export class HealthModule {}
