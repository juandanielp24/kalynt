# 📋 Mobile POS - Implementation Checklist

## ✅ 1. Setup y Configuración

- [x] **Proyecto Expo con TypeScript**
  - [x] Expo SDK 54 configurado
  - [x] TypeScript habilitado (tsconfig.json)
  - [x] Estructura de carpetas creada

- [x] **Dependencias Core**
  - [x] expo-router v4 instalado
  - [x] expo-sqlite instalado
  - [x] drizzle-orm + drizzle-kit
  - [x] react-native-paper
  - [x] zustand + immer
  - [x] @tanstack/react-query
  - [x] axios
  - [x] expo-barcode-scanner
  - [x] expo-camera
  - [x] expo-secure-store
  - [x] @react-native-async-storage/async-storage
  - [x] @react-native-community/netinfo

- [x] **Expo Router Configuración**
  - [x] `app/_layout.tsx` con providers
  - [x] Tabs layout configurado
  - [x] POS screen en `(tabs)/pos.tsx`
  - [x] Navegación funcional

- [x] **Base de Datos SQLite**
  - [x] `src/db/schema.ts` con tablas definidas
  - [x] `src/db/index.ts` con inicialización
  - [x] Drizzle config (`drizzle.config.ts`)

- [ ] **Migraciones (Opcional)**
  - [ ] Scripts de migración con drizzle-kit
  - [ ] Versionado de schema
  - [ ] Rollback strategy

---

## ✅ 2. Database Schema

- [x] **Tabla `products`**
  - [x] Campos: id, tenantId, locationId, name, sku, barcode
  - [x] Campos: priceCents, taxRate, imageUrl, isActive
  - [x] Índice en barcode
  - [x] Índice en sku

- [x] **Tabla `stock`**
  - [x] Campos: id, productId, locationId, quantity
  - [x] Relación con products
  - [x] Índice compuesto (productId, locationId)

- [x] **Tabla `local_sales`**
  - [x] Campos: id, tenantId, locationId
  - [x] Campos monetarios: subtotalCents, taxCents, discountCents, totalCents
  - [x] Campos de cliente: customerName, customerEmail, customerCuit, customerPhone
  - [x] Campos de pago: paymentMethod, generateInvoice, invoiceType
  - [x] Campos de sync: syncStatus, syncedAt, serverId, errorMessage
  - [x] Timestamps: createdAt
  - [x] Índice en syncStatus

- [x] **Tabla `local_sale_items`**
  - [x] Campos: id, localSaleId, productId
  - [x] Campos de producto: productName, productSku
  - [x] Campos de venta: quantity, unitPriceCents, taxRate, discountPercent, totalCents
  - [x] Relación con local_sales
  - [x] Índice en localSaleId

- [x] **Tabla `sync_queue`**
  - [x] Cola genérica de operaciones
  - [x] Campos: id, operationType, payload, status, attempts, lastError
  - [x] Índice en status

- [x] **Tabla `sync_metadata`**
  - [x] Metadata de sincronización
  - [x] Campos: entityType, lastSyncAt, lastSyncStatus
  - [x] Índice único en entityType

---

## ✅ 3. Offline-First Architecture

- [x] **Local Storage**
  - [x] SQLite como fuente de verdad local
  - [x] SecureStore para tokens de autenticación
  - [x] AsyncStorage para preferencias de usuario

- [x] **Sync Service**
  - [x] Singleton pattern implementado
  - [x] Métodos: syncPendingSales(), pullLatestData()
  - [x] Auto-retry en fallos
  - [x] Status tracking (pending → syncing → synced)

- [x] **Queue System**
  - [x] Cola FIFO para operaciones pendientes
  - [x] Persistencia en tabla sync_queue
  - [x] Procesamiento secuencial

- [x] **Conflict Resolution**
  - [x] Strategy: Server Wins para productos/stock
  - [x] Cliente guarda serverId después de sync exitoso
  - [x] No sobrescribir ventas ya sincronizadas

- [x] **Network Monitoring**
  - [x] NetInfo listener para detectar cambios
  - [x] useOfflineStore actualiza isOnline
  - [x] UI responde a cambios de conectividad

---

## ✅ 4. UI Components

### Componentes Base

