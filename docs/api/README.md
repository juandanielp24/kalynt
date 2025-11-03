# Retail Super App - API Documentation

API backend construida con NestJS 11, PostgreSQL (Prisma), Redis y arquitectura modular multi-tenant.

## Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Inicio Rápido](#inicio-rápido)
- [Autenticación](#autenticación)
- [Multi-Tenant](#multi-tenant)
- [Endpoints](#endpoints)
- [Modelos de Datos](#modelos-de-datos)
- [Variables de Entorno](#variables-de-entorno)
- [Desarrollo](#desarrollo)

## Arquitectura

### Stack Tecnológico

- **Framework**: NestJS 11
- **Base de datos**: PostgreSQL con Prisma ORM (@retail/database)
- **Caché**: Redis
- **Validación**: class-validator, class-transformer
- **Seguridad**: Helmet, CORS, Rate Limiting (Throttler)
- **Compresión**: compression
- **Logging**: nest-winston
- **Jobs/Queue**: Bull + Redis

### Estructura de Directorios

```
apps/api/
├── src/
│   ├── main.ts                 # Bootstrap de la aplicación
│   ├── app.module.ts           # Módulo raíz
│   ├── common/                 # Utilidades compartidas
│   │   ├── guards/            # Guards (TenantGuard)
│   │   ├── interceptors/      # Interceptors (Logging, Transform)
│   │   ├── filters/           # Exception filters
│   │   ├── decorators/        # Decoradores custom
│   │   └── types/             # Tipos compartidos
│   ├── shared/                # Módulos compartidos
│   │   ├── database/          # Prisma provider
│   │   └── redis/             # Redis provider
│   └── modules/               # Módulos de negocio
│       ├── auth/              # Autenticación y registro
│       ├── tenants/           # Gestión de tenants
│       ├── products/          # CRUD completo de productos
│       └── sales/             # Gestión de ventas
├── test/                      # Tests e2e
└── docs/                      # Documentación
```

### Módulos Principales

#### 1. Common (Transversal)

**TenantGuard** (`src/common/guards/tenant.guard.ts`)
- Valida header `x-tenant-id` en todas las requests
- Verifica que el usuario pertenezca al tenant
- Inyecta `tenantId` en el request object

**LoggingInterceptor** (`src/common/interceptors/logging.interceptor.ts`)
- Registra todas las HTTP requests
- Tiempo de respuesta
- Status codes

**TransformInterceptor** (`src/common/interceptors/transform.interceptor.ts`)
- Estandariza formato de respuestas:
```typescript
{
  success: true,
  data: { ... },
  meta?: { page, limit, total, totalPages }
}
```

**HttpExceptionFilter** (`src/common/filters/http-exception.filter.ts`)
- Manejo global de errores
- Formato consistente de errores:
```typescript
{
  success: false,
  statusCode: 400,
  message: "Error message",
  error: "Bad Request",
  timestamp: "2025-01-15T10:00:00.000Z",
  path: "/api/v1/products"
}
```

#### 2. Shared Modules

**DatabaseModule** (`src/shared/database/database.module.ts`)
- Provider global de Prisma Client
- Inyección: `@Inject('PRISMA') private prisma: PrismaClient`

**RedisModule** (`src/shared/redis/redis.module.ts`)
- Provider global de Redis client
- Inyección: `@Inject('REDIS') private redis: Redis`
- Configuración desde env: `REDIS_HOST`, `REDIS_PORT`

#### 3. Feature Modules

- **AuthModule**: Login, registro, JWT
- **TenantsModule**: Gestión de tenants
- **ProductsModule**: CRUD completo con paginación, búsqueda, soft delete
- **SalesModule**: Ventas con integración a stock e inventario

## Inicio Rápido

### Prerequisitos

- Node.js 18+
- pnpm
- PostgreSQL
- Redis

### Instalación

```bash
# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp apps/api/.env.example apps/api/.env

# Editar .env con tus credenciales
# DATABASE_URL, REDIS_HOST, JWT_SECRET, etc.

# Generar Prisma Client (si es necesario)
cd packages/database
pnpm db:generate

# Ejecutar migraciones
pnpm db:push
```

### Desarrollo

```bash
# Ejecutar en modo desarrollo
pnpm --filter @retail/api dev

# La API estará disponible en:
# http://localhost:3001/api/v1
```

### Build y Producción

```bash
# Build
pnpm --filter @retail/api build

# Ejecutar en producción
pnpm --filter @retail/api start:prod
```

## Autenticación

### POST /api/v1/auth/login

Autenticación de usuario existente.

**Request:**
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "ADMIN",
      "tenantId": "tenant-uuid"
    },
    "token": "jwt-token-placeholder"
  }
}
```

**Estados:**
- `200 OK`: Login exitoso
- `401 Unauthorized`: Credenciales inválidas

### POST /api/v1/auth/register

Registro de nuevo usuario.

**Request:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "password": "securePassword123",
  "tenantId": "existing-tenant-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User registered successfully",
    "userId": "new-user-uuid"
  }
}
```

**Estados:**
- `201 Created`: Usuario creado
- `400 Bad Request`: Datos inválidos
- `409 Conflict`: Email ya existe

**TODO**: Implementar JWT real, refresh tokens, registro con creación de tenant

## Multi-Tenant

Todas las requests autenticadas **deben** incluir el header:

```
x-tenant-id: your-tenant-uuid
```

### TenantGuard

El `TenantGuard` se aplica a nivel de controlador:

```typescript
@Controller('products')
@UseGuards(TenantGuard)
export class ProductsController {
  // Todas las rutas requieren x-tenant-id
}
```

**Validaciones:**
1. Header `x-tenant-id` presente
2. Si hay usuario autenticado, `user.tenantId === x-tenant-id`
3. Inyecta `request.tenantId` para uso en services

**Errores:**
- `403 Forbidden`: Falta header o tenant mismatch

### Aislamiento de Datos

Todos los queries incluyen filtro por `tenantId`:

```typescript
// ✅ Correcto
await this.prisma.product.findMany({
  where: { tenantId, deletedAt: null }
});

// ❌ Incorrecto - expone datos de todos los tenants
await this.prisma.product.findMany();
```

## Endpoints

### Tenants

#### GET /api/v1/tenants/:id

Obtener información de un tenant.

**Headers:**
```
x-tenant-id: tenant-uuid
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Mi Empresa",
    "slug": "mi-empresa",
    "settings": {},
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Estados:**
- `200 OK`: Tenant encontrado
- `404 Not Found`: Tenant no existe

---

### Products

Todas las rutas requieren header `x-tenant-id`.

#### GET /api/v1/products

Listar productos con paginación y búsqueda.

**Query Parameters:**
- `page` (number, default: 1): Página actual
- `limit` (number, default: 20, max: 100): Items por página
- `search` (string, optional): Búsqueda por nombre o SKU
- `categoryId` (uuid, optional): Filtrar por categoría
- `inStock` (boolean, optional): Solo productos con stock

**Ejemplo:**
```
GET /api/v1/products?page=1&limit=20&search=laptop&inStock=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "tenantId": "uuid",
      "sku": "LAP-001",
      "name": "Laptop HP",
      "description": "Laptop HP 15 pulgadas",
      "costCents": 50000000,
      "priceCents": 80000000,
      "taxRate": 0.21,
      "barcode": "7798123456789",
      "imageUrl": "https://...",
      "categoryId": "uuid",
      "category": {
        "id": "uuid",
        "name": "Electrónica"
      },
      "stock": [
        {
          "id": "uuid",
          "productId": "uuid",
          "locationId": "uuid",
          "quantity": 15,
          "minQuantity": 5
        }
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "deletedAt": null
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Estados:**
- `200 OK`: Lista de productos
- `403 Forbidden`: Falta x-tenant-id

#### GET /api/v1/products/:id

Obtener un producto por ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "sku": "LAP-001",
    "name": "Laptop HP",
    "costCents": 50000000,
    "priceCents": 80000000,
    // ... resto de campos
  }
}
```

**Estados:**
- `200 OK`: Producto encontrado
- `404 Not Found`: Producto no existe o pertenece a otro tenant

#### POST /api/v1/products

Crear nuevo producto.

**Request Body:**
```json
{
  "sku": "LAP-002",
  "name": "Laptop Dell",
  "description": "Laptop Dell Inspiron",
  "costCents": 45000000,
  "priceCents": 75000000,
  "taxRate": 0.21,
  "barcode": "7798987654321",
  "imageUrl": "https://example.com/image.jpg",
  "categoryId": "category-uuid",
  "initialStock": {
    "locationId": "location-uuid",
    "quantity": 10,
    "minQuantity": 3
  }
}
```

**Validaciones:**
- `sku`: string, required
- `name`: string, required
- `costCents`: number >= 0, required
- `priceCents`: number >= 0, required
- `taxRate`: number 0-1, required
- `categoryId`: uuid, optional
- `initialStock`: object, optional
  - `locationId`: uuid, required
  - `quantity`: number >= 0, required
  - `minQuantity`: number >= 0, optional

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "sku": "LAP-002",
    "name": "Laptop Dell",
    // ... resto de campos
  }
}
```

**Estados:**
- `201 Created`: Producto creado
- `400 Bad Request`: Datos inválidos
- `409 Conflict`: SKU duplicado

**Nota:** Si se proporciona `initialStock`, se crea automáticamente en una transacción.

#### PATCH /api/v1/products/:id

Actualizar producto existente.

**Request Body (parcial):**
```json
{
  "name": "Laptop Dell Actualizada",
  "priceCents": 78000000
}
```

**Validaciones:** Mismas que POST, todos los campos opcionales.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Laptop Dell Actualizada",
    "priceCents": 78000000,
    // ... resto de campos actualizados
  }
}
```

**Estados:**
- `200 OK`: Producto actualizado
- `404 Not Found`: Producto no existe

#### DELETE /api/v1/products/:id

Eliminar producto (soft delete).

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Product deleted successfully"
  }
}
```

