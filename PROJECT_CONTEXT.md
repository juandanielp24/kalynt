# Retail Super App - Contexto del Proyecto

Monorepo completo para una aplicación de retail multi-tenant con POS, inventario, ventas y gestión de clientes.

## Información General

- **Nombre**: Retail Super App
- **Tipo**: Monorepo (pnpm workspaces + Turborepo)
- **Arquitectura**: Multi-tenant
- **Stack**: TypeScript, React, React Native, NestJS, PostgreSQL, Redis

## Estructura del Monorepo

```
kalynt/
├── apps/
│   ├── web/              # Next.js 15 App Router (Admin/Dashboard)
│   ├── mobile/           # React Native + Expo (POS Móvil)
│   └── api/              # NestJS Backend API
├── packages/
│   ├── shared/           # Lógica de negocio compartida
│   ├── ui/               # Componentes UI (shadcn)
│   └── database/         # Prisma ORM + Schemas
├── docs/                 # Documentación
├── pnpm-workspace.yaml
└── turbo.json
```

## Paquetes Workspace

### @retail/shared (PROMPT 1)

**Ubicación**: `packages/shared/`

Lógica de negocio compartida entre todas las aplicaciones.

**Contenido:**
- **Types**: Tipos TypeScript compartidos (Product, Sale, User, Tenant, etc.)
- **Utils**: Utilidades (formatters, validators, calculators)
- **Constants**: Constantes del negocio (TAX_RATES, PAYMENT_METHODS, USER_ROLES)
- **Validation Schemas**: Zod schemas para validación

**Características:**
- 100% TypeScript
- Zero dependencies (solo dev dependencies)
- Tree-shakeable exports
- Validación con Zod

**Principales exports:**
```typescript
// Types
export type { Product, Sale, User, Tenant, Category, Stock }

// Utils
export { formatCurrency, formatDate, calculateTax, calculateTotal }

// Constants
export { TAX_RATES, PAYMENT_METHODS, USER_ROLES, SALE_STATUS }

// Schemas
export { productSchema, saleSchema, userSchema }
```

**Scripts:**
- `pnpm build`: Build con tsup
- `pnpm typecheck`: Verificación de tipos
- `pnpm test`: Tests con Vitest

---

### @retail/ui (PROMPT 2)

**Ubicación**: `packages/ui/`

Componentes UI reutilizables basados en shadcn/ui.

**Stack:**
- React 19
- Tailwind CSS 4
- Radix UI
- class-variance-authority (cva)

**Componentes implementados:**
```typescript
// Form Components
- Button (variants: default, destructive, outline, ghost, link)
- Input
- Select
- Checkbox
- Label
- Textarea
- Form (React Hook Form integration)

// Layout
- Card (Card, CardHeader, CardContent, CardFooter)
- Separator
- Badge

// Feedback
- Alert
- Toast
- Dialog

// Data Display
- Table (Table, TableHeader, TableBody, TableRow, TableCell)
- Avatar
```

**Uso:**
```typescript
import { Button, Card, Input } from '@retail/ui';

<Card>
  <CardHeader>
    <h2>Producto</h2>
  </CardHeader>
  <CardContent>
    <Input placeholder="Nombre" />
  </CardContent>
  <CardFooter>
    <Button>Guardar</Button>
  </CardFooter>
</Card>
```

**Scripts:**
- `pnpm build`: Build componentes
- `pnpm typecheck`: Verificación de tipos
- `pnpm lint`: ESLint

---

### @retail/database (PROMPT 3)

**Ubicación**: `packages/database/`

Capa de datos con Prisma ORM para PostgreSQL.

**Proveedor**: PostgreSQL
**ORM**: Prisma 6

**Modelos (9 en total):**

1. **Tenant** - Multi-tenancy
   - id, name, slug, settings

2. **User** - Usuarios del sistema
   - id, email, password, name, role, tenantId
   - Roles: ADMIN, MANAGER, CASHIER

3. **Category** - Categorías de productos
   - id, name, tenantId

4. **Product** - Productos
   - id, sku, name, description, costCents, priceCents, taxRate
   - barcode, imageUrl, categoryId, tenantId
   - Soft delete (deletedAt)

5. **Stock** - Inventario por ubicación
   - id, productId, locationId, quantity, minQuantity, tenantId

