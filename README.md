# 🛍️ Retail Super App - Complete POS & Inventory System

[![CI/CD](https://github.com/your-org/retail-super-app/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/your-org/retail-super-app/actions)
[![codecov](https://codecov.io/gh/your-org/retail-super-app/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/retail-super-app)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Sistema completo de punto de venta e inventario para comercios minoristas en Argentina, con integración AFIP, Mercado Pago, analytics y más.

## 🌟 Features Completos

### Core Features
- ✅ **Multi-tenant**: Soporte para múltiples comercios
- ✅ **POS Web & Mobile**: Punto de venta completo con modo offline
- ✅ **Inventory Management**: Control completo de stock y productos
- ✅ **AFIP Integration**: Facturación electrónica homologada
- ✅ **Mercado Pago**: Pagos con QR y webhooks
- ✅ **Analytics Dashboard**: Métricas de negocio en tiempo real
- ✅ **Notifications**: Email, SMS, Push y WebSockets

### Technical Features
- 🏗️ **Monorepo**: Turborepo con pnpm workspaces
- 🐳 **Docker**: Containerizado y listo para producción
- 🚀 **CI/CD**: GitHub Actions con deployments automatizados
- 📊 **Monitoring**: Prometheus + Grafana + Sentry
- 🔒 **Security**: Rate limiting, CORS, Helmet, validación
- 💾 **Backup**: Automatizado con scripts de restore
- 🧪 **Testing**: Unit, integration y E2E tests

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+ (o usar Docker)
- Redis 7+ (o usar Docker)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/retail-super-app.git
cd retail-super-app

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.development
# Edit .env.development with your values

# Start databases with Docker
docker-compose -f docker-compose.dev.yml up -d

# Run migrations
pnpm --filter @retail/database prisma migrate dev

# Seed database (optional)
pnpm --filter @retail/database prisma db seed

# Start development servers
pnpm dev

# Or start individual apps
pnpm --filter @retail/api dev
pnpm --filter @retail/web dev
pnpm --filter @retail/mobile dev
```

### Access Applications

- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api
- **Mailhog** (email testing): http://localhost:8025
- **Redis Commander**: http://localhost:8081

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Runbook](docs/RUNBOOK.md)
- [Environment Variables](docs/ENVIRONMENT_VARIABLES.md)
- [Contributing](CONTRIBUTING.md)

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

## 🐳 Docker Deployment

### Development

```bash
docker-compose -f docker-compose.dev.yml up
```

### Production

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale api=3
```

## 📊 Monitoring

### Grafana Dashboards
- API Performance: http://grafana.retailsuperapp.com/d/api
- Business Metrics: http://grafana.retailsuperapp.com/d/business
- Infrastructure: http://grafana.retailsuperapp.com/d/infra

### Prometheus Metrics
- Metrics endpoint: http://api.retailsuperapp.com/metrics
- Prometheus UI: http://prometheus.retailsuperapp.com

### Error Tracking
- Sentry: https://sentry.io/organizations/your-org/projects/retail-super-app/

## 🔧 Scripts

```bash
# Development
pnpm dev                    # Start all apps
pnpm build                  # Build all apps
pnpm lint                   # Lint all code
pnpm type-check            # TypeScript check

# Database
pnpm db:migrate            # Run migrations
pnpm db:seed               # Seed database
pnpm db:studio             # Open Prisma Studio

# Deployment
pnpm deploy:staging        # Deploy to staging
pnpm deploy:production     # Deploy to production

# Maintenance
./scripts/backup-postgres.sh production
./scripts/restore-postgres.sh backup.sql.gz production
./scripts/health-check.sh production
./scripts/security-audit.sh
```

## 🏗️ Project Structure

```
retail-super-app/
├── apps/
│   ├── api/                 # NestJS backend
│   ├── web/                 # Next.js frontend
│   └── mobile/              # React Native app
├── packages/
│   ├── database/            # Prisma schema & migrations
│   ├── types/               # Shared TypeScript types
│   └── ui/                  # Shared UI components
├── scripts/                 # Deployment & maintenance scripts
├── docs/                    # Documentation
├── k8s/                     # Kubernetes manifests
├── nginx/                   # Nginx configuration
└── docker-compose.yml       # Docker composition
```

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 👥 Team

- **Product Owner**: [Name]
- **Tech Lead**: [Name]
- **Backend**: [Name]
- **Frontend**: [Name]
- **DevOps**: [Name]

## 📞 Support

- **Slack**: #retail-support
- **Email**: support@retailsuperapp.com
- **Documentation**: https://docs.retailsuperapp.com
- **Status Page**: https://status.retailsuperapp.com

## 🎯 Roadmap

- [ ] Multi-currency support
- [ ] Advanced analytics with ML
- [ ] WhatsApp integration
- [ ] Loyalty program
- [ ] E-commerce integration
- [ ] Multi-warehouse management
- [ ] Advanced reporting
- [ ] API marketplace

---

Made with ❤️ by the Retail Super App Team
