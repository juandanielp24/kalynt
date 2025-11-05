# Production Runbook - Retail Super App

## 📚 Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Deployment Process](#deployment-process)
3. [Common Operations](#common-operations)
4. [Incident Response](#incident-response)
5. [Monitoring & Alerts](#monitoring--alerts)
6. [Backup & Recovery](#backup--recovery)

---

## Architecture Overview

### Services
- **API Backend**: NestJS application (Port 3001)
- **Web Frontend**: Next.js application (Port 3000)
- **PostgreSQL**: Primary database (Port 5432)
- **Redis**: Cache and queue system (Port 6379)
- **Nginx**: Reverse proxy and load balancer (Ports 80, 443)

### Infrastructure
- **Hosting**: Railway / AWS ECS / Kubernetes
- **CDN**: Cloudflare
- **Monitoring**: Grafana + Prometheus
- **Error Tracking**: Sentry
- **Log Aggregation**: CloudWatch / Datadog

---

## Deployment Process

### Pre-deployment Checklist
- [ ] All tests passing (unit, integration, e2e)
- [ ] Code review approved
- [ ] Database migrations tested
- [ ] Environment variables updated
- [ ] Backup created
- [ ] Maintenance window scheduled (if needed)

### Deployment Steps

#### 1. Zero-Downtime Deployment (Rolling Update)
```bash
# 1. Pull latest changes
git pull origin main

# 2. Build Docker images
docker-compose build

# 3. Run database migrations
docker-compose run api pnpm prisma migrate deploy

# 4. Update services one by one
docker-compose up -d --no-deps --build api
docker-compose up -d --no-deps --build web

# 5. Verify health
curl https://api.retailsuperapp.com/health
curl https://retailsuperapp.com
```

#### 2. Kubernetes Deployment
```bash
# 1. Update image tags
kubectl set image deployment/retail-api api=your-registry/retail-api:v1.2.3
kubectl set image deployment/retail-web web=your-registry/retail-web:v1.2.3

# 2. Monitor rollout
kubectl rollout status deployment/retail-api
kubectl rollout status deployment/retail-web

# 3. Verify pods
kubectl get pods -l app=retail-api
kubectl get pods -l app=retail-web
```

### Rollback Procedure
```bash
# Docker Compose
docker-compose down
git checkout <previous-commit>
docker-compose up -d

# Kubernetes
kubectl rollout undo deployment/retail-api
kubectl rollout undo deployment/retail-web
```

---

## Common Operations

### Scaling

#### Horizontal Scaling (Add more instances)
```bash
# Docker Compose
docker-compose up -d --scale api=3

# Kubernetes
kubectl scale deployment retail-api --replicas=5
```

#### Vertical Scaling (Increase resources)
```yaml
# Update docker-compose.yml or k8s deployment
resources:
  limits:
    memory: "2Gi"
    cpu: "1000m"
```

### Database Operations

#### Run Migrations
```bash
# Production
docker-compose run api pnpm prisma migrate deploy

# Or via kubectl
kubectl exec -it <pod-name> -- pnpm prisma migrate deploy
```

#### Create Database Backup
```bash
./scripts/backup-postgres.sh production
```

#### Restore from Backup
```bash
./scripts/restore-postgres.sh /backups/postgres/retail_db_production_20240101_120000.sql.gz production
```

### Cache Management

#### Clear Redis Cache
```bash
# Clear all cache
redis-cli -h redis -a ${REDIS_PASSWORD} FLUSHDB

# Clear specific keys
redis-cli -h redis -a ${REDIS_PASSWORD} DEL "cache:products:*"
```

#### Restart Queue Workers
```bash
docker-compose restart api
```

---

## Incident Response

### High Response Time

**Symptoms:** API response time > 2s

**Investigation:**
1. Check Grafana dashboard for bottlenecks
2. Review slow query logs in PostgreSQL
3. Check Redis connection
4. Monitor CPU/Memory usage

**Actions:**
```bash
# 1. Check database connections
docker exec postgres psql -U retail -c "SELECT count(*) FROM pg_stat_activity;"

# 2. Analyze slow queries
docker exec postgres psql -U retail -c "SELECT query, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# 3. Restart API if needed
docker-compose restart api
```

### Database Connection Errors

**Symptoms:** "connection refused" or "too many clients"

**Investigation:**
1. Check PostgreSQL logs
2. Verify connection pool settings
3. Check database server status

**Actions:**
```bash
# 1. Check PostgreSQL status
docker exec postgres pg_isready

# 2. Check active connections
docker exec postgres psql -U retail -c "SELECT count(*) FROM pg_stat_activity;"

# 3. Kill idle connections if needed
docker exec postgres psql -U retail -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < now() - interval '30 minutes';"

# 4. Restart PostgreSQL (last resort)
docker-compose restart postgres
```

### Out of Memory

**Symptoms:** Container restarts, OOM errors

**Investigation:**
1. Check memory usage in Grafana
2. Review heap dumps
3. Check for memory leaks

**Actions:**
```bash
# 1. Check memory usage
docker stats

# 2. Generate heap snapshot (Node.js)
docker exec api node --expose-gc --inspect=0.0.0.0:9229 dist/main.js

# 3. Increase memory limits (docker-compose.yml)
deploy:
  resources:
    limits:
      memory: 2G

# 4. Restart service
docker-compose restart api
```

### Certificate Expiry

**Symptoms:** SSL certificate expired

**Actions:**
```bash
# 1. Check certificate expiry
openssl x509 -enddate -noout -in nginx/ssl/fullchain.pem

# 2. Renew with Certbot
certbot renew --nginx

# 3. Reload Nginx
docker-compose exec nginx nginx -s reload
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **API Health**
   - Response time (p50, p95, p99)
   - Error rate (4xx, 5xx)
   - Request rate (rps)
   - Active connections

2. **Database**
   - Query performance
   - Connection pool usage
   - Replication lag (if applicable)
   - Disk usage

3. **Infrastructure**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network bandwidth

4. **Business Metrics**
   - Sales rate
   - Active users
   - Revenue
   - Failed transactions

### Access Monitoring Tools

- **Grafana**: https://grafana.retailsuperapp.com
- **Prometheus**: https://prometheus.retailsuperapp.com
- **Sentry**: https://sentry.io/organizations/your-org/projects/retail-super-app/
- **Logs**: `docker-compose logs -f api` or CloudWatch

---

## Backup & Recovery

### Automated Backups

Backups run daily at 2:00 AM UTC via cron:
```
0 2 * * * /opt/retail/scripts/automated-backup-cron.sh
```

### Backup Locations
- **Local**: `/backups/` directory
- **S3**: `s3://retail-backups/postgres/` and `s3://retail-backups/redis/`
- **Retention**: 30 days for PostgreSQL, 7 days for Redis

### Disaster Recovery Plan

#### RTO (Recovery Time Objective): 1 hour
#### RPO (Recovery Point Objective): 24 hours

**Recovery Steps:**

1. **Assess the situation**
   - Identify the scope of the incident
   - Determine if full recovery is needed

2. **Prepare new environment** (if infrastructure is lost)
   ```bash
   # Deploy infrastructure
   terraform apply -var-file=production.tfvars
   ```

3. **Restore database**
   ```bash
   # Download latest backup from S3
   aws s3 cp s3://retail-backups/postgres/latest.sql.gz ./

   # Restore
   ./scripts/restore-postgres.sh ./latest.sql.gz production
   ```

4. **Deploy application**
   ```bash
   # Deploy latest stable version
   docker-compose up -d
   ```

5. **Verify and test**
   ```bash
   # Run smoke tests
   curl https://api.retailsuperapp.com/health

   # Verify critical functionality
   # - Login
   # - POS
   # - Inventory
   ```

6. **Communicate**
   - Update status page
   - Notify stakeholders
   - Post-mortem meeting

---

## Contact Information

### On-Call Rotation
- **Primary**: [PagerDuty schedule]
- **Secondary**: [PagerDuty schedule]
- **Escalation**: CTO

### Emergency Contacts
- **Slack**: #retail-incidents
- **Email**: incidents@retailsuperapp.com
- **Phone**: [Emergency number]

### External Services
- **Railway Support**: support@railway.app
- **AWS Support**: [Support case]
- **Cloudflare**: [Support portal]
