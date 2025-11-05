import { Injectable } from '@nestjs/common';
import { register, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class PrometheusService {
  // HTTP metrics
  public readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  public readonly httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5],
  });

  // Database metrics
  public readonly dbQueriesTotal = new Counter({
    name: 'db_queries_total',
    help: 'Total number of database queries',
    labelNames: ['operation', 'table'],
  });

  public readonly dbQueryDuration = new Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['operation', 'table'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1],
  });

  // Business metrics
  public readonly salesTotal = new Counter({
    name: 'sales_total',
    help: 'Total number of sales',
    labelNames: ['payment_method', 'tenant_id'],
  });

  public readonly salesRevenue = new Counter({
    name: 'sales_revenue_cents',
    help: 'Total revenue in cents',
    labelNames: ['tenant_id'],
  });

  public readonly activeUsers = new Gauge({
    name: 'active_users',
    help: 'Number of active users',
    labelNames: ['tenant_id'],
  });

  // Queue metrics
  public readonly queueJobsTotal = new Counter({
    name: 'queue_jobs_total',
    help: 'Total number of queue jobs',
    labelNames: ['queue', 'status'],
  });

  public readonly queueJobDuration = new Histogram({
    name: 'queue_job_duration_seconds',
    help: 'Duration of queue jobs in seconds',
    labelNames: ['queue', 'job_name'],
    buckets: [1, 5, 10, 30, 60],
  });

  getMetrics() {
    return register.metrics();
  }

  clearMetrics() {
    register.clear();
  }
}
