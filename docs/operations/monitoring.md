# Monitoring, Logging & Observability Guide

## Overview

This document describes the complete monitoring, logging, and observability setup for the Retail POS application in production.

## Table of Contents

1. [Logging System](#logging-system)
2. [Health Checks](#health-checks)
3. [Metrics & Monitoring](#metrics--monitoring)
4. [Production Deployment](#production-deployment)
5. [Troubleshooting](#troubleshooting)

## Logging System

### Winston Logger Setup

The application uses Winston for structured logging with daily log rotation.

**Location**: `apps/api/src/shared/logger/`

**Key Features**:
- Structured JSON logging in production
- Colorized console logging in development
- Daily log rotation (keeps 14 days)
- Separate error logs
- Context-based logging
- HTTP request logging

**Usage Example**:
```typescript
import { LoggerService } from '@/shared/logger/logger.service';

@Injectable()
export class MyService {
  constructor(private logger: LoggerService) {
    this.logger.setContext('MyService');
  }

  async doSomething() {
    this.logger.log('Doing something');
    this.logger.logWithMetadata('User action', {
      userId: '123',
      action: 'login',
    });
  }
}
```

**Specialized Logging Methods**:
```typescript
// Sale transaction
logger.logSaleTransaction(saleId, tenantId, totalCents, { items: 3 });

// AFIP request
logger.logAFIPRequest(cuit, 'B', true, cae);

// Payment processing
logger.logPaymentProcessed(paymentId, 'credit_card', amountCents, 'success');

// Error with stack trace
logger.logError(error, 'SalesService');
```

### Log Levels

- `error`: Errors and exceptions
- `warn`: Warning messages
- `info`: General information (default in production)
- `debug`: Debug information (development only)
- `verbose`: Detailed information

**Configuration**:
```bash
# .env
NODE_ENV=production
LOG_LEVEL=info  # error | warn | info | debug | verbose
```

### Log Files (Production)

```
logs/
├── error-2025-11-02.log      # Error logs only
├── combined-2025-11-02.log   # All logs
├── error-2025-11-01.log
└── combined-2025-11-01.log
```

**Rotation Policy**:
- Max file size: 20MB
- Retention: 14 days
- Format: JSON in production, colorized text in development

## Health Checks

### Endpoints

**1. General Health Check**
```bash
GET /health
```

Checks:
- ✅ Database connectivity
- ✅ Memory usage (heap & RSS < 150MB)
- ✅ Disk space (< 90% usage)

**2. Readiness Probe** (Kubernetes)
```bash
GET /health/readiness
```

Checks if the app is ready to receive traffic:
- ✅ Database connection

**3. Liveness Probe** (Kubernetes)
```bash
GET /health/liveness
```

Simple check to verify the app is alive.

### Health Check Responses

**Healthy**:
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up",
      "message": "Database connection is healthy"
    },
    "memory_heap": {
      "status": "up"
    },
    "memory_rss": {
      "status": "up"
    },
    "storage": {
      "status": "up"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up",
      "message": "Database connection is healthy"
    }
  }
}
```

**Unhealthy**:
```json
{
  "status": "error",
  "info": {},
  "error": {
    "database": {
      "status": "down",
      "message": "Connection timeout"
    }
  },
  "details": {
    "database": {
      "status": "down",
      "message": "Connection timeout"
    }
  }
}
```

### Custom Health Indicators

**Database Indicator**:
```typescript
// apps/api/src/health/indicators/database.indicator.ts
@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError('Database check failed',
        this.getStatus(key, false, { message: error.message }));
    }
  }
}
```

**Additional Indicators to Implement**:

1. **Redis Indicator** (`redis.indicator.ts`):
```typescript
async isHealthy(key: string): Promise<HealthIndicatorResult> {
  try {
    await this.redisClient.ping();
    return this.getStatus(key, true);
  } catch (error) {
    throw new HealthCheckError('Redis check failed',
      this.getStatus(key, false));
  }
}
```

2. **AFIP Indicator** (`afip.indicator.ts`):
```typescript
async isHealthy(key: string): Promise<HealthIndicatorResult> {
  if (this.config.get('NODE_ENV') === 'development') {
    return this.getStatus(key, true, { message: 'Skipped in dev' });
  }

  // Check AFIP service availability
  // Return non-critical status even if AFIP is down
  return this.getStatus(key, true, {
    message: 'AFIP availability check'
  });
}
```

## Metrics & Monitoring

### MetricsService

**Location**: `apps/api/src/shared/monitoring/metrics.service.ts`

Tracks business and technical metrics.

**Usage**:
```typescript
import { MetricsService } from '@/shared/monitoring/metrics.service';