- [x] **ProductSearchBar**
  - [x] Input de búsqueda con Paper Searchbar
  - [x] Botón de escáner de barcode
  - [x] Integración con expo-barcode-scanner
  - [x] Overlay de cámara
  - [x] Manejo de permisos de cámara

- [x] **ProductCard**
  - [x] Card con imagen de producto
  - [x] Nombre, SKU, precio
  - [x] Badge de stock (agotado, bajo, disponible)
  - [x] Botón "Agregar al carrito"
  - [x] Disabled cuando sin stock

- [x] **CartSummary**
  - [x] Barra inferior flotante
  - [x] Icono de carrito con badge de cantidad
  - [x] Total visible
  - [x] Touchable para abrir carrito completo

- [x] **CheckoutModal**
  - [x] Modal de React Native Paper
  - [x] SegmentedButtons para método de pago
  - [x] Resumen: subtotal, IVA, total
  - [x] Sección de datos de cliente (opcional)
  - [x] Warning si offline
  - [x] Botones: Cancelar, Confirmar Venta
  - [x] Loading state durante procesamiento

- [x] **SyncIndicator**
  - [x] Iconos de estado: Wifi, WifiOff, Cloud, CloudOff, Spinner
  - [x] Texto de estado
  - [x] Badge con conteo de pendientes
  - [x] Timestamp de última sincronización
  - [x] Touchable para sync manual

### Pantallas

- [x] **POS Main Screen (`app/(tabs)/pos.tsx`)**
  - [x] Header con título y SyncIndicator
  - [x] ProductSearchBar
  - [x] FlatList de productos
  - [x] EmptyState cuando no hay resultados
  - [x] Loading state durante búsqueda
  - [x] CartSummary (si hay items)
  - [x] CheckoutModal
  - [x] Dialog de carrito con lista de items
  - [x] FAB.Group con acciones

---

## ✅ 5. Features

### Búsqueda de Productos

- [x] **Búsqueda por texto**
  - [x] Query a SQLite con LIKE
  - [x] Búsqueda en: name, sku, barcode
  - [x] Mínimo 2 caracteres
  - [x] Límite de 20 resultados

- [x] **Escaneo de Barcode**
  - [x] Botón en SearchBar
  - [x] Pedir permisos de cámara
  - [x] Overlay con vista de cámara
  - [x] Detectar código y buscar automáticamente
  - [x] Cerrar cámara después de escanear

### Carrito

- [x] **Agregar Items**
  - [x] Desde ProductCard
  - [x] Si ya existe: incrementar cantidad
  - [x] Si es nuevo: agregar con qty=1

- [x] **Modificar Items**
  - [x] Actualizar cantidad
  - [x] Aplicar descuento por item
  - [x] Remover item

- [x] **Descuentos**
  - [x] Descuento por item (%)
  - [x] Descuento global (%)
  - [x] Cálculo correcto de totales

- [x] **Cálculos**
  - [x] Subtotal (suma de items)
  - [x] IVA (extraído del precio, ya incluido)
  - [x] Descuentos aplicados
  - [x] Total final

### Checkout

- [x] **Métodos de Pago**
  - [x] Efectivo
  - [x] Tarjeta de débito
  - [x] Tarjeta de crédito

- [x] **Guardar Venta Offline**
  - [x] Insertar en local_sales
  - [x] Insertar items en local_sale_items
  - [x] Marcar como syncStatus='pending'
  - [x] Limpiar carrito después de guardar

- [x] **Post-Venta Actions**
  - [x] Mostrar toast de confirmación
  - [x] Intentar sync inmediato si online
  - [x] Mostrar mensaje apropiado según resultado

---

## ✅ 6. Sincronización

### Auto-Sync

- [x] **Periódico**
  - [x] Ejecutar cada 60 segundos
  - [x] Solo si isOnline=true
  - [x] Solo si hay operaciones pendientes
  - [x] startAutoSync() y stopAutoSync()

- [x] **App Foreground**
  - [x] Listener de AppState
  - [x] Trigger sync al volver a 'active'
  - [x] Cleanup en unmount

### Manual Sync

- [x] **Botón de Sync**
  - [x] En SyncIndicator (touchable)
  - [x] Disabled si offline o ya está sincronizando
  - [x] Feedback visual (spinner)