6. **Location** - Sucursales/Almacenes
   - id, name, address, tenantId

7. **Sale** - Ventas
   - id, saleNumber, subtotalCents, taxCents, discountCents, totalCents
   - status, paymentMethod, customerId, tenantId

8. **SaleItem** - Items de venta
   - id, saleId, productId, quantity, unitPriceCents, taxRate

9. **Customer** - Clientes
   - id, name, email, phone, address, taxId, tenantId

**Características:**
- Multi-tenant por diseño (todas las tablas tienen tenantId)
- Dinero en centavos (integers) para precisión
- Soft deletes donde aplica
- Índices optimizados
- Relaciones bien definidas

**Scripts:**
```bash
pnpm db:generate    # Generar Prisma Client
pnpm db:push        # Push schema a DB (dev)
pnpm db:migrate     # Crear migración
pnpm db:studio      # Abrir Prisma Studio
pnpm db:seed        # Seed data (opcional)
```

**Uso en apps:**
```typescript
import { PrismaClient } from '@retail/database';

const prisma = new PrismaClient();
const products = await prisma.product.findMany({
  where: { tenantId: 'xyz' }
});
```

---

## Aplicaciones

### @retail/web (PROMPT 4)

**Ubicación**: `apps/web/`

Dashboard administrativo con Next.js 15.

**Stack:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Workspace packages: @retail/shared, @retail/ui, @retail/database

**Estructura:**
```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── layout.tsx          # Layout con sidebar
│   ├── page.tsx            # Dashboard home
│   ├── products/           # CRUD de productos
│   ├── sales/              # Listado de ventas
│   ├── inventory/          # Gestión de stock
│   ├── customers/          # Gestión de clientes
│   └── settings/           # Configuración
├── api/                    # API Routes (proxy opcional)
└── layout.tsx              # Root layout
```

**Características:**
- Server Components por defecto
- React Server Actions para mutations
- Autenticación con middleware
- Multi-tenant (tenantId en cookies/session)
- Integración con @retail/ui para componentes
- React Hook Form + Zod para formularios
- TanStack Table para tablas de datos

**Páginas implementadas:**

1. **Login** (`/login`)
   - Formulario de autenticación
   - Redirección a dashboard

2. **Dashboard** (`/dashboard`)
   - Resumen de ventas del día
   - Gráficos de ventas
   - Productos con bajo stock
   - Ventas recientes

3. **Productos** (`/dashboard/products`)
   - Tabla con paginación, búsqueda, filtros
   - Modal para crear/editar
   - Soft delete
   - Gestión de categorías

4. **Ventas** (`/dashboard/sales`)
   - Listado de ventas
   - Filtros por fecha, estado
   - Detalle de venta
   - Exportar a PDF/Excel (futuro)

5. **Inventario** (`/dashboard/inventory`)
   - Stock por ubicación
   - Alertas de stock mínimo
   - Movimientos de stock
   - Transferencias entre ubicaciones

**Scripts:**
```bash
pnpm dev        # Desarrollo (localhost:3000)
pnpm build      # Build para producción
pnpm start      # Producción
pnpm lint       # ESLint
pnpm typecheck  # TypeScript check
```

**Variables de entorno:**
```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

---

### @retail/mobile (PROMPT 5)

**Ubicación**: `apps/mobile/`

Aplicación móvil POS con React Native y Expo.

**Stack:**
- Expo SDK 54
- React Native 0.81.5
- Expo Router v4 (file-based routing)
- TypeScript
- Offline-first (SQLite)
- React Query + Zustand

**Estructura:**
```
app/
├── _layout.tsx              # Root layout + QueryClient
├── (auth)/
│   ├── _layout.tsx
│   └── login.tsx
└── (tabs)/
    ├── _layout.tsx          # Tab navigation
    ├── index.tsx            # POS (venta)
    ├── inventory.tsx        # Inventario
    ├── sales.tsx            # Historial ventas
    └── more.tsx             # Más opciones