@Injectable()
export class SalesService {
  constructor(private metrics: MetricsService) {}

  async createSale(data: CreateSaleDto) {
    const sale = await this.salesRepository.create(data);

    // Record metrics
    this.metrics.recordSale(data.tenantId, sale.totalCents);

    return sale;
  }
}
```

**Available Methods**:
```typescript
// Counters
metrics.incrementCounter('sales_total', 1, { tenant_id: 'abc' });

// Gauges
metrics.recordMetric('sales_amount_cents', 100000, { tenant_id: 'abc' });

// Business metrics
metrics.recordSale(tenantId, amountCents);
metrics.recordPayment(method, amountCents, success);
metrics.recordAFIPInvoice(type, success);
metrics.recordAPICall(endpoint, method, statusCode, duration);
```

### Metrics Endpoint

```bash
GET /metrics
```

**Response**:
```json
{
  "metrics": {
    "sales_amount_cents{tenant_id=\"abc\"}": 100000,
    "api_request_duration_ms{endpoint=\"/sales\",method=\"POST\"}": 45
  },
  "counters": {
    "sales_total{tenant_id=\"abc\"}": 5,
    "payments_total{method=\"credit_card\",status=\"success\"}": 3,
    "afip_invoices_total{type=\"B\",status=\"success\"}": 5
  },
  "timestamp": "2025-11-02T10:30:00.000Z"
}
```

### Prometheus Format (Optional)

```bash
GET /metrics/prometheus
```

Returns metrics in Prometheus exposition format for scraping.

## Production Deployment

### Environment Variables

**Required**:
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_HOST=redis
REDIS_PORT=6379
BETTER_AUTH_SECRET=<min-32-chars-strong-secret>
LOG_LEVEL=info
```

**Optional**:
```bash
# Monitoring
SENTRY_DSN=https://...
APM_SERVER_URL=https://...

# Metrics
PROMETHEUS_ENABLED=true
METRICS_PORT=9090

# Health checks
HEALTH_CHECK_TIMEOUT=5000
```

### Docker Setup

**Dockerfile** (`apps/api/Dockerfile`):
```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @retail/api build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g pnpm
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
RUN pnpm install --prod --frozen-lockfile
RUN mkdir -p logs
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001
USER nestjs

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node healthcheck.js || exit 1

EXPOSE 3001
CMD ["node", "dist/main.js"]
```

**docker-compose.production.yml**:
```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_HOST: redis
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s

volumes:
  postgres_data:
  redis_data:
```

### Health Check Script

**`scripts/check-health.sh`**:
```bash
#!/bin/bash
set -e

API_URL=${API_URL:-http://localhost:3001}

echo "🏥 Checking API health..."

# General health
response=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/health)
if [ $response -eq 200 ]; then
    echo "✅ API is healthy"
else
    echo "❌ API is unhealthy (HTTP $response)"
    exit 1
fi

# Readiness
response=$(curl -s -o /dev/null -w "%{http_code}" ${API_URL}/health/readiness)
if [ $response -eq 200 ]; then
    echo "✅ API is ready"
else
    echo "⚠️  API is not ready (HTTP $response)"
    exit 1
fi

echo "🎉 All health checks passed!"
```

