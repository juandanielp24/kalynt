# @retail/database

Paquete de base de datos con Prisma ORM para el proyecto Retail Super App.

## Stack

- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 14+
- **Language**: TypeScript

## Estructura

```
packages/database/
├── prisma/
│   ├── schema.prisma      # Schema de Prisma con todos los modelos
│   ├── seed.ts            # Datos de prueba para desarrollo
│   └── migrations/        # Migraciones de la BD
└── src/
    ├── index.ts           # Exports públicos
    └── client.ts          # Singleton de PrismaClient
```

## Setup

### 1. Instalar dependencias
```bash
pnpm install
```

### 2. Configurar base de datos
Crea un archivo `.env` en este directorio:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/retail_app?schema=public"
```

### 3. Generar cliente de Prisma
```bash
pnpm db:generate
```

### 4. Ejecutar migraciones
```bash
pnpm db:migrate
```

### 5. Poblar con datos de prueba
```bash
pnpm db:seed
```

## Scripts disponibles

- `pnpm db:generate` - Genera el cliente de Prisma
- `pnpm db:push` - Pushea cambios al schema sin crear migración (desarrollo)
- `pnpm db:migrate` - Crea y ejecuta migración
- `pnpm db:studio` - Abre Prisma Studio (UI visual)
- `pnpm db:seed` - Puebla la BD con datos de prueba
- `pnpm db:reset` - Resetea la BD completamente (⚠️ destructivo)

## Uso

### En tu aplicación

```typescript
import { prisma } from '@retail/database';

// Obtener todos los productos de un tenant
const products = await prisma.product.findMany({
  where: {
    tenantId: user.tenantId,
    deletedAt: null
  },
  include: {
    category: true,
    stock: true
  }
});

// Crear una venta
const sale = await prisma.sale.create({
  data: {
    tenantId: tenant.id,
    locationId: location.id,
    userId: user.id,
    saleNumber: '0001-00000123',
    saleDate: new Date(),
    subtotalCents: 10000,
    taxCents: 2100,
    totalCents: 12100,
    paymentMethod: 'cash',
    paymentStatus: 'completed',
    status: 'completed',
    items: {
      create: [
        {
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity: 2,
          unitPriceCents: 5000,
          taxRate: 0.21,
          subtotalCents: 10000,
          taxCents: 2100,
          totalCents: 12100
        }
      ]
    }
  },
  include: {
    items: true
  }
});
```

### Reglas importantes

#### 1. Multi-tenancy
**SIEMPRE** filtrar por `tenantId`:

```typescript
// ✅ Correcto
await prisma.product.findMany({
  where: { tenantId: user.tenantId }
});

// ❌ Incorrecto - leak de datos
await prisma.product.findMany({});
```

#### 2. Montos en centavos
**SIEMPRE** usar integers (centavos) para dinero:

```typescript
// ✅ Correcto
const product = {
  priceCents: 125000 // $1,250.00
};

// ❌ Incorrecto
const product = {
  price: 1250.00 // float - pérdida de precisión
};
```

#### 3. Soft deletes
Usar `deletedAt` en lugar de eliminar:

```typescript
// Soft delete
await prisma.product.update({
  where: { id },
  data: { deletedAt: new Date() }
});

// Excluir eliminados en queries
await prisma.product.findMany({
  where: {
    tenantId,
    deletedAt: null
  }
});
```

## Modelos principales

### Tenant
Empresas/comercios que usan el sistema.

### User
Usuarios del sistema (owner, admin, cashier, viewer).

### Location
Sucursales o depósitos.

### Product
Productos del inventario.

### Stock
Control de stock por producto y ubicación.

### Sale
Ventas realizadas en el POS.

### SaleItem
Items/líneas de cada venta.

### Category
Categorías de productos (jerárquicas).

### AuditLog
Registro de auditoría para compliance.

## Prisma Studio

Explora tu base de datos visualmente:

```bash
pnpm db:studio
```

Abre en `http://localhost:5555`

## Documentación

Ver `docs/architecture/database-schema.md` para:
- Diagrama ER completo
- Descripción detallada de cada modelo
- Reglas de negocio
- Estrategias de optimización

## Desarrollo

### Crear una nueva migración

1. Modifica `prisma/schema.prisma`
2. Ejecuta:
```bash
pnpm db:migrate
```
3. Dale un nombre descriptivo a la migración

### Actualizar el schema sin migración (desarrollo)

```bash
pnpm db:push
```

⚠️ No usar en producción - solo para prototipar rápido.

## Producción

### Aplicar migraciones

```bash
DATABASE_URL="postgresql://..." pnpm db:migrate deploy
```

### Generar cliente

```bash
pnpm db:generate
```

Esto se debe ejecutar en el build de producción.

## Troubleshooting

### Error: "Can't reach database server"
Verifica que PostgreSQL esté corriendo y que la `DATABASE_URL` sea correcta.

### Error: "Prisma Client not generated"
Ejecuta `pnpm db:generate`.

### Error: "Column does not exist"
El schema está desincronizado. Ejecuta `pnpm db:migrate` o `pnpm db:push`.

## Referencias

- [Prisma Docs](https://www.prisma.io/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
