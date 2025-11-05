# POS (Point of Sale) Module

Sistema completo de Punto de Venta para el Retail Super App, desarrollado con React, Next.js, y Zustand.

## Características

### ✨ Funcionalidades Principales

- **Gestión de Carrito**
  - Agregar productos desde búsqueda o scanner de código de barras
  - Actualizar cantidades con botones +/-
  - Aplicar descuentos individuales por item
  - Aplicar descuento global al total de la venta
  - Eliminar items del carrito
  - Limpiar carrito completo

- **Búsqueda de Productos**
  - Búsqueda en tiempo real con debounce (300ms)
  - Soporte para scanner de código de barras
  - Detección automática de Enter para agregar producto
  - Visualización de stock disponible
  - Advertencias de stock bajo/sin stock

- **Métodos de Pago**
  - Efectivo
  - Tarjeta de Débito
  - Tarjeta de Crédito
  - Mercado Pago (con generación de QR)
  - MODO (próximamente)
  - Transferencia Bancaria (próximamente)

- **Facturación Electrónica (AFIP)**
  - Factura A (requiere CUIT del cliente)
  - Factura B (consumidor final)
  - Factura C (monotributista)
  - Validación de CUIT con algoritmo de verificación
  - Generación automática de CAE

- **Gestión de Clientes**
  - Datos del cliente (nombre, email, teléfono)
  - CUIT con formato automático (XX-XXXXXXXX-X)
  - Validación de datos según tipo de factura

- **Impresión**
  - Ticket térmico formato 80mm
  - Diseño optimizado para impresoras fiscales
  - Información completa de venta y factura
  - Logo y datos del negocio

- **Cálculos Automáticos**
  - IVA incluido en precio (método de extracción)
  - Subtotal, descuentos, impuestos y total
  - Soporte para múltiples tasas de IVA (21%, 10.5%, etc.)
  - Redondeo correcto para evitar errores de centavos

## Arquitectura

### Stack Tecnológico

```
- React 18 + Next.js 14 (App Router)
- TypeScript
- Zustand + Immer (State Management)
- React Query (Server State)
- TailwindCSS (Styling)
- react-to-print (Printing)
- date-fns (Date Formatting)
```

### Estructura de Archivos

```
apps/web/src/
├── app/(dashboard)/pos/
│   ├── page.tsx                    # Página principal del POS
│   └── README.md                   # Esta documentación
│
├── components/pos/
│   ├── ProductSearch.tsx           # Búsqueda de productos
│   ├── Cart.tsx                    # Carrito de compras
│   ├── CheckoutModal.tsx           # Modal de checkout con tabs
│   ├── PaymentMethodSelector.tsx   # Selector de métodos de pago
│   ├── CustomerForm.tsx            # Formulario de cliente
│   ├── InvoiceOptions.tsx          # Opciones de facturación
│   ├── SaleSuccessModal.tsx        # Modal de venta exitosa
│   └── ReceiptPrintable.tsx        # Componente imprimible
│
├── stores/
│   ├── pos-store.ts                # Store de Zustand
│   └── __tests__/
│       └── pos-store.spec.ts       # Tests unitarios del store
│
├── hooks/
│   ├── use-debounce.ts             # Hook de debounce
│   ├── use-keyboard-shortcuts.ts   # Atajos de teclado
│   ├── use-barcode-scanner.ts      # Scanner de códigos de barras
│   └── use-sound-effects.ts        # Efectos de sonido
│
└── lib/
    ├── formatters.ts               # Funciones de formato
    ├── validators.ts               # Funciones de validación
    └── calculations.ts             # Cálculos de precios e impuestos

tests/e2e/specs/pos/
└── pos-complete-flow.spec.ts       # Tests E2E completos
```

## Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `F1` | Abrir búsqueda de productos |
| `F2` | Procesar venta (ir a checkout) |
| `F3` | Limpiar carrito |
| `F4` | Aplicar descuento |
| `Ctrl + S` | Guardar venta |
| `Ctrl + P` | Imprimir ticket |
| `Ctrl + N` | Nueva venta |
| `Enter` | Agregar producto (en búsqueda) |
| `Esc` | Cerrar modal activo |
| `+` / `-` | Incrementar/Decrementar cantidad (item seleccionado) |

## Métodos de Pago