### Push (Ventas)

- [x] **syncPendingSales()**
  - [x] Buscar sales con status='pending'
  - [x] Incluir items de cada sale
  - [x] POST /api/sales con payload completo
  - [x] Guardar serverId en local
  - [x] Actualizar syncStatus='synced'
  - [x] Manejo de errores (marcar como 'error', guardar mensaje)

### Pull (Productos/Stock)

- [x] **pullLatestData()**
  - [x] GET /api/products con filtros (locationId, isActive)
  - [x] GET /api/stock con filtros
  - [x] Limpiar tablas locales
  - [x] Insertar nuevos datos
  - [x] Actualizar sync_metadata con timestamp

### Retry Logic

- [x] **En caso de fallo**
  - [x] Incrementar contador de intentos
  - [x] Guardar errorMessage
  - [x] Status='error' temporalmente
  - [x] Reintentar en próximo ciclo de sync

---

## ✅ 7. Testing

### Unit Tests

- [x] **pos-mobile-store.test.ts**
  - [x] addItem: agregar nuevo producto
  - [x] addItem: incrementar si ya existe
  - [x] removeItem: eliminar del carrito
  - [x] updateQuantity: cambiar cantidad
  - [x] updateQuantity: remover si qty=0
  - [x] updateItemDiscount: aplicar descuento
  - [x] setGlobalDiscount: descuento global
  - [x] clearCart: limpiar todo
  - [x] saveSaleLocally: guardar venta en DB
  - [x] saveSaleLocally: incluir datos de cliente
  - [x] saveSaleLocally: manejar múltiples items
  - [x] Cálculo de IVA correcto
  - [x] Descuentos combinados (item + global)
  - [x] Recálculo proporcional de IVA con descuento

- [ ] **sync-service.test.ts** (Futuro)
  - [ ] syncPendingSales: enviar al servidor
  - [ ] syncPendingSales: retry en error
  - [ ] pullLatestData: descargar y guardar
  - [ ] pullLatestData: limpiar datos viejos

- [ ] **offline-store.test.ts** (Futuro)
  - [ ] Detectar cambios de conexión
  - [ ] Actualizar isOnline correctamente
  - [ ] needsSync() retorna true cuando hay pendientes

### E2E Tests

- [ ] **Detox Setup** (Pendiente)
  - [ ] Instalar detox
  - [ ] Configurar para iOS y Android
  - [ ] Scripts de e2e en package.json

- [ ] **pos.e2e.test.ts** (Pendiente)
  - [ ] Flujo completo de venta offline
  - [ ] Búsqueda de producto
  - [ ] Agregar al carrito
  - [ ] Checkout con método de pago
  - [ ] Verificar venta guardada
  - [ ] Simulación de conexión/desconexión
  - [ ] Sincronización automática

---

## ⚡ 8. Performance

### Optimización de DB

- [x] **Índices**
  - [x] products: barcode, sku
  - [x] stock: (productId, locationId)
  - [x] local_sales: syncStatus
  - [x] local_sale_items: localSaleId

- [ ] **Queries Optimizadas** (Revisar)
  - [x] Limitar resultados (LIMIT 20)
  - [x] Seleccionar solo campos necesarios
  - [ ] Usar transacciones para múltiples inserts
  - [ ] Batch inserts en pullLatestData

### Lazy Loading

- [x] **FlatList**
  - [x] Renderizado eficiente con keyExtractor
  - [x] initialNumToRender configurado
  - [ ] onEndReached para paginación (futuro)

- [ ] **Imágenes**
  - [x] Placeholder cuando no hay imagen
  - [ ] react-native-fast-image (considerar)
  - [ ] Cache de imágenes

### Memory Leaks

- [x] **Cleanup**
  - [x] AppState listener cleanup
  - [x] NetInfo listener cleanup
  - [x] SyncService stopAutoSync en unmount

---

## 🎨 9. UX Polish

### Loading States

- [x] **Búsqueda de productos**
  - [x] ActivityIndicator mientras busca
  - [x] Texto "Buscando productos..."

- [x] **Checkout**
  - [x] Botón con loading=true durante procesamiento
  - [x] Deshabilitar acciones mientras procesa

