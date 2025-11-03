# Web App Setup Guide

Esta guía documenta la configuración y estructura de la aplicación web Next.js 15 del Retail Super App.

## 📁 Estructura de Archivos

```
apps/web/
├── src/
│   ├── app/                      # App Router de Next.js 15
│   │   ├── (auth)/               # Grupo de rutas de autenticación
│   │   │   └── login/
│   │   │       └── page.tsx      # Página de login
│   │   ├── (dashboard)/          # Grupo de rutas del dashboard
│   │   │   ├── layout.tsx        # Layout con Sidebar + Header
│   │   │   └── page.tsx          # Dashboard principal
│   │   ├── globals.css           # Estilos globales + variables CSS
│   │   ├── layout.tsx            # Root layout
│   │   └── providers.tsx         # React Query Provider
│   ├── components/
│   │   └── layout/
│   │       ├── Sidebar.tsx       # Navegación lateral
│   │       └── Header.tsx        # Barra superior
│   ├── lib/
│   │   └── api-client.ts         # Cliente HTTP para API
│   └── stores/
│       ├── cart-store.ts         # Zustand store para carrito POS
│       └── ui-store.ts           # Zustand store para UI state
├── .env.local.example            # Variables de entorno de ejemplo
├── next.config.js                # Configuración de Next.js
├── tailwind.config.ts            # Configuración de Tailwind
└── package.json                  # Dependencias
```

## 🚀 Características

### 1. Next.js 15 App Router

- **Route Groups**: Usa `(auth)` y `(dashboard)` para organizar rutas sin afectar URLs
- **Server Components**: Componentes del servidor por defecto para mejor performance
- **Client Components**: Marcados con `'use client'` donde se necesita interactividad

### 2. Estado Global

**React Query** para estado del servidor:
- Cache automático
- Revalidación en background
- Stale time de 1 minuto
- React Query DevTools habilitados en desarrollo

**Zustand** para estado del cliente:
- `cart-store.ts`: Gestión del carrito de compras con persistencia
- `ui-store.ts`: Estado de UI (sidebar, modales, loading)

### 3. API Client

Cliente HTTP centralizado con:
- Manejo de errores consistente
- Query params automáticos
- Headers configurables
- Autenticación con tokens
- TypeScript completo

```typescript
// Ejemplo de uso
import { apiClient } from '@/lib/api-client';

const products = await apiClient.get('/api/products', {
  params: { tenantId: 'demo' }
});
```

### 4. Componentes de Layout

**Sidebar** (`components/layout/Sidebar.tsx`):
- Navegación con iconos (lucide-react)
- Highlight de ruta activa
- Info del tenant en footer
- Responsive (colapsable en móviles)

**Header** (`components/layout/Header.tsx`):
- Barra de búsqueda global
- Notificaciones con dropdown
- Menú de usuario
- Acciones rápidas

### 5. Temas y Estilos

**CSS Variables** para theming:
- Light/Dark mode preparado
- Variables en `globals.css`
- Personalización fácil de colores
- Integración con @retail/ui

**Tailwind CSS**:
- Extiende configuración de @retail/ui
- Path aliases configurados
- PostCSS con autoprefixer

## 🔧 Configuración

### Variables de Entorno

Copia `.env.local.example` a `.env.local`:

```bash
cp .env.local.example .env.local
```

Variables disponibles:
- `NEXT_PUBLIC_API_URL`: URL del API backend
- `DATABASE_URL`: Conexión a PostgreSQL
- `NEXTAUTH_URL`: URL para NextAuth (futuro)
- `NEXT_PUBLIC_ENABLE_ANALYTICS`: Feature flag
- `NEXT_PUBLIC_ENABLE_OFFLINE_MODE`: Feature flag

### Desarrollo

```bash
# Desde la raíz del monorepo
pnpm --filter @retail/web dev

# O desde apps/web/
cd apps/web
pnpm dev
```

La app estará disponible en `http://localhost:3000`

### Build

```bash
pnpm --filter @retail/web build
```

### Type Checking

```bash
pnpm --filter @retail/web typecheck
```

## 📦 Dependencias Principales

### Framework
- `next@15.0.3`: Framework React con App Router
- `react@18.3.1`: Library UI
- `react-dom@18.3.1`: Renderer

### Estado y Data Fetching
- `@tanstack/react-query@^5.28.0`: Server state management
- `zustand@^4.5.2`: Client state management

