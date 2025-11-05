# POS Mobile - React Native

Aplicación móvil nativa del POS con capacidad offline-first para iOS y Android.

## 📱 Características

- **Offline-First**: Todas las operaciones funcionan sin conexión
- **Sincronización Automática**: Sincroniza datos en segundo plano
- **Punto de Venta Completo**:
  - Búsqueda de productos por nombre, SKU o código de barras
  - Escaneo de códigos de barras con cámara
  - Gestión de carrito con cantidades y descuentos
  - Cálculo automático de IVA y totales
  - Múltiples métodos de pago (efectivo, débito, crédito)
  - Información de cliente y notas
- **Gestión de Stock**: Visualización de disponibilidad en tiempo real
- **Multi-tenant**: Soporte para múltiples empresas y locaciones

## 🏗️ Arquitectura

### Stack Tecnológico

- **Framework**: React Native con Expo
- **Router**: Expo Router v4 (file-based routing)
- **Database**: SQLite con Drizzle ORM
- **State Management**: Zustand + Immer
- **Server State**: TanStack Query (React Query)
- **UI Library**: React Native Paper (Material Design)
- **Storage**:
  - SecureStore para tokens (encriptado)
  - AsyncStorage para datos de usuario
  - SQLite para datos de aplicación
- **Network**: Axios para HTTP requests
- **Testing**: Jest + React Testing Library

### Arquitectura Offline-First

```
┌─────────────────────────────────────────────────────────┐
│                     UI Components                        │
│              (React Native + Paper)                      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│               State Management Layer                     │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│   │  POS Store   │  │ Offline Store│  │   Auth Store │ │
│   │  (Zustand)   │  │  (Zustand)   │  │   (Context)  │ │
│   └──────────────┘  └──────────────┘  └──────────────┘ │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  Data Layer                              │
│   ┌──────────────┐         ┌──────────────┐            │
│   │  SQLite DB   │◄────────┤ Sync Service │            │
│   │  (Drizzle)   │         │ (Singleton)  │            │
│   └──────────────┘         └──────┬───────┘            │
│         ▲                         │                     │
│         │                         ▼                     │
│         │                  ┌──────────────┐            │
│         └──────────────────┤  API Client  │            │
│                            │   (Axios)    │            │
│                            └──────────────┘            │
└─────────────────────────────────────────────────────────┘
```

### Flujo de Datos

**Escritura (Ventas):**
1. Usuario completa venta → POS Store
2. `saveSaleLocally()` → SQLite (status: 'pending')
3. SyncService detecta pendientes
4. Push a servidor → SQLite (status: 'synced')

**Lectura (Productos/Stock):**
1. App inicia → pullLatestData()
2. API → SQLite (sobrescribe local)
3. Componente → SQLite query
4. Renderiza en UI

**Sincronización:**
- Auto-sync cada 60 segundos (configurable)
- Trigger manual con botón
- Auto-sync al volver a foreground
- Conexión/desconexión detectada automáticamente

### Estructura de la Base de Datos

**Tabla `products`**
- Caché local de productos
- Incluye: id, name, sku, barcode, price, tax, imageUrl, isActive

**Tabla `stock`**
- Inventario por producto y locación
- Campos: productId, locationId, quantity

**Tabla `local_sales`**
- Ventas pendientes de sincronización
- Campos: id, totalCents, taxCents, paymentMethod, syncStatus, serverId
- syncStatus: 'pending', 'syncing', 'synced', 'error'

**Tabla `local_sale_items`**
- Líneas de venta (items)
- Campos: localSaleId, productId, quantity, unitPrice, taxRate, discountPercent

**Tabla `sync_queue`**
- Cola genérica de operaciones pendientes
- Usado para operaciones adicionales futuras

**Tabla `sync_metadata`**
- Timestamps de última sincronización por entidad
- Optimización: solo pedir cambios desde lastSync

## 🚀 Setup

### Requisitos

- Node.js >= 18.x
- pnpm >= 8.x
- iOS: Xcode 15+ y CocoaPods
- Android: Android Studio y JDK 11+

### Instalación

```bash
# Instalar dependencias
pnpm install

# iOS: Instalar pods (solo primera vez)
cd ios && pod install && cd ..
```

### Variables de Entorno

Crear `.env` en la raíz del proyecto:

```bash
API_URL=https://api.tudominio.com
API_TIMEOUT=30000
SYNC_INTERVAL=60000
```

## 💻 Comandos de Desarrollo

```bash
# Iniciar desarrollo
pnpm start

# iOS
pnpm ios

# Android
pnpm android

# Web (preview)
pnpm web

# TypeScript check
pnpm typecheck

# Linting
pnpm lint

# Tests
pnpm test              # Ejecutar tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # Con cobertura
```

## 🧪 Testing

### Unit Tests

Los unit tests cubren la lógica de negocio en stores:

```bash
pnpm test
```

**Cobertura actual:**
- `pos-mobile-store`: 14 tests
  - Agregar/remover items
  - Actualizar cantidades
  - Descuentos (item y global)
  - Cálculo de IVA
  - Guardar venta localmente

### Estructura de Tests

```
apps/mobile/
└── store/
    └── __tests__/
        └── pos-mobile-store.test.ts
```

**Mocks incluidos:**
- expo-sqlite
- expo-secure-store
- @react-native-async-storage/async-storage
- @react-native-community/netinfo
- expo-barcode-scanner

## 🔄 Sincronización

### Estrategia de Sync