```

**Características principales:**

1. **Offline-first**
   - SQLite para caché local
   - React Query con fallback a SQLite
   - Cola de sincronización (pending_sales)
   - Sincronización automática al reconectar

2. **Navegación**
   - Expo Router v4 (file-based)
   - 4 tabs: POS, Inventario, Ventas, Más
   - Stack navigation para detalles

3. **State Management**
   - React Query: Server state
   - Zustand: Client state (cart, auth, sync)
   - AsyncStorage: Persistencia

4. **Pantallas implementadas:**

   **POS (Punto de Venta)** (`app/(tabs)/index.tsx`)
   - Grid de productos
   - Búsqueda en tiempo real
   - Botón de scanner (cámara)
   - Carrito flotante
   - Checkout rápido
   - Offline support

   **Inventario** (`app/(tabs)/inventory.tsx`)
   - Lista de productos
   - Stock por ubicación
   - Filtros y búsqueda
   - Alertas de stock bajo

   **Ventas** (`app/(tabs)/sales.tsx`)
   - Historial de ventas
   - Filtros por fecha
   - Detalle de venta
   - Indicador de sync pendiente

   **Más** (`app/(tabs)/more.tsx`)
   - Perfil de usuario
   - Cambio de tenant
   - Sincronización manual
   - Configuración
   - Logout

5. **Componentes custom:**
   ```
   components/
   ├── ProductCard.tsx      # Card de producto
   ├── Cart.tsx             # Carrito de compras
   ├── Button.tsx           # Botón personalizado
   ├── Card.tsx             # Card genérico
   ├── Input.tsx            # Input de texto
   └── LoadingSpinner.tsx   # Spinner de carga
   ```

6. **Stores (Zustand):**
   ```
   store/
   ├── cart-store.ts        # Carrito de compras
   ├── auth-store.ts        # Autenticación
   └── sync-store.ts        # Estado de sincronización
   ```

7. **Hooks (React Query):**
   ```
   hooks/
   ├── use-products.ts      # Query productos
   ├── use-sales.ts         # Query/Mutation ventas
   └── use-offline-sync.ts  # Sincronización
   ```

8. **Database (SQLite):**
   ```sql
   -- Tables
   products        # Caché de productos
   pending_sales   # Cola de ventas sin sincronizar
   sync_log        # Log de sincronizaciones
   ```

**Scripts:**
```bash
pnpm start              # Iniciar Expo
pnpm android            # Abrir en Android
pnpm ios                # Abrir en iOS
pnpm web                # Web (experimental)
```

**Dependencias clave:**
- `expo-router`: Routing
- `expo-sqlite`: Database local
- `@tanstack/react-query`: Server state
- `zustand`: Client state
- `axios`: HTTP client
- `@react-native-async-storage/async-storage`: Persistencia
- `lucide-react-native`: Iconos

**Offline Strategy:**
```typescript
// 1. Intentar fetch del servidor
// 2. Si falla, leer de SQLite cache
// 3. Guardar en pending_sales si es mutation
// 4. Sincronizar cuando vuelva conexión

const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: async () => {
    try {
      const response = await apiClient.get('/products');
      saveProductsCache(response.data); // Guardar en SQLite
      return response.data;
    } catch (error) {
      // Fallback a cache
      return getProductsCache();
    }
  },
});
```

---

### @retail/api (PROMPT 6)

**Ubicación**: `apps/api/`

Backend API con NestJS 11.

**Stack:**
- NestJS 11
- PostgreSQL (via @retail/database)
- Redis
- TypeScript
- Prisma ORM

**Arquitectura:**
```
src/
├── main.ts                  # Bootstrap
├── app.module.ts            # Root module
├── common/                  # Utilidades compartidas
│   ├── guards/
│   │   └── tenant.guard.ts          # Multi-tenant isolation
│   ├── interceptors/
│   │   ├── logging.interceptor.ts   # HTTP logging
│   │   └── transform.interceptor.ts # Response format
│   ├── filters/
│   │   └── http-exception.filter.ts # Error handling
│   ├── decorators/
│   └── types/
├── shared/                  # Módulos compartidos
│   ├── database/
│   │   └── database.module.ts       # Prisma provider
│   └── redis/
│       └── redis.module.ts          # Redis provider
└── modules/                 # Feature modules
    ├── auth/                # Autenticación
    ├── tenants/             # Gestión de tenants
    ├── products/            # CRUD productos
    └── sales/               # Gestión de ventas