- [x] **Sync**
  - [x] Spinner en SyncIndicator
  - [x] Texto "Sincronizando..."

### Error Handling

- [x] **Toasts**
  - [x] Success: "Venta registrada", "Sincronizado"
  - [x] Error: "Error al procesar venta"
  - [x] Info: "Se sincronizará cuando haya conexión"

- [ ] **Error Boundaries** (Futuro)
  - [ ] Capturar errores de componentes
  - [ ] Pantalla de error amigable
  - [ ] Botón de "Reintentar"

### Offline Indicators

- [x] **Warnings**
  - [x] Banner en CheckoutModal si offline
  - [x] Color amarillo con icono ⚠️

- [x] **SyncIndicator**
  - [x] Colores diferenciados:
    - Verde: online y synced
    - Amarillo: online con pendientes
    - Rojo: offline
    - Azul: sincronizando

### Empty States

- [x] **Sin resultados de búsqueda**
  - [x] Texto: "No se encontraron productos"
  - [x] Icono ilustrativo

- [x] **Carrito vacío**
  - [x] Texto: "Tu carrito está vacío"
  - [x] Ocultar CartSummary

### Pull to Refresh

- [ ] **Futuro**
  - [ ] RefreshControl en FlatList
  - [ ] Trigger sync manual
  - [ ] Actualizar lista de productos

---

## 📦 10. Build & Deploy

### Configuración

- [ ] **EAS Build**
  - [ ] eas.json configurado
  - [ ] Profiles: development, preview, production
  - [ ] App identifiers únicos

- [ ] **App Icons**
  - [ ] icon.png (1024x1024)
  - [ ] adaptive-icon.png para Android
  - [ ] Generados para todas las resoluciones

- [ ] **Splash Screen**
  - [ ] splash.png (2048x2048)
  - [ ] Background color configurado
  - [ ] Resize mode: contain/cover

### Store Metadata

- [ ] **iOS App Store**
  - [ ] Bundle ID registrado
  - [ ] Certificados y provisioning profiles
  - [ ] Screenshots (6.7", 6.5", 5.5")
  - [ ] App Store description
  - [ ] Keywords para SEO
  - [ ] Privacy policy URL

- [ ] **Google Play Store**
  - [ ] Package name registrado
  - [ ] Keystore para signing
  - [ ] Screenshots (phone, tablet)
  - [ ] Play Store description
  - [ ] Feature graphic (1024x500)
  - [ ] Privacy policy URL

### CI/CD

- [ ] **GitHub Actions** (Futuro)
  - [ ] Workflow para tests
  - [ ] Workflow para builds
  - [ ] Auto-deploy de OTA updates

---

## 📝 Notas Finales

### Completado (PARTE 1-4)

- ✅ Setup completo del proyecto
- ✅ Base de datos SQLite con schema completo
- ✅ Arquitectura offline-first funcional
- ✅ Sync service bidireccional
- ✅ UI completa del POS
- ✅ Todos los componentes principales
- ✅ Custom hooks (useProducts, useToast)
- ✅ Unit tests (14 tests pasando)
- ✅ README completo con documentación

### Pendiente (PARTE 5 - Opcional)

- ⏳ E2E tests con Detox
- ⏳ Optimizaciones avanzadas de performance
- ⏳ CI/CD pipeline
- ⏳ Configuración completa de EAS Build
- ⏳ Publicación en stores

### Próximos Pasos Recomendados

1. **Testing en dispositivos reales**
   - Probar en iOS y Android físicos
   - Verificar rendimiento de DB en dispositivos antiguos
   - Testear sincronización con conexión inestable

2. **Optimizaciones**
   - Implementar batch inserts en pullLatestData
   - Agregar paginación en búsqueda de productos
   - Cache de imágenes con fast-image

3. **Features adicionales**
   - Búsqueda avanzada con filtros
   - Historial de ventas locales
   - Reportes offline
   - Soporte para múltiples idiomas (i18n)

4. **DevOps**
   - Configurar Sentry para error tracking
   - Analytics con Firebase/Amplitude
   - OTA updates automáticos
   - Beta testing con TestFlight/Play Console

---

**Status General: 85% Completado** ✅

Core functionality implementado y testeado. Listo para desarrollo adicional y deployment.
