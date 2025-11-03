# Dashboard - Retail POS Application

## Descripción

El Dashboard es la página principal de la aplicación que proporciona una vista general del estado del negocio en tiempo real. Incluye métricas clave (KPIs), gráficos interactivos, y alertas importantes para la toma de decisiones.

## Características Principales

### 1. **Tarjetas de Estadísticas (Stats Cards)**

Muestra 4 métricas principales:

- **Ventas Hoy**: Total de ventas del día actual en pesos argentinos
  - Incluye indicador de crecimiento vs. día anterior (%)
  - Color verde para crecimiento positivo, rojo para negativo

- **Transacciones**: Número total de ventas completadas hoy

- **Ticket Promedio**: Valor promedio de cada venta

- **Productos Activos**: Total de productos activos en el inventario

### 2. **Gráfico de Ventas del Mes**

- Gráfico de área (AreaChart) con Recharts
- Muestra evolución diaria de ingresos durante el mes actual
- Eje X: Fechas (formato dd/MM)
- Eje Y: Ingresos en pesos (formato K para miles)
- Tooltip personalizado con formato de moneda argentina
- Gradiente azul para mejor visualización
- Auto-actualización cada 5 minutos

### 3. **Productos Más Vendidos**

- Gráfico de barras horizontal (BarChart)
- Top 5 productos por cantidad vendida
- Colores distintivos para cada producto
- Tooltip muestra:
  - Nombre del producto
  - Cantidad vendida
  - Ingresos totales generados
- Ordenado de mayor a menor cantidad

### 4. **Ventas Recientes**

- Lista de las últimas 10 ventas completadas
- Información mostrada:
  - Avatar del cliente (inicial del nombre o "CF" para consumidor final)
  - Nombre del cliente o "Consumidor Final"
  - Número de venta
  - Tiempo relativo (ej: "hace 5 minutos")
  - Monto total en formato moneda
- Formato de fecha en español usando date-fns

### 5. **Alertas de Stock Bajo**

- Muestra productos con stock menor o igual al mínimo configurado
- Elementos destacados con borde y fondo rojo claro
- Información por producto:
  - Ícono de alerta
  - Nombre del producto
  - Stock actual vs. stock mínimo
  - Botón "Ver" para ir al detalle del producto
- Si hay más de 5 productos, muestra botón "Ver todos"
- Estado vacío amigable cuando no hay alertas

### 6. **Controles Globales**

- **Período**: Botón para seleccionar rango de fechas (pendiente implementar)
- **Actualizar**: Botón para refrescar datos manualmente
  - Ícono de actualización con animación de spin durante carga
  - Auto-deshabilitado durante la recarga

## Arquitectura Técnica

### Frontend (Next.js + React)

```
apps/web/src/
├── app/(dashboard)/
│   └── page.tsx                    # Página principal del dashboard
├── components/dashboard/
│   ├── StatsCards.tsx              # Tarjetas de estadísticas
│   ├── SalesChart.tsx              # Gráfico de ventas
│   ├── TopProductsChart.tsx        # Gráfico de productos
│   ├── RecentSales.tsx             # Lista de ventas recientes
│   └── LowStockAlerts.tsx          # Alertas de stock bajo
└── hooks/
    └── use-dashboard-data.ts       # Hook para obtener datos
```

### Backend (NestJS)

```
apps/api/src/modules/dashboard/
├── dashboard.module.ts             # Módulo del dashboard
├── dashboard.controller.ts         # Controlador HTTP
└── dashboard.service.ts            # Lógica de negocio
```

## API Endpoints

### GET `/api/v1/dashboard`

Obtiene todos los datos del dashboard.

**Headers:**
```
Authorization: Bearer <token>
x-tenant-id: <tenant-id>
```

**Query Parameters:**
- `dateFrom` (opcional): Fecha de inicio en formato ISO (default: inicio del mes actual)
- `dateTo` (opcional): Fecha de fin en formato ISO (default: fin del mes actual)

**Response:**
```typescript
{
  success: true,
  data: {
    overview: {
      totalSalesToday: number;        // Total de productos activos
      totalSalesCents: number;        // Total de ventas hoy (centavos)
      transactionsCount: number;      // Cantidad de transacciones
      averageTicketCents: number;     // Ticket promedio (centavos)
      growthPercentage: number;       // % crecimiento vs ayer
    },
    salesChart: [
      {
        date: string;                 // Formato "dd/MM"
        sales: number;                // Cantidad de ventas
        revenue: number;              // Ingresos (en pesos, no centavos)
      }
    ],
    topProducts: [
      {
        id: string;
        name: string;
        quantitySold: number;
        revenueCents: number;
      }
    ],
    recentSales: [
      {
        id: string;
        saleNumber: string;
        customerName: string;
        totalCents: number;
        createdAt: string;            // ISO format
      }
    ],
    lowStockProducts: [
      {
        id: string;
        name: string;
        currentStock: number;
        minStock: number;
      }
    ]
  }
}
```

## Librerías Utilizadas

### Recharts
- **Versión**: Latest
- **Uso**: Gráficos interactivos (AreaChart, BarChart)
- **Componentes**:
  - `ResponsiveContainer`: Responsividad automática
  - `AreaChart`: Gráfico de ventas
  - `BarChart`: Gráfico de productos
  - `Tooltip`: Tooltips personalizados
  - `CartesianGrid`: Grilla de fondo
  - `XAxis` / `YAxis`: Ejes configurables