```

**Módulos implementados:**

1. **AuthModule** (`src/modules/auth/`)
   - `POST /api/v1/auth/login` - Login con bcrypt
   - `POST /api/v1/auth/register` - Registro de usuario
   - TODO: JWT real, refresh tokens

2. **TenantsModule** (`src/modules/tenants/`)
   - `GET /api/v1/tenants/:id` - Obtener tenant
   - TODO: CRUD completo

3. **ProductsModule** (`src/modules/products/`)  ✅ COMPLETO
   - `GET /api/v1/products` - Listar con paginación, búsqueda, filtros
   - `GET /api/v1/products/:id` - Obtener por ID
   - `POST /api/v1/products` - Crear (con stock inicial en transacción)
   - `PATCH /api/v1/products/:id` - Actualizar
   - `DELETE /api/v1/products/:id` - Soft delete
   - DTOs completos con validación
   - Soft delete support
   - Multi-tenant isolation

4. **SalesModule** (`src/modules/sales/`)
   - `GET /api/v1/sales` - Listar ventas
   - `GET /api/v1/sales/:id` - Detalle de venta
   - `POST /api/v1/sales` - Crear venta
   - TODO: Validar stock, descontar inventario, AFIP, pagos

**Características clave:**

1. **Multi-tenant con TenantGuard**
   ```typescript
   @Controller('products')
   @UseGuards(TenantGuard)
   export class ProductsController {
     // Todas las rutas requieren header: x-tenant-id
   }
   ```

2. **Response estandarizado (TransformInterceptor)**
   ```json
   {
     "success": true,
     "data": { ... },
     "meta": { page: 1, limit: 20, total: 100 }
   }
   ```

3. **Error handling global (HttpExceptionFilter)**
   ```json
   {
     "success": false,
     "statusCode": 400,
     "message": "Error message",
     "error": "Bad Request",
     "timestamp": "2025-01-15T10:00:00.000Z"
   }
   ```

4. **Logging (LoggingInterceptor)**
   - Registra todas las HTTP requests
   - Tiempo de respuesta
   - Método, URL, status code

5. **Seguridad**
   - Helmet (headers security)
   - CORS configurado
   - Rate limiting (Throttler)
   - Compression
   - Validation pipes global

6. **Database access**
   ```typescript
   @Injectable()
   export class ProductsService {
     constructor(@Inject('PRISMA') private prisma: PrismaClient) {}

     async findAll(tenantId: string) {
       return this.prisma.product.findMany({
         where: { tenantId, deletedAt: null }
       });
     }
   }
   ```

**Scripts:**
```bash
pnpm dev        # Desarrollo (localhost:3001)
pnpm build      # Build para producción
pnpm start:prod # Producción
pnpm lint       # ESLint
pnpm test       # Tests unitarios
pnpm test:e2e   # Tests e2e
```

**Variables de entorno:**
```bash
NODE_ENV=development
PORT=3001
DATABASE_URL="postgresql://..."
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET="change-in-production"
CORS_ORIGIN="http://localhost:3000"
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

**API Base URL:**
```
http://localhost:3001/api/v1
```

**Documentación:**
Ver `docs/api/README.md` para documentación completa de endpoints.

---

## Configuración Multi-Tenant

Todas las aplicaciones soportan multi-tenancy:

### Database
- Todas las tablas tienen campo `tenantId`
- RLS (Row Level Security) a nivel de aplicación
- Índices compuestos con `tenantId`

### API
- Header `x-tenant-id` obligatorio
- TenantGuard valida acceso
- Todos los queries filtran por tenantId

### Web
- TenantId en session/cookies
- Middleware de Next.js valida
- API calls incluyen x-tenant-id header

### Mobile
- TenantId en AsyncStorage
- Interceptor de Axios agrega header
- Cambio de tenant en pantalla More

---

## Flujo de Datos

### Venta típica (POS Mobile → API → Database)

1. **Usuario agrega productos al carrito** (Mobile)
   - Zustand cart-store actualiza state
   - AsyncStorage persiste carrito

2. **Usuario completa venta** (Mobile)
   - `useSales().createSale()`
   - Si online: POST /api/v1/sales
   - Si offline: Guardar en pending_sales (SQLite)

3. **API recibe request** (Backend)
   - TenantGuard valida x-tenant-id
   - Validation pipe valida DTO
   - SalesService.create()

4. **Service procesa venta** (Backend)
   - Transacción Prisma:
     - Crear Sale
     - Crear SaleItems
     - Descontar Stock (TODO)
     - Generar factura AFIP (TODO)

