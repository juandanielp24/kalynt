import { NestFactory } from '@nestjs/core';
import { ValidationPipe, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SecurityConfig } from './common/security/security.config';

async function bootstrap() {
  // Initialize Sentry before app creation
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.SENTRY_RELEASE || 'unknown',
      integrations: [
        nodeProfilingIntegration(),
      ],
      tracesSampleRate: 0.1, // 10% of transactions
      profilesSampleRate: 0.1, // 10% of transactions
      beforeSend(event, hint) {
        // Don't send events for certain errors
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof HttpException && error.getStatus() < 500) {
            return null;
          }
        }
        return event;
      },
    });
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  // Security headers
  app.use(SecurityConfig.getHelmetConfig());
  app.use(compression());

  // Rate limiting
  app.use('/api/', SecurityConfig.getRateLimitConfig());
  app.use('/api/', SecurityConfig.getSlowDownConfig());

  // Strict rate limit for auth endpoints
  app.use('/api/v1/auth/login', SecurityConfig.getStrictRateLimitConfig());
  app.use('/api/v1/auth/register', SecurityConfig.getStrictRateLimitConfig());

  // CORS configuration
  app.enableCors({
    origin: configService.get<string>('ALLOWED_ORIGINS', 'http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip non-whitelisted properties
      forbidNonWhitelisted: true, // Throw error if non-whitelisted
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor()
  );

  // Sentry error handling is now done through setupExpressErrorHandler or global exception filter
  // The Handlers.errorHandler() is no longer available in @sentry/node v8+

  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}/api/v1`);
}

bootstrap();
