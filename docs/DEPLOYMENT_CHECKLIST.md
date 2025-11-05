# 🚀 Deployment Checklist

## Pre-Deployment

### Code Quality
- [ ] All tests passing (unit, integration, e2e)
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Code coverage > 80%
- [ ] Security audit passed (`pnpm audit`)
- [ ] No secrets in code (gitleaks scan)

### Code Review
- [ ] PR approved by at least 2 reviewers
- [ ] All comments addressed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated

### Database
- [ ] Migrations created and tested
- [ ] Migrations are reversible
- [ ] No breaking schema changes
- [ ] Database backup created
- [ ] Migration tested on staging

### Environment
- [ ] Environment variables updated
- [ ] Secrets rotated (if needed)
- [ ] SSL certificates valid (> 30 days)
- [ ] DNS records configured
- [ ] CDN cache cleared (if needed)

### Dependencies
- [ ] Dependencies updated
- [ ] Security vulnerabilities fixed
- [ ] Lock file updated
- [ ] Docker images built and tested

## Deployment

### Staging
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Verify critical functionality
- [ ] Performance testing
- [ ] Load testing (if significant changes)
- [ ] Staging approved for production

### Production
- [ ] Maintenance window scheduled (if needed)
- [ ] Stakeholders notified
- [ ] Monitoring alerts configured
- [ ] On-call engineer available
- [ ] Rollback plan documented

### Deploy Steps
- [ ] Tag release in Git
- [ ] Build Docker images
- [ ] Run database migrations
- [ ] Deploy API backend
- [ ] Deploy web frontend
- [ ] Update Nginx config (if needed)
- [ ] Clear application cache

## Post-Deployment

### Verification
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Web app loading
- [ ] WebSocket connections working
- [ ] Background jobs processing
- [ ] Email notifications working

### Monitoring
- [ ] Error rate normal (< 1%)
- [ ] Response time normal (< 500ms)
- [ ] CPU usage normal (< 70%)
- [ ] Memory usage normal (< 80%)
- [ ] Database connections healthy
- [ ] Queue workers processing

### Testing
- [ ] Smoke tests passed
- [ ] Critical user flows tested:
  - [ ] Login/Logout
  - [ ] Create sale (POS)
  - [ ] Add product
  - [ ] Generate invoice
  - [ ] View analytics
- [ ] Mobile app tested (if applicable)

### Communication
- [ ] Status page updated
- [ ] Stakeholders notified
- [ ] Documentation updated
- [ ] Release notes published
- [ ] Slack announcement sent

### Post-Mortem (if issues occurred)
- [ ] Incident documented
- [ ] Root cause identified
- [ ] Action items created
- [ ] Post-mortem meeting scheduled