5. **Response al mobile** (Backend)
   - TransformInterceptor formatea response
   - LoggingInterceptor registra request

6. **Mobile actualiza UI** (Mobile)
   - React Query invalida cache
   - Limpiar carrito
   - Mostrar confirmación

7. **Sincronización offline** (Mobile)
   - Al reconectar, `useOfflineSync()` procesa pending_sales
   - Envía ventas pendientes
   - Actualiza sync_log

---

## Tecnologías Principales

### Frontend
- **React 19**: UI library
- **Next.js 15**: Web framework (App Router)
- **React Native**: Mobile framework
- **Expo 54**: Mobile tooling
- **Tailwind CSS 4**: Styling
- **shadcn/ui**: Component library
- **Radix UI**: Primitives

### Backend
- **NestJS 11**: Node.js framework
- **Prisma 6**: ORM
- **PostgreSQL**: Database
- **Redis**: Cache & sessions

### State Management
- **React Query**: Server state
- **Zustand**: Client state
- **React Hook Form**: Form state

### Validation
- **Zod**: Schema validation (@retail/shared)
- **class-validator**: DTO validation (API)

### Build Tools
- **Turborepo**: Monorepo orchestration
- **pnpm**: Package manager
- **tsup**: TypeScript bundler
- **tsconfig**: TypeScript configuration

---

## Convenciones de Código

### Naming
- **Archivos**: kebab-case (`product-card.tsx`)
- **Componentes**: PascalCase (`ProductCard`)
- **Funciones/Variables**: camelCase (`getUserById`)
- **Constants**: UPPER_SNAKE_CASE (`TAX_RATE`)
- **Types/Interfaces**: PascalCase (`Product`, `SaleItem`)

### Money Handling
```typescript
// ✅ SIEMPRE usar centavos (integers)
const priceCents = 100000; // $1000.00

// ❌ NUNCA usar floats para dinero
const price = 1000.00; // NO!

// Formatear para display
const formatted = formatCurrency(priceCents); // "$1,000.00"
```

### Dates
```typescript
// ✅ SIEMPRE usar ISO strings o Date objects
const createdAt = new Date();
const isoString = "2025-01-15T10:00:00.000Z";

// Formatear con formatDate de @retail/shared
const formatted = formatDate(createdAt, 'DD/MM/YYYY');
```

### Multi-tenant Queries
```typescript
// ✅ SIEMPRE filtrar por tenantId
const products = await prisma.product.findMany({
  where: { tenantId, deletedAt: null }
});

// ❌ NUNCA queries sin tenantId
const products = await prisma.product.findMany(); // PELIGRO!
```

---

## Scripts Globales (Root)

```bash
# Desarrollo (todos los workspaces)
pnpm dev

# Build (todos los workspaces)
pnpm build

# Linting
pnpm lint

# Type checking
pnpm typecheck

# Tests
pnpm test

# Específico por workspace
pnpm --filter @retail/web dev
pnpm --filter @retail/api build
pnpm --filter @retail/shared test
```

---

## Próximos Pasos

### Backend (API)
- [ ] Implementar JWT completo con refresh tokens
- [ ] Completar Sales module (validar stock, descontar inventario)
- [ ] Implementar Customers module
- [ ] Implementar Inventory module (stock movements)
- [ ] Integración AFIP (facturación electrónica)
- [ ] Integración Mercado Pago
- [ ] Agregar Swagger/OpenAPI
- [ ] Tests unitarios y e2e
- [ ] RBAC (Role-Based Access Control)
- [ ] Audit logs

### Mobile
- [ ] Implementar scanner de códigos de barras
- [ ] Mejorar offline sync (retry logic, conflicts)
- [ ] Push notifications
- [ ] Biometric authentication
- [ ] Print receipts (Bluetooth printer)
- [ ] Exportar ventas a Excel/PDF

### Web
- [ ] Dashboard con gráficos (Chart.js/Recharts)
- [ ] Reportes avanzados
- [ ] Exportación de datos
- [ ] Gestión de usuarios y roles
- [ ] Configuración de tenant (logo, colores, etc.)
- [ ] Integraciones (Mercado Pago, AFIP)

### General
- [ ] CI/CD pipelines
- [ ] Docker compose para desarrollo
- [ ] Kubernetes para producción
- [ ] Monitoring (Sentry, Datadog)
- [ ] Documentation site (Docusaurus)

