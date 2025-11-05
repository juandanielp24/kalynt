# Analytics Module

Sistema completo de analytics y reportes con métricas de negocio.

## 🎯 Features

- ✅ Dashboard con KPIs principales
- ✅ Gráficos interactivos (Recharts)
- ✅ Filtros por período de tiempo
- ✅ Comparativas temporales
- ✅ Top productos y categorías
- ✅ Distribución horaria de ventas
- ✅ Análisis por método de pago
- ✅ Exportación a Excel/PDF
- ✅ Métricas de clientes
- ✅ Tendencias de ventas

## 📊 Métricas Disponibles

### Sales Metrics
- Total revenue (con comparación período anterior)
- Total de ventas (con comparación período anterior)
- Ticket promedio
- Tendencias diarias/semanales/mensuales

### Product Metrics
- Total de productos activos
- Productos con stock bajo
- Productos sin stock
- Unidades vendidas
- Top productos más vendidos

### Customer Metrics
- Total de clientes
- Clientes nuevos
- Clientes recurrentes
- Tasa de retención

## 🔧 API Endpoints

### GET /analytics/dashboard
Obtiene overview completo del dashboard.

**Query Params:**
- `startDate`: Fecha inicio (ISO 8601)
- `endDate`: Fecha fin (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "salesMetrics": {
      "totalRevenue": 100000,
      "revenueChange": 15.5,
      "totalSales": 50,
      "salesChange": 10.2,
      "averageTicket": 2000
    },
    "productMetrics": {
      "totalProducts": 100,
      "lowStockProducts": 5,
      "outOfStockProducts": 2,
      "soldProducts": 45,
      "totalUnitsSold": 500
    },
    "customerMetrics": {
      "totalCustomers": 150,
      "newCustomers": 20,
      "repeatCustomers": 80,
      "repeatCustomerRate": 0.533,
      "customerChange": 12.5
    },
    "revenueByDay": [
      {
        "date": "2024-01-01",
        "revenue": 10000,
        "salesCount": 5
      }
    ]
  }
}
```

### GET /analytics/top-products
Obtiene productos más vendidos.

**Query Params:**
- `startDate`: Fecha inicio
- `endDate`: Fecha fin
- `limit`: Cantidad de productos (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "productId": "prod-123",
      "name": "Product Name",
      "sku": "SKU-001",
      "unitsSold": 100,
      "revenue": 50000,
      "salesCount": 25,
      "imageUrl": "https://..."
    }
  ]
}
```

### GET /analytics/sales-by-category
Ventas agrupadas por categoría.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "categoryId": "cat-123",
      "categoryName": "Electronics",
      "revenue": 100000,
      "salesCount": 50
    }
  ]
}
```

### GET /analytics/sales-by-payment-method
Ventas agrupadas por método de pago.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "paymentMethod": "cash",
      "revenue": 80000,
      "salesCount": 40
    }
  ]
}
```

### GET /analytics/hourly-distribution
Distribución de ventas por hora del día.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hour": 9,
      "revenue": 15000,
      "salesCount": 8
    }
  ]
}
```

### GET /analytics/trends
Tendencias de ventas (diarias, semanales, mensuales).

**Query Params:**
- `period`: 'daily' | 'weekly' | 'monthly'
- `limit`: Cantidad de períodos

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2024-01-01",
      "revenue": 50000,
      "salesCount": 25,
      "averageTicket": 2000
    }
  ]
}
```

### GET /analytics/export
Exporta datos para reportes.

**Query Params:**
- `type`: 'sales' | 'products' | 'customers'
- `startDate`: Fecha inicio
- `endDate`: Fecha fin

**Response:**
Returns raw data array for export processing.

## 🎨 Frontend Components

### Core Components

#### MetricCard
Tarjeta de métrica con comparación y trending.

```tsx
import { MetricCard } from '@/components/analytics/MetricCard';
import { DollarSign } from 'lucide-react';

<MetricCard
  title="Ingresos Totales"
  value="$10,000.00"
  change={15.5}
  icon={<DollarSign />}
/>
```

#### RevenueChart
Gráfico de líneas para evolución de ingresos.

```tsx
import { RevenueChart } from '@/components/analytics/RevenueChart';

<RevenueChart data={revenueData} />
```

#### CategoryChart
Gráfico de torta para ventas por categoría.

```tsx
import { CategoryChart } from '@/components/analytics/CategoryChart';

<CategoryChart dateRange={dateRange} />
```

#### PaymentMethodChart
Gráfico de barras para métodos de pago.

```tsx
import { PaymentMethodChart } from '@/components/analytics/PaymentMethodChart';

<PaymentMethodChart dateRange={dateRange} />
```

#### TopProducts
Lista de productos más vendidos.

```tsx
import { TopProducts } from '@/components/analytics/TopProducts';

<TopProducts dateRange={dateRange} />
```