**Push (Ventas):**
- Ventas creadas localmente se marcan como 'pending'
- SyncService intenta enviar al servidor
- Si falla: reintenta automáticamente
- Si éxito: guarda serverId y marca como 'synced'

**Pull (Productos/Stock):**
- Descarga completa en cada sync
- Sobrescribe datos locales (server wins)
- Optimización futura: delta sync con lastSyncAt

### Manejo de Conflictos

**Estrategia actual: Server Wins**
- En caso de conflicto, prevalece el servidor
- Para productos/stock: siempre se sobrescribe con datos del servidor
- Para ventas: una vez sincronizado, el serverId es la fuente de verdad

### Triggers de Sincronización

1. **Auto-sync periódico**: cada 60 segundos (solo si hay conexión y pendientes)
2. **Manual**: botón en SyncIndicator
3. **App foreground**: al volver a la app desde background
4. **Post-venta**: intenta sync inmediato después de guardar venta

### Indicadores de Estado

**SyncIndicator muestra:**
- Conexión: Wifi (online) / WifiOff (offline)
- Estado: Cloud (synced) / CloudOff (pendientes) / Spinner (sincronizando)
- Conteo: cantidad de operaciones pendientes
- Last sync: "Hace Xm" / "Hace Xh"

## 📦 Build & Deploy

### Build de Desarrollo

```bash
# iOS
eas build --profile development --platform ios

# Android
eas build --profile development --platform android
```

### Build de Producción

```bash
# Configurar EAS (primera vez)
eas build:configure

# iOS App Store
eas build --profile production --platform ios

# Google Play Store
eas build --profile production --platform android
```

### Over-the-Air Updates (OTA)

```bash
# Publicar update para producción
eas update --branch production --message "Descripción del update"

# Preview
eas update --branch preview --message "Preview update"
```

## 🎨 UI Components

### Componentes POS

**ProductSearchBar** (`src/components/pos/ProductSearchBar.tsx`)
- Barra de búsqueda con botón de escáner
- Integración con expo-barcode-scanner
- Overlay de cámara con botón cerrar

**ProductCard** (`src/components/pos/ProductCard.tsx`)
- Card de producto con imagen
- Badges de stock (agotado, bajo stock)
- Botón agregar al carrito
- Precio con formato

**CartSummary** (`src/components/pos/CartSummary.tsx`)
- Barra inferior flotante
- Icono carrito con badge de cantidad
- Total visible
- Touchable para abrir carrito completo

**CheckoutModal** (`src/components/pos/CheckoutModal.tsx`)
- Modal de finalización de venta
- Selector de método de pago (SegmentedButtons)
- Resumen: subtotal, IVA, total
- Warning si está offline
- Botones cancelar/confirmar

**SyncIndicator** (`src/components/SyncIndicator.tsx`)
- Indicador de conexión y sincronización
- Iconos: Wifi, Cloud, CloudOff, Spinner
- Texto de estado
- Last sync timestamp
- Touchable para sync manual

### Custom Hooks

**useProducts** (`src/hooks/use-products.ts`)
- Hook para búsqueda de productos
- Query a SQLite con Drizzle
- Búsqueda por name, sku, barcode
- Incluye relación con stock
- Retorna: { products, isLoading }

**useToast** (`src/hooks/use-toast.ts`)
- Toast notifications cross-platform
- Android: ToastAndroid
- iOS: Alert
- Tipos: success, error, info
- Duración: short, long

## ⚡ Performance

### Optimizaciones Implementadas

**Base de Datos:**
- Índices en barcode, sku, name para búsquedas rápidas
- Límite de 20 resultados en búsquedas
- Queries específicas (no SELECT *)

**UI:**
- FlatList con keyExtractor para listas grandes
- Imágenes con placeholder
- Debounce en búsqueda (mínimo 2 caracteres)

**Estado:**
- Zustand con Immer para actualizaciones inmutables eficientes
- Selectores específicos para evitar re-renders innecesarios

### Métricas Target

- Búsqueda de producto: < 100ms
- Agregar al carrito: < 50ms
- Guardar venta localmente: < 200ms
- Inicialización de DB: < 500ms
- Sync de 100 productos: < 3s

## 🐛 Troubleshooting

### La app no inicia

```bash
# Limpiar caché
pnpm start --clear

# Reinstalar dependencias
rm -rf node_modules && pnpm install

# iOS: reinstalar pods
cd ios && pod install && cd ..
```

### Tests fallan

```bash
# Limpiar caché de Jest
pnpm test --clearCache

# Verificar mocks en jest.setup.js
```

### Base de datos corrupta

```bash
# Desinstalar app del dispositivo/simulador
# La DB se recreará en próximo inicio
```

### Sync no funciona

1. Verificar conexión a internet
2. Check API_URL en .env
3. Ver logs en consola: `console.log` en SyncService
4. Verificar pending sales: `SELECT * FROM local_sales WHERE syncStatus='pending'`

### Permisos de cámara

iOS: Agregar a `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Necesitamos acceso a la cámara para escanear códigos de barras</string>
```

Android: Permisos agregados automáticamente por expo-barcode-scanner

## 📚 Recursos

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Paper](https://reactnativepaper.com/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Zustand](https://zustand.docs.pmnd.rs/)
- [TanStack Query](https://tanstack.com/query/latest)

## 🤝 Contribuir

1. Crear branch desde `main`: `git checkout -b feature/nueva-funcionalidad`
2. Hacer cambios y commits
3. Ejecutar tests: `pnpm test`
4. Push y crear Pull Request
5. Esperar review y CI checks

## 📄 Licencia

Propietario - Todos los derechos reservados