---

## Autenticación y Autorización (PROMPT 7)

### Sistema Implementado

**Stack:**
- better-auth (backend)
- Custom React hooks + Context API (frontend)
- HTTP-only cookies para sesiones
- Sistema RBAC (Role-Based Access Control)

### Roles Disponibles

| Rol | Permisos |
|-----|----------|
| OWNER | Acceso total a todo |
| ADMIN | Casi todos los permisos (sin configuración crítica) |
| CASHIER | POS, inventario (lectura), ventas, clientes |
| VIEWER | Solo lectura en la mayoría de módulos |

### Permisos Implementados

```typescript
// Sistema de permisos granular
'pos:read', 'pos:write', 'pos:refund'
'inventory:read', 'inventory:write', 'inventory:adjust'
'sales:read', 'sales:export'
'customers:read', 'customers:write'
'users:read', 'users:write', 'users:delete'
'settings:read', 'settings:write'
'reports:read', 'reports:advanced'
```

### Ubicación del Código

**Shared (`packages/shared/src/auth/`):**
- `auth.types.ts` - Tipos TypeScript (AuthUser, Session, etc.)
- `permissions.ts` - Sistema RBAC con funciones de verificación
- `index.ts` - Exports

**Backend (`apps/api/src/modules/auth/`):**
- `better-auth.config.ts` - Configuración de better-auth
- `auth.service.ts` - Lógica de negocio (register, login, logout)
- `auth.controller.ts` - Endpoints REST
- `auth.guard.ts` - Guard de autenticación

**Frontend (`apps/web/src/lib/auth/`):**
- `client.ts` - Cliente HTTP
- `hooks.ts` - React hook useAuth
- `provider.tsx` - AuthProvider con Context API

### Endpoints API

- `POST /api/v1/auth/register` - Registro de usuario y tenant
- `POST /api/v1/auth/login` - Login con email/password
- `GET /api/v1/auth/me` - Obtener usuario actual
- `POST /api/v1/auth/logout` - Cerrar sesión
- `POST /api/v1/auth/forgot-password` - Solicitar reset
- `POST /api/v1/auth/reset-password` - Restablecer password

### Páginas Frontend

- `/login` - Página de inicio de sesión con soporte multi-tenant
- `/register` - Registro de nuevo usuario y empresa

### Características de Seguridad

- Passwords hasheados con bcryptjs (10 rounds)
- Sesiones con cookies httpOnly (7 días)
- Validación estricta con class-validator
- Multi-tenant isolation
- Rate limiting (100 req/min)
- CORS configurado

### Uso en Código

**Frontend:**
```typescript
import { useAuthContext } from '@/lib/auth/provider';
import { hasPermission } from '@retail/shared';

const { user, login, logout } = useAuthContext();
if (hasPermission(user.role, 'inventory:write')) {
  // Usuario puede editar inventario
}
```

**Backend:**
```typescript
@UseGuards(AuthGuard)
@Controller('products')
export class ProductsController {
  async findAll(@Req() req: Request) {
    const user = req.user; // Usuario autenticado
  }
}
```

### Documentación

Ver `docs/authentication.md` para documentación completa del sistema de autenticación.

---

## Estado Actual

### ✅ Completado

- [x] PROMPT 1: @retail/shared package
- [x] PROMPT 2: @retail/ui components
- [x] PROMPT 3: @retail/database Prisma schemas
- [x] PROMPT 4: @retail/web Next.js application
- [x] PROMPT 5: @retail/mobile React Native + Expo
- [x] PROMPT 6: @retail/api NestJS backend
- [x] PROMPT 7: Autenticación y autorización con better-auth

### 🚧 En Progreso

- [ ] Integración completa de ventas (stock, inventario)
- [ ] Tests automatizados

### 📋 Pendiente

- [ ] PROMPT 7+: Features adicionales según roadmap

---

## Recursos

- **Documentación API**: `docs/api/README.md`
- **Documentación Autenticación**: `docs/authentication.md`
- **Prisma Schema**: `packages/database/prisma/schema.prisma`
- **Componentes UI**: `packages/ui/src/components/`
- **Tipos compartidos**: `packages/shared/src/types/`

---

**Última actualización**: 2025-01-15
**Versión**: 1.1.0