**Usage**:
```bash
chmod +x scripts/check-health.sh
./scripts/check-health.sh
```

### CI/CD Pipeline

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test

  deploy:
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t retail-api:${{ github.sha }} -f apps/api/Dockerfile .

      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push retail-api:${{ github.sha }}

      - name: Deploy to server
        run: |
          ssh ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} << 'EOF'
            cd /app
            docker pull retail-api:${{ github.sha }}
            docker-compose down
            docker-compose up -d
            ./scripts/check-health.sh
          EOF
```

## Troubleshooting

### Common Issues

**1. High Memory Usage**
```bash
# Check memory metrics
curl http://localhost:3001/health

# Check logs
tail -f logs/combined-$(date +%Y-%m-%d).log | grep memory
```

**Solution**:
- Increase memory limits in Docker
- Check for memory leaks
- Review database connection pool size

**2. Database Connection Failures**
```bash
# Check database health
curl http://localhost:3001/health/readiness

# Check PostgreSQL
docker-compose exec postgres pg_isready -U retail_user
```

**Solution**:
- Verify DATABASE_URL environment variable
- Check PostgreSQL is running
- Verify network connectivity
- Check connection pool settings

**3. Slow API Responses**
```bash
# Check API metrics
curl http://localhost:3001/metrics

# Monitor logs
tail -f logs/combined-*.log | grep "duration"
```

**Solution**:
- Review slow query logs
- Add database indexes
- Enable Redis caching
- Review N+1 query problems

**4. Health Check Failing**
```bash
# Manual health check
curl -v http://localhost:3001/health

# Check logs
docker-compose logs api | tail -50
```

**Solution**:
- Verify all services are running
- Check service dependencies
- Review health check thresholds
- Ensure sufficient resources

### Log Analysis

**Find errors in last hour**:
```bash
grep "\"level\":\"error\"" logs/error-$(date +%Y-%m-%d).log | tail -20
```

**AFIP request failures**:
```bash
grep "\"context\":\"AFIP\"" logs/combined-*.log | grep "\"success\":false"
```

**Slow requests (> 1s)**:
```bash
grep "\"duration\"" logs/combined-*.log | awk -F'"duration":"' '{print $2}' | awk -F'ms' '$1 > 1000'
```

### Monitoring Best Practices

1. **Set up alerts**:
   - Error rate > 5%
   - Response time > 1s
   - Memory usage > 80%
   - Disk usage > 90%
   - Health check failures

2. **Regular monitoring**:
   - Check dashboards daily
   - Review error logs weekly
   - Analyze performance trends monthly
   - Update thresholds quarterly

3. **Incident response**:
   - Document all incidents
   - Perform post-mortems
   - Update runbooks
   - Improve monitoring based on learnings

## Production Checklist

Before deploying to production:

### Security
- [ ] All secrets in environment variables
- [ ] SSL/TLS certificates configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma)
- [ ] XSS protection (Helmet)

### Performance
- [ ] Database indexes created
- [ ] Redis caching enabled
- [ ] Gzip compression enabled
- [ ] CDN configured
- [ ] Load testing completed
- [ ] Connection pooling configured

### Monitoring
- [ ] Logging configured and tested
- [ ] Health checks implemented
- [ ] Metrics collection enabled
- [ ] Alerts configured
- [ ] Error tracking setup (optional: Sentry)

### Backup
- [ ] Automated database backups (daily)
- [ ] Retention policy defined (14+ days)
- [ ] Restore procedure documented
- [ ] Backup testing performed

### Documentation
- [ ] README updated
- [ ] API documentation (Swagger)
- [ ] Runbook created
- [ ] Architecture diagrams updated
- [ ] Deployment guide written

## Additional Resources

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Terminus Health Checks](https://docs.nestjs.com/recipes/terminus)
- [Prometheus Metrics](https://prometheus.io/docs/introduction/overview/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Health Checks](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)

---

**Last Updated**: 2025-11-02
**Version**: 1.0.0
