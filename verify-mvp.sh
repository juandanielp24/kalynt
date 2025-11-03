#!/bin/bash

echo "🔍 Verificando MVP Retail Super App..."
echo ""

# 1. Docker services
echo "1. Verificando servicios Docker..."
docker ps | grep -q retail-postgres && echo "✅ PostgreSQL corriendo" || echo "❌ PostgreSQL no está corriendo"
docker ps | grep -q retail-redis && echo "✅ Redis corriendo" || echo "❌ Redis no está corriendo"
echo ""

# 2. Health checks
echo "2. Verificando health checks..."
curl -s http://localhost:3001/health > /dev/null && echo "✅ API health OK" || echo "❌ API no responde"
curl -s http://localhost:3001/health/readiness > /dev/null && echo "✅ API ready" || echo "❌ API not ready"
echo ""

# 3. Web app
echo "3. Verificando Web App..."
curl -s http://localhost:3000 > /dev/null && echo "✅ Web app corriendo" || echo "❌ Web app no responde"
echo ""

# 4. Database
echo "4. Verificando base de datos..."
docker exec retail-postgres psql -U retail_user -d retail_app -c "SELECT COUNT(*) FROM tenants;" > /dev/null 2>&1 && echo "✅ Database con datos" || echo "❌ Database error"
echo ""

# 5. Tests
echo "5. Ejecutando tests..."
pnpm test:unit > /dev/null 2>&1 && echo "✅ Unit tests passing" || echo "⚠️  Some unit tests failing"
echo ""

echo "✅ Verificación completada!"
echo ""
echo "Para iniciar desarrollo:"
echo "  - API: pnpm dev:api (http://localhost:3001)"
echo "  - Web: pnpm dev:web (http://localhost:3000)"
echo "  - Mobile: pnpm dev:mobile"
echo ""
echo "Herramientas:"
echo "  - DB GUI: http://localhost:8080 (Adminer)"
echo "  - Redis GUI: http://localhost:8081"
echo "  - Email: http://localhost:8025 (MailHog)"
