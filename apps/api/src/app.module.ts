import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './shared/database/database.module';
import { RedisModule } from './shared/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { ProductsModule } from './modules/products/products.module';
import { SalesModule } from './modules/sales/sales.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { LocationsModule } from './modules/locations/locations.module';
import { RBACModule } from './rbac/rbac.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { PromotionsModule } from './promotions/promotions.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PermissionGuard } from './rbac/guards/permission.guard';
import { AuditLogInterceptor } from './rbac/interceptors/audit-log.interceptor';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests
      },
    ]),

    // Queue system for notifications
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),

    // Event Emitter (required for WhatsApp events)
    EventEmitterModule.forRoot(),

    // Schedule Module (required for cron jobs)
    ScheduleModule.forRoot(),

    // Shared modules
    DatabaseModule,
    RedisModule,

    // RBAC Module (Global)
    RBACModule,

    // Feature modules
    AuthModule,
    TenantsModule,
    ProductsModule,
    SalesModule,
    PaymentsModule,
    NotificationsModule,
    ReportsModule,
    DashboardModule,
    AnalyticsModule,
    LocationsModule,
    WhatsAppModule,
    PromotionsModule,
    LoyaltyModule,
    AppointmentsModule,
    SubscriptionsModule,
  ],
  providers: [
    // Global guards
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
})
export class AppModule {}