### date-fns
- **Versión**: Latest
- **Uso**: Manipulación y formateo de fechas
- **Funciones utilizadas**:
  - `startOfMonth`, `endOfMonth`: Rangos de fechas
  - `format`: Formateo de fechas
  - `formatDistanceToNow`: Tiempo relativo ("hace 5 minutos")
  - `eachDayOfInterval`: Generar array de días
  - `es`: Locale en español

### TanStack Query (React Query)
- **Uso**: Gestión de estado del servidor
- **Características**:
  - Cache automático (5 minutos)
  - Auto-refresh cada 5 minutos
  - Loading states
  - Refetch manual

## Optimizaciones de Performance

### Backend

1. **Queries en Paralelo**:
   ```typescript
   const [overview, salesChart, topProducts, recentSales, lowStockProducts] =
     await Promise.all([
       this.getOverview(tenantId, from, to),
       this.getSalesChart(tenantId, from, to),
       this.getTopProducts(tenantId, from, to),
       this.getRecentSales(tenantId),
       this.getLowStockProducts(tenantId),
     ]);
   ```

2. **Agregaciones Optimizadas**:
   - Uso de `aggregate()` para sumas y conteos
   - `groupBy()` para agrupar productos más vendidos
   - Índices en campos de filtrado (tenantId, createdAt, status)

3. **Límites de Resultados**:
   - Top products: 10
   - Recent sales: 10
   - Low stock: Sin límite (para precisión)

### Frontend

1. **React Query Caching**:
   - `staleTime`: 5 minutos
   - `refetchInterval`: 5 minutos
   - Previene llamadas innecesarias al API

2. **Lazy Loading**:
   - LoadingSpinner durante carga inicial
   - Skeleton states (pendiente implementar)

3. **Responsive Design**:
   - Grid adaptativo: 1 columna (mobile) → 2 columnas (tablet) → 4 columnas (desktop)
   - Gráficos responsivos con ResponsiveContainer

## Casos de Uso

### 1. Inicio de Día
- El gerente abre el dashboard al llegar a la tienda
- Ve ventas del día anterior y crecimiento
- Revisa alertas de stock bajo para hacer pedidos

### 2. Durante el Día
- Auto-refresh cada 5 minutos mantiene datos actualizados
- Monitoreo de ventas en tiempo real
- Identifica productos más vendidos para restock prioritario

### 3. Cierre de Día
- Revisa total de ventas del día
- Compara con día anterior para análisis de tendencias
- Exporta reporte (pendiente implementar)

## Seguridad

1. **Autenticación**:
   - Requiere token JWT válido
   - Guard: `AuthGuard`

2. **Multi-tenancy**:
   - Todos los datos filtrados por `tenantId`
   - Guard: `TenantGuard`
   - Header obligatorio: `x-tenant-id`

3. **Rate Limiting**:
   - 100 requests por minuto por IP
   - Configurado en AppModule

## Features Futuras

### Fase 1 (Corto Plazo)
- [ ] Selector de rango de fechas funcional
- [ ] Comparación con período anterior
- [ ] Skeleton loaders durante carga
- [ ] Error boundaries para manejo de errores

### Fase 2 (Mediano Plazo)
- [ ] Exportar dashboard como PDF
- [ ] Widgets customizables (drag & drop)
- [ ] Filtros por ubicación/sucursal
- [ ] Gráfico de ventas por método de pago
- [ ] Heatmap de ventas por hora del día

### Fase 3 (Largo Plazo)
- [ ] Dashboard personalizable por usuario
- [ ] Notificaciones push de alertas críticas
- [ ] Predicciones de ventas con ML
- [ ] Análisis de rentabilidad por producto
- [ ] Integración con Google Analytics

## Testing

### Unit Tests
```bash
# Backend
cd apps/api
pnpm test dashboard.service.spec.ts

# Frontend
cd apps/web
pnpm test dashboard
```

### E2E Tests
```bash
# Ver tests/e2e/specs/dashboard/dashboard.spec.ts (pendiente crear)
pnpm test:e2e dashboard
```

### Performance Tests
- Medir tiempo de respuesta del endpoint: < 500ms
- Tiempo de renderizado inicial: < 2s
- Lighthouse score: > 90

## Troubleshooting

### Problema: Gráficos no se muestran
**Causa**: Recharts requiere dimensiones definidas
**Solución**: Usar ResponsiveContainer con height explícito

### Problema: Datos desactualizados
**Causa**: Cache de React Query
**Solución**: Click en botón "Actualizar" o esperar 5 minutos

### Problema: Error de permisos
**Causa**: Falta header x-tenant-id o token inválido
**Solución**: Verificar autenticación y headers

### Problema: Performance lenta
**Causa**: Muchas ventas en el período seleccionado
**Solución**: Reducir rango de fechas o implementar paginación

## Referencias

- [Recharts Documentation](https://recharts.org/)
- [date-fns Documentation](https://date-fns.org/)
- [TanStack Query Documentation](https://tanstack.com/query/latest)
- [NestJS Best Practices](https://docs.nestjs.com/)

---

**Última actualización**: 2025-11-02
**Versión**: 1.0.0
**Autor**: Development Team
