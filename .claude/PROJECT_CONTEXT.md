# Retail Super App - Contexto del Proyecto

## 🎯 Objetivo
Super app de gestión retail para PYMEs argentinas que integra POS, inventario, facturación electrónica AFIP, pagos digitales (Mercado Pago), y análisis empresarial.

## 🏗️ Arquitectura
- **Monorepo**: Turborepo + pnpm workspaces
- **Web**: Next.js 15 + shadcn/ui + TypeScript
- **Mobile**: React Native + Expo
- **Backend**: Node.js + NestJS + PostgreSQL + Redis
- **Auth**: better-auth
- **Cloud**: AWS (São Paulo region)

## 📐 Principios de Diseño
1. **Offline-First**: La app debe funcionar sin conexión
2. **Mobile-First**: UI optimizada para pantallas pequeñas
3. **Type-Safe**: TypeScript strict mode en todo
4. **Multi-Tenant**: Arquitectura por tenant con aislamiento de datos
5. **Compliance-First**: AFIP integrado desde día 1, no bolt-on

## 🌍 Multi-País
```
/apps/ar/  - Adaptadores Argentina (AFIP, Mercado Pago, IIBB)
/apps/cl/  - Chile (futuro)
```

## 📦 Estructura de Paquetes
- ✅ `@retail/shared` - Lógica de negocio compartida (COMPLETO)
  - Tipos: Tenant, User, Product, Common
  - Utilidades: Currency, Date, Validation, Errors
  - Constantes: Argentina (IVA, IIBB, Provincias), Roles
  - Config: Validación de env con Zod
- ✅ `@retail/ui` - Componentes shadcn compartidos (COMPLETO)
  - shadcn/ui: Button, Card, Dialog, Input, Table, Toast, Badge, Avatar, etc.
  - Custom: CurrencyInput, LoadingSpinner, EmptyState
  - Utils: cn() para merge de clases Tailwind
  - Tema: Light/Dark mode con CSS variables
- ✅ `@retail/database` - Prisma ORM y schemas (COMPLETO)
  - 9 modelos: Tenant, User, Location, Category, Product, Stock, Sale, SaleItem, AuditLog
  - Multi-tenancy con aislamiento por tenant_id
  - Montos en centavos (integers) para precisión
  - Soft deletes y auditoría integrada
  - Seed con datos de prueba
- ✅ `@retail/web` - Aplicación web Next.js 15 (COMPLETO - Base)
  - Next.js 15 con App Router
  - Layout components: Sidebar, Header
  - Routes: Dashboard, Login
  - State: React Query + Zustand (cart-store, ui-store)
  - API Client con TypeScript
  - Integración completa con @retail/ui y @retail/shared
- ✅ `@retail/mobile` - Aplicación móvil React Native + Expo (COMPLETO - Base)
  - Expo SDK 54 con React Native 0.81.5
  - Expo Router v4 para file-based routing
  - Offline-first con SQLite para cache
  - Tab navigation: POS, Inventario, Ventas, Más
  - State: React Query + Zustand (cart, auth, sync)
  - Componentes UI: Button, Card, Input, LoadingSpinner
  - Hooks: use-products, use-sales, use-offline-sync
  - Integración completa con @retail/shared
- `@retail/api-client` - Cliente API con React Query (DEPRECADO - usar API client en @retail/web)
- `@retail/types` - Tipos TypeScript compartidos (DEPRECADO - usar @retail/shared)

## 🔐 Autenticación
- **better-auth** con soporte multi-tenant
- JWT con `tenant_id` en claims
- Roles: owner, admin, cashier, viewer

## 💾 Base de Datos
- **PostgreSQL 14+**: Datos transaccionales con Prisma ORM
  - UUIDs para IDs (ordenables por tiempo)
  - Montos en centavos (INT) - nunca floats
  - Índices optimizados para multi-tenancy
  - Ver: `docs/architecture/database-schema.md`
- **Redis**: Cache + sessions + queues (futuro)
- **MongoDB**: Catálogos productos (opcional, futuro)

## 🚨 Reglas Críticas
1. ❌ NUNCA usar `float` para monedas - solo NUMERIC(19,4) o integers (centavos)
2. ✅ SIEMPRE manejar errores de red (offline-first)
3. ✅ SIEMPRE validar datos antes de guardar
4. ✅ SIEMPRE usar transacciones para operaciones críticas
5. ✅ SIEMPRE loggear acciones de auditoría

## 📚 Referencias Rápidas
- shadcn/ui: https://ui.shadcn.com/
- better-auth: https://better-auth.com/
- Next.js 15: https://nextjs.org/docs
- React Native: https://reactnative.dev/
- Turbo: https://turbo.build/repo/docs

## 📝 Última Actualización
2025-11-02 - Setup del monorepo y aplicaciones frontend completado
  - ✅ @retail/shared: Tipos, utilidades, constantes, validación de env
  - ✅ @retail/ui: 16 componentes shadcn + 3 custom components
  - ✅ @retail/database: Prisma ORM con 9 modelos, migraciones y seed
  - ✅ @retail/web: Next.js 15 App Router con dashboard base y login
  - ✅ @retail/mobile: React Native + Expo con POS offline-first

## 🎯 Próximos Pasos
1. **Aplicación Web** - Páginas adicionales
   - Punto de Venta (POS) con carrito y pagos
   - Gestión de Inventario (productos, stock, movimientos)
   - Historial de Ventas y detalles
   - Gestión de Clientes
   - Dashboard de Reportes con gráficos
   - Configuración del sistema
2. **Aplicación Móvil** - Funcionalidades adicionales
   - Escáner de códigos de barras con cámara
   - Procesamiento completo de ventas
   - Sincronización robusta con retry logic
   - Impresión de tickets Bluetooth
   - Gestión de inventario completa
   - Reportes y analytics
3. **Backend API** - NestJS
   - API REST con validación Zod
   - Autenticación con better-auth
   - Endpoints CRUD para todas las entidades
   - Integración con Prisma
   - Cache con Redis
   - WebSockets para real-time updates
4. **Integraciones Argentina**
   - AFIP: Facturación electrónica
   - Mercado Pago: Pagos digitales
   - IIBB: Percepciones por provincia