### Efectivo
- Pago inmediato aprobado
- No requiere integración externa
- Calcular cambio en efectivo

### Tarjetas (Débito/Crédito)
- Requiere integración con terminal POS físico
- Soporte para cuotas en crédito
- Comisiones según configuración

### Mercado Pago
- Generación automática de QR de pago
- Webhook para confirmación de pago
- Link de pago compartible
- Estados: pendiente, aprobado, rechazado

### MODO
- Próximamente
- Similar a Mercado Pago

### Transferencia Bancaria
- Próximamente
- Datos bancarios del comercio
- Confirmación manual

## Tipos de Factura (AFIP)

### Factura A
- **Para**: Empresas inscriptas en IVA
- **Requiere**: CUIT válido del cliente
- **Incluye**: Discriminación de IVA
- **Validación**: CUIT con algoritmo de verificación

### Factura B
- **Para**: Consumidor final
- **Requiere**: Datos opcionales del cliente
- **Incluye**: IVA incluido en precio
- **Uso**: Venta al público general

### Factura C
- **Para**: Monotributistas
- **Requiere**: CUIT del cliente
- **Incluye**: Sin IVA (exento)

## Impresión

### Configuración de Impresora Térmica

1. **Formato**: 80mm de ancho
2. **Driver**: Usar driver genérico de texto
3. **Configuración del navegador**:
   - Márgenes: 0
   - Escala: 100%
   - Orientación: Vertical

### Contenido del Ticket

- Encabezado con logo y datos del negocio
- Información de la venta (número, fecha, hora)
- Datos de factura (si aplica): Tipo, número, CAE
- Datos del cliente (si aplica)
- Detalle de productos (nombre, cantidad, precio, subtotal)
- Totales: Subtotal, descuento, IVA, total
- Método de pago
- Pie con información de contacto

### Código de Ejemplo

```typescript
import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { ReceiptPrintable } from '@/components/pos/ReceiptPrintable';

const printRef = useRef<HTMLDivElement>(null);

const handlePrint = useReactToPrint({
  content: () => printRef.current,
});

// En JSX
<ReceiptPrintable ref={printRef} sale={saleData} />
<Button onClick={handlePrint}>Imprimir</Button>
```

## Testing

### Tests Unitarios

```bash
# Ejecutar tests del store
pnpm test pos-store.spec.ts

# Con coverage
pnpm test:coverage pos-store.spec.ts
```

**Cobertura**:
- ✅ Agregar items al carrito
- ✅ Incrementar cantidad de items existentes
- ✅ Eliminar items
- ✅ Actualizar cantidades
- ✅ Aplicar descuentos individuales
- ✅ Aplicar descuento global
- ✅ Cálculo de IVA
- ✅ Cálculo de totales
- ✅ Limpiar carrito
- ✅ Gestión de cliente
- ✅ Casos extremos (descuento 100%, cantidades grandes, etc.)

### Tests E2E

```bash
# Ejecutar tests E2E
pnpm test:e2e pos-complete-flow

# Con UI de Playwright
pnpm test:e2e:ui
```

**Flujos cubiertos**:
- ✅ Venta completa con efectivo
- ✅ Múltiples productos con cantidades
- ✅ Aplicación de descuentos
- ✅ Información de cliente
- ✅ Generación de factura
- ✅ Diferentes métodos de pago
- ✅ Limpiar carrito
- ✅ Advertencias de stock
- ✅ Scanner de código de barras
- ✅ Impresión de ticket
- ✅ Validación de carrito vacío
- ✅ Persistencia de datos durante sesión

## Guía de Uso

### Flujo Básico de Venta

1. **Buscar Producto**
   - Escribir en el campo de búsqueda
   - O escanear código de barras
   - Click en producto para agregarlo

2. **Gestionar Carrito**
   - Ajustar cantidades con +/-
   - Aplicar descuentos si es necesario
   - Revisar totales

3. **Procesar Venta**
   - Click en "Procesar Venta"
   - Seleccionar método de pago
   - Agregar datos del cliente (opcional)
   - Configurar factura (opcional)
   - Click en "Confirmar Venta"

4. **Post-Venta**
   - Imprimir ticket
   - Generar PDF (próximamente)
   - Enviar por email (próximamente)
   - Click en "Nueva Venta"

### Uso del Scanner de Código de Barras

