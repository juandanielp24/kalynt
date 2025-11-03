#!/bin/bash

set -e

echo "🚀 Starting Retail Super App Development Environment..."

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Iniciar Docker
echo -e "${BLUE}📦 Starting Docker containers...${NC}"
docker-compose up -d

# Esperar a que los servicios estén listos
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Verificar PostgreSQL
until docker exec retail-postgres pg_isready -U retail_user -d retail_app > /dev/null 2>&1; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done
echo -e "${GREEN}✅ PostgreSQL ready${NC}"

# Verificar Redis
until docker exec retail-redis redis-cli ping > /dev/null 2>&1; do
  echo "Waiting for Redis..."
  sleep 2
done
echo -e "${GREEN}✅ Redis ready${NC}"

# 2. Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
  echo -e "${BLUE}📚 Installing dependencies...${NC}"
  pnpm install
fi

# 3. Generar Prisma Client
echo -e "${BLUE}🔧 Generating Prisma Client...${NC}"
cd packages/database
pnpm db:generate
cd ../..

# 4. Ejecutar migraciones
echo -e "${BLUE}🗄️  Running database migrations...${NC}"
cd packages/database
pnpm db:migrate
cd ../..

# 5. Seed de datos (opcional)
read -p "Do you want to seed the database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}🌱 Seeding database...${NC}"
  cd packages/database
  pnpm db:seed
  cd ../..
fi

echo ""
echo -e "${GREEN}✅ Development environment ready!${NC}"
echo ""
echo "📊 Available services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - Adminer (DB GUI): http://localhost:8080"
echo "  - Redis Commander: http://localhost:8081"
echo "  - MailHog (Email): http://localhost:8025"
echo ""
echo "🚀 Start development servers:"
echo "  - API: pnpm --filter @retail/api dev"
echo "  - Web: pnpm --filter @retail/web dev"
echo "  - Mobile: pnpm --filter @retail/mobile start"
echo ""
echo "📚 Useful commands:"
echo "  - Stop services: docker-compose down"
echo "  - View logs: docker-compose logs -f"
echo "  - Reset DB: pnpm --filter @retail/database db:reset"
echo "  - Prisma Studio: pnpm --filter @retail/database db:studio"