**Estados:**
- `200 OK`: Producto eliminado
- `404 Not Found`: Producto no existe

**Nota:** Soft delete - establece `deletedAt` timestamp. El producto ya no aparecerá en listados.

---

### Sales

Todas las rutas requieren header `x-tenant-id`.

#### GET /api/v1/sales

Listar ventas del tenant.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "saleNumber": "VTA-2025-0001",
      "tenantId": "uuid",
      "customerId": "uuid",
      "subtotalCents": 100000000,
      "taxCents": 21000000,
      "discountCents": 0,
      "totalCents": 121000000,
      "status": "COMPLETED",
      "paymentMethod": "CASH",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### GET /api/v1/sales/:id

Obtener detalle de una venta.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "saleNumber": "VTA-2025-0001",
    "subtotalCents": 100000000,
    "taxCents": 21000000,
    "totalCents": 121000000,
    "status": "COMPLETED",
    "items": [
      {
        "id": "uuid",
        "productId": "uuid",
        "product": {
          "name": "Laptop HP",
          "sku": "LAP-001"
        },
        "quantity": 1,
        "unitPriceCents": 80000000,
        "taxRate": 0.21,
        "subtotalCents": 80000000,
        "taxCents": 16800000,
        "totalCents": 96800000
      }
    ]
  }
}
```

#### POST /api/v1/sales

Crear nueva venta.

**Request Body:**
```json
{
  "customerId": "customer-uuid",
  "paymentMethod": "CASH",
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "unitPriceCents": 50000000
    }
  ],
  "discountCents": 0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-sale-uuid",
    "saleNumber": "VTA-2025-0002",
    "totalCents": 121000000,
    "status": "COMPLETED"
  }
}
```

**TODO**:
- Validar stock disponible
- Descontar del inventario
- Integración con AFIP (facturación)
- Integración con Mercado Pago

---

## Modelos de Datos

Los modelos están definidos en `@retail/database` (Prisma):

### Product
```prisma
model Product {
  id          String   @id @default(uuid())
  tenantId    String
  sku         String
  name        String
  description String?
  costCents   Int      // Precio de costo en centavos
  priceCents  Int      // Precio de venta en centavos
  taxRate     Float    // 0.21 para IVA 21%
  barcode     String?
  imageUrl    String?
  categoryId  String?
  category    Category? @relation(fields: [categoryId], references: [id])
  stock       Stock[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime? // Soft delete

  @@unique([tenantId, sku])
  @@index([tenantId, deletedAt])
}
```

### Sale
```prisma
model Sale {
  id             String   @id @default(uuid())
  saleNumber     String   @unique
  tenantId       String
  customerId     String?
  subtotalCents  Int
  taxCents       Int
  discountCents  Int      @default(0)
  totalCents     Int
  status         SaleStatus
  paymentMethod  PaymentMethod
  items          SaleItem[]
  createdAt      DateTime @default(now())

  @@index([tenantId, status])
}
```

Ver esquema completo en `packages/database/prisma/schema.prisma`.

## Variables de Entorno

Crear archivo `.env` en `apps/api/`:

```bash
# Environment
NODE_ENV=development

# Server
PORT=3001

# Database (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/retail_app"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Mercado Pago (opcional)
MERCADO_PAGO_ACCESS_TOKEN=

# AFIP (opcional)
AFIP_CUIT=
AFIP_CERT_PATH=
AFIP_KEY_PATH=
```

## Desarrollo

### Scripts Disponibles

```bash
# Desarrollo con hot-reload
pnpm --filter @retail/api dev

# Build
pnpm --filter @retail/api build

# Producción
pnpm --filter @retail/api start:prod

# Linting
pnpm --filter @retail/api lint

# Tests
pnpm --filter @retail/api test
pnpm --filter @retail/api test:e2e
```

### Estructura de un Módulo

Cada módulo feature sigue esta estructura:

```
modules/example/
├── dto/
│   ├── create-example.dto.ts
│   ├── update-example.dto.ts
│   └── query-example.dto.ts
├── example.controller.ts
├── example.service.ts
└── example.module.ts
```

**DTO (Data Transfer Objects):**
- Validación con `class-validator`
- Transformación con `class-transformer`

**Service:**
- Lógica de negocio
- Acceso a Prisma y Redis
- Siempre filtrar por `tenantId`

**Controller:**
- Routing
- Aplicar `@UseGuards(TenantGuard)`
- Extraer `tenantId` del request

### Crear Nuevo Módulo

```bash
# Generar módulo con CLI
cd apps/api
npx nest g module modules/customers
npx nest g controller modules/customers
npx nest g service modules/customers
```

### Testing

```typescript
// example.service.spec.ts
describe('ExampleService', () => {
  let service: ExampleService;
  let prisma: PrismaClient;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ExampleService,
        { provide: 'PRISMA', useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExampleService>(ExampleService);
  });

  it('should filter by tenantId', async () => {
    // ...
  });
});
```

## Seguridad

### Helmet

Protección automática:
- X-Content-Type-Options
- X-Frame-Options
- X-XSS-Protection
- Strict-Transport-Security

### CORS

Configurado en `main.ts`:
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});
```

### Rate Limiting

Throttler configurado:
- 100 requests por minuto por IP
- Configurable vía env

### Validación

Todas las DTOs usan `class-validator`:
```typescript
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  priceCents: number;
}
```

Global ValidationPipe con:
- `whitelist: true` - Remueve propiedades no definidas
- `forbidNonWhitelisted: true` - Rechaza propiedades extra
- `transform: true` - Transforma tipos automáticamente

### SQL Injection

Prisma protege automáticamente con prepared statements.

## Próximas Mejoras

- [ ] Implementar JWT real con refresh tokens
- [ ] Agregar Swagger/OpenAPI documentation
- [ ] Tests unitarios y e2e completos
- [ ] Implementar módulo de Customers completo
- [ ] Implementar módulo de Inventory (stock movements)
- [ ] Integración AFIP para facturación electrónica
- [ ] Integración Mercado Pago para pagos
- [ ] WebSockets para actualizaciones en tiempo real
- [ ] Caching con Redis en queries frecuentes
- [ ] Background jobs con Bull (reports, exports)
- [ ] Audit logs para todas las operaciones
- [ ] Role-based access control (RBAC)
- [ ] API versioning (v2)

## Soporte

Para issues y preguntas, contactar al equipo de desarrollo.