### UI y Estilos
- `@retail/ui@workspace:*`: Sistema de componentes
- `@retail/shared@workspace:*`: Lógica compartida
- `tailwindcss@^3.4.1`: Utility-first CSS
- `lucide-react@^0.344.0`: Iconos
- `sonner@^1.4.3`: Toast notifications

### Formularios y Validación
- `react-hook-form@^7.51.0`: Manejo de forms
- `zod@^3.22.4`: Validación de schemas

### Charts
- `recharts@^2.12.2`: Gráficos para reportes

## 🎯 Próximos Pasos

### Páginas Pendientes

1. **POS (Punto de Venta)**
   - `/pos/page.tsx`: Interfaz de venta rápida
   - Integración con `cart-store`
   - Búsqueda de productos
   - Procesamiento de pagos

2. **Inventario**
   - `/inventory/page.tsx`: Lista de productos
   - `/inventory/[id]/page.tsx`: Detalle/edición
   - Gestión de stock por ubicación
   - Movimientos de inventario

3. **Ventas**
   - `/sales/page.tsx`: Historial de ventas
   - `/sales/[id]/page.tsx`: Detalle de venta
   - Impresión de comprobantes
   - Integración AFIP (futuro)

4. **Clientes**
   - `/customers/page.tsx`: Lista de clientes
   - `/customers/[id]/page.tsx`: Perfil del cliente
   - Historial de compras

5. **Reportes**
   - `/reports/page.tsx`: Dashboard de reportes
   - Ventas por período
   - Productos más vendidos
   - Gráficos con Recharts

6. **Configuración**
   - `/settings/page.tsx`: Configuración general
   - Gestión de usuarios
   - Configuración de impuestos
   - Integración con servicios externos

### Mejoras Técnicas

1. **Autenticación Real**
   - Implementar NextAuth.js
   - Protección de rutas
   - Roles y permisos

2. **API Routes**
   - API Routes en `/app/api/`
   - Integración con Prisma
   - Validación con Zod

3. **Offline Support**
   - Service Worker
   - IndexedDB para cache local
   - Sincronización en background

4. **Testing**
   - Tests unitarios con Vitest
   - Tests E2E con Playwright
   - Cobertura >80%

5. **Performance**
   - Image optimization
   - Code splitting
   - Lazy loading de componentes
   - Prefetching de rutas

## 🎨 Guía de Estilos

### Colores

Usa las variables CSS definidas en `globals.css`:

```tsx
// Primary color
<div className="bg-primary text-primary-foreground">

// Secondary
<div className="bg-secondary text-secondary-foreground">

// Muted (backgrounds)
<div className="bg-muted text-muted-foreground">

// Destructive (errors)
<div className="bg-destructive text-destructive-foreground">
```

### Componentes

Importa desde `@retail/ui`:

```tsx
import { Button, Card, Input } from '@retail/ui';
```

### Utilidades

Usa `cn()` para combinar clases condicionales:

```tsx
import { cn } from '@retail/ui';

<div className={cn(
  'base-classes',
  isActive && 'active-classes',
  className
)} />
```

## 📚 Recursos

- [Next.js 15 Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Zustand Docs](https://zustand-demo.pmnd.rs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

## 🤝 Convenciones de Código

1. **Componentes**: PascalCase (`UserProfile.tsx`)
2. **Hooks**: camelCase con prefijo `use` (`useAuth.ts`)
3. **Stores**: kebab-case con sufijo `-store` (`cart-store.ts`)
4. **Utilities**: camelCase (`formatDate.ts`)
5. **Tipos**: PascalCase con sufijo `Type` o `Interface`

### Orden de Imports

```typescript
// 1. React y Next.js
import { useState } from 'react';
import Link from 'next/link';

// 2. Librerías externas
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

// 3. Workspace packages
import { formatCurrency } from '@retail/shared';
import { Button, Card } from '@retail/ui';

// 4. Imports locales
import { apiClient } from '@/lib/api-client';
import { useCartStore } from '@/stores/cart-store';
```

## ✅ Checklist de Calidad

Antes de hacer commit, verifica:

- [ ] TypeScript compila sin errores
- [ ] No hay warnings de ESLint
- [ ] Componentes usan tipos correctos
- [ ] Manejo de errores implementado
- [ ] Loading states definidos
- [ ] Responsive design verificado
- [ ] Accesibilidad básica (ARIA labels, keyboard navigation)
- [ ] Performance optimizado (imágenes, code splitting)

## 📞 Soporte

Para dudas o problemas:
1. Revisa la documentación de los packages (`packages/*/docs`)
2. Consulta los ejemplos en el código
3. Crea un issue en el repositorio