```typescript
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';

// En componente
useBarcodeScanner((barcode) => {
  // Buscar producto por código de barras
  const product = findProductByBarcode(barcode);
  if (product) {
    addItem(product);
  }
}, {
  minLength: 8,
  timeout: 100
});
```

### Cálculo de IVA (Precio Incluido)

```typescript
import { calculateTaxFromGrossPrice } from '@/lib/calculations';

// Precio bruto: $121.00 (incluye IVA 21%)
const grossPriceCents = 12100;
const taxRate = 0.21;

const taxCents = calculateTaxFromGrossPrice(grossPriceCents, taxRate);
// taxCents = 2100 ($21.00)

const netPriceCents = grossPriceCents - taxCents;
// netPriceCents = 10000 ($100.00)
```

### Validación de CUIT

```typescript
import { validateCUIT, formatCUIT } from '@/lib/validators';

const cuit = '20-12345678-9';

if (validateCUIT(cuit)) {
  // CUIT válido
} else {
  // CUIT inválido
}

// Auto-formateo
const formatted = formatCUIT('20123456789');
// formatted = '20-12345678-9'
```

## Troubleshooting

### Problemas Comunes

#### La búsqueda no encuentra productos
- Verificar que el backend esté corriendo
- Revisar configuración de API endpoint
- Verificar permisos de acceso

#### No se pueden agregar productos al carrito
- Verificar stock del producto
- Revisar console del navegador para errores
- Verificar que el producto tenga precio válido

#### Error al procesar venta
- Verificar conexión con backend
- Revisar que todos los campos requeridos estén completos
- Para Factura A, verificar que se ingresó CUIT válido

#### La impresión no funciona
- Verificar configuración de la impresora
- Asegurar que los márgenes estén en 0
- Probar con "Vista previa de impresión" primero

#### El scanner de código de barras no funciona
- Verificar que el scanner esté configurado como teclado
- Asegurar que envíe Enter al final del código
- Revisar que el timeout no sea muy corto
- Verificar que no esté enfocado en un input/textarea

### Debug del Store

```typescript
// En DevTools o componente de debug
import { usePOSStore } from '@/stores/pos-store';

function DebugPanel() {
  const state = usePOSStore();

  return (
    <pre>{JSON.stringify(state, null, 2)}</pre>
  );
}
```

### Logs de React Query

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// En layout o página
<ReactQueryDevtools initialIsOpen={false} />
```

## Roadmap

### Próximas Funcionalidades

- [ ] Modo offline con sincronización
- [ ] Soporte para múltiples monedas
- [ ] Programa de fidelización y puntos
- [ ] Descuentos por cupones
- [ ] Integración con balanza electrónica
- [ ] Múltiples cajas/terminales
- [ ] Turnos y cierre de caja
- [ ] Reporte de ventas diarias
- [ ] Gestión de devoluciones
- [ ] Comandas para restaurantes
- [ ] Mesa/Delivery
- [ ] Propinas

### Mejoras Pendientes

- [ ] Soporte para productos con variantes
- [ ] Búsqueda por categorías
- [ ] Favoritos/Accesos rápidos
- [ ] Historial de últimas ventas
- [ ] Re-impresión de tickets
- [ ] Envío de ticket por email/WhatsApp
- [ ] Generación de PDF del ticket
- [ ] Modo oscuro para POS
- [ ] Soporte para tablets
- [ ] Teclado virtual numérico

## Contribuir

### Agregar Nuevo Método de Pago

1. Actualizar `PaymentMethodSelector.tsx`:
```typescript
const paymentMethods: PaymentMethod[] = [
  // ... métodos existentes
  {
    id: 'nuevo_metodo',
    name: 'Nuevo Método',
    icon: IconComponent,
    description: 'Descripción',
  },
];
```

2. Actualizar backend para procesar el método
3. Agregar tests E2E para el nuevo método

### Agregar Nuevo Tipo de Descuento

1. Extender interfaz en `pos-store.ts`
2. Implementar lógica en método `recalculate()`
3. Agregar UI en `Cart.tsx`
4. Agregar tests unitarios

## Soporte

Para reportar bugs o solicitar funcionalidades:
- GitHub Issues: [link]
- Email: support@retailsuperapp.com
- Documentación completa: [link]

## Licencia

Propietario - Retail Super App © 2024