#### HourlyDistributionChart
Distribución de ventas por hora.

```tsx
import { HourlyDistributionChart } from '@/components/analytics/HourlyDistributionChart';

<HourlyDistributionChart dateRange={dateRange} />
```

#### DateRangePicker
Selector de rango de fechas con presets.

```tsx
import { DateRangePicker } from '@/components/analytics/DateRangePicker';

<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
/>
```

#### ExportButton
Botón para exportar datos a Excel/PDF.

```tsx
import { ExportButton } from '@/components/analytics/ExportButton';

<ExportButton dateRange={dateRange} />
```

## 📈 Performance

### Backend Optimizations
- ✅ Queries en paralelo para dashboard (Promise.all)
- ✅ Índices en tablas principales
- ✅ Aggregations optimizadas con Prisma
- ✅ Raw SQL para queries complejas
- ✅ Cálculo de comparativas eficiente

### Frontend Optimizations
- ✅ React Query con cache de 5 minutos
- ✅ Lazy loading de charts
- ✅ Prefetching de datos
- ✅ Invalidación selectiva de cache
- ✅ Responsive design con Recharts

### Recommended Database Indexes
```sql
-- Sales table
CREATE INDEX idx_sales_tenant_date ON sales(tenant_id, sale_date);
CREATE INDEX idx_sales_status_date ON sales(status, sale_date);
CREATE INDEX idx_sales_payment_method ON sales(payment_method);

-- Sale items table
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);

-- Composite indexes
CREATE INDEX idx_sales_tenant_date_status ON sales(tenant_id, sale_date, status);
```

## 🧪 Testing

### Backend Unit Tests
```bash
# Run analytics service tests
pnpm test analytics.service.spec

# Run with coverage
pnpm test:cov analytics.service.spec
```

### Frontend Component Tests
```bash
# Run component tests
pnpm test RevenueChart.test
pnpm test MetricCard.test

# Run all analytics tests
pnpm test -- analytics
```

### E2E Tests
```bash
# Run E2E tests for analytics dashboard
pnpm test:e2e specs/analytics/dashboard.spec
```

## 📊 Chart Libraries

### Recharts
Primary charting library for all visualizations.

- **LineChart**: Revenue trends over time
- **BarChart**: Payment methods, hourly distribution
- **PieChart**: Category distribution

### XLSX
Excel export functionality.

```typescript
import * as XLSX from 'xlsx';

const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales');
XLSX.writeFile(workbook, 'report.xlsx');
```

### jsPDF with AutoTable
PDF export functionality.

```typescript
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const doc = new jsPDF();
doc.text('Sales Report', 14, 20);
autoTable(doc, {
  head: [headers],
  body: rows,
});
doc.save('report.pdf');
```

## 🔒 Security

- ✅ AuthGuard en todos los endpoints
- ✅ TenantGuard para aislamiento de datos
- ✅ Filtrado por tenantId en todas las queries
- ✅ Validación de parámetros con class-validator
- ✅ Rate limiting en endpoints críticos

## 🚀 Future Roadmap

- [ ] Comparación de múltiples períodos
- [ ] Análisis de cohortes avanzado
- [ ] Predicciones con Machine Learning
- [ ] Reportes programados por email
- [ ] Dashboards personalizables por usuario
- [ ] Alertas automáticas por métricas
- [ ] Análisis de tendencias predictivas
- [ ] Integración con Google Analytics
- [ ] Exportación a Google Sheets
- [ ] API para webhooks de métricas

## 📝 Usage Examples

### Fetching Dashboard Data
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['dashboard-analytics', dateRange],
  queryFn: async () => {
    const response = await apiClient.get('/analytics/dashboard', {
      params: {
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      },
    });
    return response.data.data;
  },
});
```

### Prefetching Analytics Data
```typescript
import { prefetchAllAnalyticsCharts } from '@/lib/analytics-cache';

// Prefetch all charts data
await prefetchAllAnalyticsCharts(dateRange);
```

### Invalidating Cache
```typescript
import { invalidateAnalyticsCache } from '@/lib/analytics-cache';

// After creating a new sale
await createSale(saleData);
invalidateAnalyticsCache();
```

## 🐛 Troubleshooting

### Common Issues

**Issue**: Charts not loading
- Check if date range is valid
- Verify API endpoints are accessible
- Check browser console for errors
- Ensure tenant authentication is working

**Issue**: Slow query performance
- Add recommended database indexes
- Check if date range is too large
- Consider adding pagination
- Review query execution plans

**Issue**: Export not working
- Verify XLSX and jsPDF dependencies
- Check browser download permissions
- Ensure data is not empty
- Review export format compatibility

## 📚 Additional Resources

- [Recharts Documentation](https://recharts.org/)
- [React Query Documentation](https://tanstack.com/query)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)
- [XLSX Documentation](https://docs.sheetjs.com/)
