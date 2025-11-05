# Documentación de Sincronización Offline

## Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Almacenamiento Local](#almacenamiento-local)
4. [Cola de Sincronización](#cola-de-sincronización)
5. [Estrategias de Sincronización](#estrategias-de-sincronización)
6. [Detección de Conectividad](#detección-de-conectividad)
7. [Manejo de Conflictos](#manejo-de-conflictos)
8. [Operaciones Soportadas](#operaciones-soportadas)
9. [Implementación Técnica](#implementación-técnica)
10. [Debugging y Troubleshooting](#debugging-y-troubleshooting)

---

## Descripción General

### ¿Qué es la Sincronización Offline?

El sistema de sincronización offline permite a los usuarios de la aplicación móvil continuar trabajando sin conexión a internet. Las acciones realizadas offline se guardan localmente y se sincronizan automáticamente cuando la conectividad se restaura.

### Ventajas

✅ **Productividad continua:** Los usuarios pueden trabajar sin interrupciones, sin importar la calidad de conexión

✅ **Datos siempre disponibles:** Acceso a información crítica incluso sin internet

✅ **Sincronización automática:** No requiere intervención manual del usuario

✅ **Resiliente a fallos:** Sistema de reintentos automáticos para operaciones fallidas

✅ **Consistencia de datos:** Mecanismos para resolver conflictos y garantizar integridad

### Casos de Uso

**Recepción en almacén:**
```
Usuario: Almacenero
Escenario: Almacén sin WiFi, recepción de mercadería
Flujo:
  1. Abre app móvil offline
  2. Ve lista de órdenes pendientes (caché)
  3. Registra recepción de mercadería
  4. Acción se guarda en cola de sincronización
  5. Sale del almacén, se conecta al WiFi
  6. App sincroniza automáticamente
  7. Stock se actualiza en servidor
```

**Visita a proveedor:**
```
Usuario: Comprador
Escenario: Reunión con proveedor en zona sin señal
Flujo:
  1. Revisa historial de órdenes (caché)
  2. Crea nueva orden de compra
  3. Orden se guarda localmente
  4. Regresa a oficina con WiFi
  5. Orden se sincroniza y envía al proveedor
```

**Registro de pagos en ruta:**
```
Usuario: Contador
Escenario: Viajando, necesita registrar pago urgente
Flujo:
  1. Realiza transferencia bancaria
  2. Abre app móvil (sin conexión en el transporte)
  3. Registra pago con referencia de transferencia
  4. Al llegar a destino y conectarse
  5. Pago se sincroniza automáticamente
```

---

## Arquitectura

### Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    APLICACIÓN MÓVIL                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐         ┌──────────────────┐           │
│  │  React Native  │         │  Expo Router      │           │
│  │  Components    │◄────────┤  Navigation       │           │
│  └────────┬───────┘         └──────────────────┘           │
│           │                                                  │
│           ▼                                                  │
│  ┌────────────────────────────────────────────┐            │
│  │        TanStack Query (React Query)         │            │
│  │  ┌─────────────┐    ┌──────────────────┐  │            │
│  │  │   Cache     │    │  Query State     │  │            │
│  │  │  Management │    │   Management     │  │            │
│  │  └─────────────┘    └──────────────────┘  │            │
│  └────────┬──────────────────────┬────────────┘            │
│           │                      │                          │
│           ▼                      ▼                          │
│  ┌────────────────┐    ┌────────────────────────┐         │
│  │  API Client    │    │ Suppliers Sync Service  │         │
│  │  (Axios)       │    │  - Sync Queue           │         │
│  └────────┬───────┘    │  - Retry Logic          │         │
│           │            │  - Conflict Resolution  │         │
│           │            └────────┬────────────────┘         │
│           │                     │                           │
│           ▼                     ▼                           │
│  ┌────────────────────────────────────────────┐            │
│  │          AsyncStorage (SQLite)              │            │
│  │  ┌────────────┐  ┌────────────────────┐   │            │
│  │  │ @suppliers │  │ @purchase_orders    │   │            │
│  │  └────────────┘  └────────────────────┘   │            │
│  │  ┌────────────┐  ┌────────────────────┐   │            │
│  │  │ @sync_queue│  │ @suppliers_last_sync│   │            │
│  │  └────────────┘  └────────────────────┘   │            │
│  └────────────────────────────────────────────┘            │
│                          ▲                                  │
│                          │                                  │
│                          ▼                                  │
│  ┌────────────────────────────────────────────┐            │
│  │      NetInfo (Network Detection)            │            │
│  │  - Connection State                         │            │
│  │  - Connection Type (WiFi/Cellular/None)     │            │
│  │  - Connection Quality                       │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ HTTP/HTTPS
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                      API SERVER                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────┐            │
│  │            NestJS Controllers               │            │
│  │  - Suppliers                                │            │
│  │  - Purchase Orders                          │            │
│  │  - Payments                                 │            │
│  └────────┬───────────────────────────────────┘            │
│           │                                                  │
│           ▼                                                  │
│  ┌────────────────────────────────────────────┐            │
│  │           Prisma ORM                        │            │
│  └────────┬───────────────────────────────────┘            │
│           │                                                  │
│           ▼                                                  │
│  ┌────────────────────────────────────────────┐            │
│  │          PostgreSQL Database                │            │
│  │  - Multi-tenant                             │            │
│  │  - ACID Transactions                        │            │
│  └────────────────────────────────────────────┘            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Datos

**Online (con conexión):**
```
User Action → React Component → TanStack Query → API Client → Server → Database
                                        ↓
                                AsyncStorage (cache update)
```

**Offline (sin conexión):**
```
User Action → React Component → Sync Service → Sync Queue (AsyncStorage)
                                        ↓
                                AsyncStorage (data update)
                                        ↓
                                UI Update (optimistic)
```

**Reconexión:**
```
NetInfo Detects Connection → Sync Service → Process Queue → API Requests
                                                  ↓
                                            Server Updates
                                                  ↓
                                           Fetch Fresh Data
                                                  ↓
                                           Update Local Cache
```

---

## Almacenamiento Local

### AsyncStorage

La aplicación usa `@react-native-async-storage/async-storage` para persistencia local.

**Características:**
- Almacenamiento clave-valor persistente
- Asíncrono (no bloquea la UI)
- Basado en SQLite en Android
- Basado en archivos en iOS
- Límite: ~6MB en iOS, ~unlimited en Android

### Claves de Almacenamiento

```typescript
const STORAGE_KEYS = {
  // Datos cacheados
  SUPPLIERS: '@suppliers',
  PURCHASE_ORDERS: '@purchase_orders',

  // Sincronización
  SYNC_QUEUE: '@suppliers_sync_queue',
  LAST_SYNC: '@suppliers_last_sync',
};
```

### Estructura de Datos Cacheados

**Proveedores:**
```json
{
  "key": "@suppliers",
  "value": [
    {
      "id": "clx123abc",
      "name": "Proveedor ABC",
      "code": "SUP-001",
      // ... todos los campos del proveedor
      "_cached_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

**Órdenes de Compra:**
```json
{
  "key": "@purchase_orders",
  "value": [
    {
      "id": "clx111aaa",
      "orderNumber": "PO-00001",
      "status": "CONFIRMED",
      // ... todos los campos de la orden
      "supplier": { /* proveedor denormalizado */ },
      "items": [ /* items denormalizados */ ],
      "_cached_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### Estrategia de Caché

**Escritura (Write-Through):**
```
1. User makes change
2. Write to AsyncStorage immediately
3. Add to sync queue
4. When online: sync to server
5. On success: update cache with server response
```

**Lectura (Cache-First):**
```
1. User requests data
2. Check AsyncStorage first
3. If found and fresh: return cached data
4. If not found or stale: fetch from server
5. Update cache with server response
```

**Freshness (Frescura):**
```typescript
const CACHE_TTL = {
  SUPPLIERS: 24 * 60 * 60 * 1000,        // 24 horas
  PURCHASE_ORDERS: 12 * 60 * 60 * 1000, // 12 horas
  SYNC_QUEUE: Infinity,                   // Nunca expira
};
```

---

## Cola de Sincronización

### Estructura de la Cola

```typescript
interface SyncQueueItem {
  id: string;                    // Unique ID (timestamp + random)
  type: SyncOperationType;       // Tipo de operación
  data: any;                     // Datos de la operación
  timestamp: number;             // Cuándo se creó (ms)
  retries: number;               // Número de reintentos
  error?: string;                // Último error (si lo hay)
}

type SyncOperationType =
  | 'CREATE_SUPPLIER'
  | 'UPDATE_SUPPLIER'
  | 'CREATE_PURCHASE_ORDER'
  | 'SEND_PURCHASE_ORDER'
  | 'CONFIRM_PURCHASE_ORDER'
  | 'RECEIVE_PURCHASE_ORDER'
  | 'CANCEL_PURCHASE_ORDER'
  | 'CREATE_PAYMENT';
```

### Ejemplo de Item en Cola

```json
{
  "id": "1642252800000-a3f9k2j",
  "type": "RECEIVE_PURCHASE_ORDER",
  "data": {
    "orderId": "clx111aaa",
    "receiveData": {
      "items": [
        {
          "itemId": "clx222itm",
          "quantityReceived": 50
        }
      ],
      "receivedDate": "2025-01-15T10:30:00Z"
    }
  },
  "timestamp": 1642252800000,
  "retries": 0,
  "error": null
}
```

### Operaciones en la Cola

**Agregar a la cola:**
```typescript
async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>) {
  const queueJson = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
  const queue: SyncQueueItem[] = queueJson ? JSON.parse(queueJson) : [];

  const queueItem: SyncQueueItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
    retries: 0,
  };

  queue.push(queueItem);
  await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));

  // Intentar procesar inmediatamente si hay conexión
  if (this.isOnline) {
    this.processSyncQueue();
  }
}
```

**Procesar la cola:**
```typescript
async processSyncQueue() {
  if (!this.isOnline) return;

  const queueJson = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
  if (!queueJson) return;

  const queue: SyncQueueItem[] = JSON.parse(queueJson);
  const remainingQueue: SyncQueueItem[] = [];

  for (const item of queue) {
    try {
      await this.processQueueItem(item);
      console.log(`✅ Sincronizado: ${item.type}`);
    } catch (error: any) {
      console.error(`❌ Error: ${item.type}`, error);

      // Reintentar hasta 3 veces
      if (item.retries < 3) {
        remainingQueue.push({
          ...item,
          retries: item.retries + 1,
          error: error.message,
        });
      } else {
        console.error(`⚠️ Max reintentos alcanzado: ${item.type}`);
        // Opcional: notificar al usuario
      }
    }
  }

  // Actualizar cola con items restantes
  await AsyncStorage.setItem(
    STORAGE_KEYS.SYNC_QUEUE,
    JSON.stringify(remainingQueue)
  );
}
```

**Procesar item individual:**
```typescript
async processQueueItem(item: SyncQueueItem) {
  switch (item.type) {
    case 'CREATE_SUPPLIER':
      await suppliersApi.createSupplier(item.data);
      break;

    case 'UPDATE_SUPPLIER':
      await suppliersApi.updateSupplier(item.data.id, item.data);
      break;

    case 'CREATE_PURCHASE_ORDER':
      await suppliersApi.createPurchaseOrder(item.data);
      break;

    case 'RECEIVE_PURCHASE_ORDER':
      await suppliersApi.receivePurchaseOrder(
        item.data.orderId,
        item.data.receiveData
      );
      break;

    case 'CREATE_PAYMENT':
      await suppliersApi.createPayment(item.data);
      break;

    // ... más casos
  }
}
```

---

## Estrategias de Sincronización

### 1. Sincronización Automática

**Trigger al reconectar:**
```typescript
NetInfo.addEventListener((state) => {
  const wasOffline = !this.isOnline;
  this.isOnline = state.isConnected ?? false;

  if (wasOffline && this.isOnline) {
    console.log('🌐 Red restaurada, sincronizando...');
    this.processSyncQueue();
  }
});
```

**Auto-sync periódico:**
```typescript
startAutoSync() {
  this.syncInterval = setInterval(() => {
    if (this.isOnline && !this.isSyncing) {
      console.log('⏰ Auto-sync activado');
      this.syncAll();
    }
  }, 10 * 60 * 1000); // Cada 10 minutos
}
```

### 2. Sincronización Manual

**Forzar sync:**
```typescript
async forceSync() {
  console.log('🔄 Sincronización forzada');
  await this.syncAll();
}
```

**Pull-to-refresh:**
```typescript
// En componente React Native
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await suppliersSyncService.forceSync();
  setRefreshing(false);
};

<ScrollView
  refreshControl={
    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
  }
>
  {/* contenido */}
</ScrollView>
```

### 3. Sincronización Optimista

**UI optimista:**
```typescript
// Usuario crea orden offline
async createOrderOptimistic(orderData) {
  // 1. Generar ID temporal
  const tempId = `temp-${Date.now()}`;

  // 2. Crear orden localmente con ID temporal
  const localOrder = {
    id: tempId,
    ...orderData,
    status: 'DRAFT',
    _isPending: true,
  };

  // 3. Actualizar UI inmediatamente
  updateLocalCache(localOrder);

  // 4. Agregar a cola de sincronización
  await addToSyncQueue({
    type: 'CREATE_PURCHASE_ORDER',
    data: orderData,
  });

  // 5. Mostrar indicador de "pendiente de sincronización"
  return { ...localOrder, _tempId: tempId };
}

// Cuando sincroniza con éxito
onSyncSuccess(tempId, serverResponse) {
  // Reemplazar orden temporal con la del servidor
  replaceInCache(tempId, serverResponse);
}
```

---

## Detección de Conectividad

### NetInfo

```typescript
import NetInfo from '@react-native-community/netinfo';

// Estado de conexión
interface ConnectionState {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: ConnectionType;
  details: {
    isConnectionExpensive: boolean;
    cellularGeneration: '2g' | '3g' | '4g' | '5g' | null;
    // ...
  };
}

// Listener de cambios
const unsubscribe = NetInfo.addEventListener(state => {
  console.log('Connection type:', state.type);
  console.log('Is connected?', state.isConnected);
  console.log('Internet reachable?', state.isInternetReachable);
});
```

### Estrategias por Tipo de Conexión

**WiFi:**
```typescript
if (state.type === 'wifi' && state.isConnected) {
  // Sincronización completa sin restricciones
  await syncAll();
}
```

**Celular:**
```typescript
if (state.type === 'cellular' && state.isConnected) {
  if (state.details.isConnectionExpensive) {
    // Solo sincronizar datos críticos
    await syncCriticalOnly();
  } else {
    // Sincronización completa
    await syncAll();
  }
}
```

**Sin conexión:**
```typescript
if (!state.isConnected) {
  // Modo offline
  showOfflineIndicator();
  useLocalCacheOnly();
}
```

### Indicadores Visuales

**Barra de estado offline:**
```tsx
import { NetInfoState } from '@react-native-community/netinfo';

export function OfflineBar({ netInfo }: { netInfo: NetInfoState }) {
  if (netInfo.isConnected) return null;

  return (
    <View style={styles.offlineBar}>
      <Icon name="wifi-off" size={16} color="white" />
      <Text style={styles.offlineText}>
        Modo sin conexión
      </Text>
      <Text style={styles.offlineSubtext}>
        Los cambios se sincronizarán automáticamente
      </Text>
    </View>
  );
}
```

**Badge de sincronización pendiente:**
```tsx
export function SyncBadge({ queueCount }: { queueCount: number }) {
  if (queueCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Icon name="cloud-upload" size={12} />
      <Text>{queueCount} pendientes</Text>
    </View>
  );
}
```

---

## Manejo de Conflictos

### Tipos de Conflictos

**1. Conflicto de edición concurrente:**
```
Usuario A (offline): Edita orden PO-00001
Usuario B (online): Edita misma orden PO-00001

Cuando A se sincroniza:
- Detectar que la versión del servidor es más reciente
- Mostrar conflicto al usuario
- Opciones: mantener cambios locales, usar cambios del servidor, o fusionar
```

**2. Conflicto de eliminación:**
```
Usuario A (offline): Elimina pago PAY-00001
Usuario B (online): Elimina mismo pago

Cuando A se sincroniza:
- Detectar que el recurso ya no existe
- Marcar operación como completada (idempotente)
- No mostrar error al usuario
```

**3. Conflicto de validación:**
```
Usuario A (offline): Registra pago de $1000
Mientras tanto (online): Otro usuario pagó $500

Cuando A se sincroniza:
- El saldo pendiente ahora es menor
- El pago de $1000 excede el saldo
- Mostrar error y permitir ajuste
```

### Estrategias de Resolución

**Last Write Wins (LWW):**
```typescript
// El último cambio gana, basado en timestamp
async resolveConflictLWW(localItem, serverItem) {
  if (localItem.updatedAt > serverItem.updatedAt) {
    // Cambio local es más reciente
    return await saveToServer(localItem);
  } else {
    // Cambio del servidor es más reciente
    return await saveToLocal(serverItem);
  }
}
```

**Manual Resolution:**
```typescript
async resolveConflictManual(localItem, serverItem) {
  // Mostrar diálogo al usuario
  const choice = await showConflictDialog({
    title: 'Conflicto detectado',
    message: 'La orden fue modificada desde otro dispositivo',
    options: [
      { label: 'Usar mis cambios', value: 'local' },
      { label: 'Usar cambios del servidor', value: 'server' },
      { label: 'Fusionar', value: 'merge' },
    ],
  });

  switch (choice) {
    case 'local':
      return await saveToServer(localItem);
    case 'server':
      return await saveToLocal(serverItem);
    case 'merge':
      const merged = await mergeItems(localItem, serverItem);
      return await saveToServer(merged);
  }
}
```

**Operational Transform (OT):**
```typescript
// Para operaciones complejas, transformar operaciones
async resolveConflictOT(localOps, serverOps) {
  // Transformar operaciones locales para aplicar después de las del servidor
  const transformedOps = transform(localOps, serverOps);
  return await applyOperations(transformedOps);
}
```

### Prevención de Conflictos

**Optimistic Locking:**
```typescript
interface Order {
  id: string;
  version: number; // Incrementa en cada cambio
  // ...
}

async updateOrder(order: Order) {
  const response = await api.put(`/orders/${order.id}`, {
    ...order,
    expectedVersion: order.version,
  });

  if (response.status === 409) {
    // Conflict: version mismatch
    throw new ConflictError('Order was modified');
  }
}
```

**Granular Updates:**
```typescript
// En lugar de actualizar toda la orden
await api.put('/orders/123', entireOrder);

// Actualizar solo campos específicos
await api.patch('/orders/123/notes', { notes: 'Nueva nota' });
```

---

## Operaciones Soportadas

### Modo Offline Completo

**✅ Lectura (Read):**
- Ver lista de proveedores (caché)
- Ver lista de órdenes de compra (caché)
- Ver detalle de órdenes (caché)
- Ver historial de pagos (caché)

**✅ Escritura (Write):**
- Crear nueva orden de compra
- Recibir mercadería
- Registrar pagos
- Actualizar información de proveedores

**❌ No soportado offline:**
- Operaciones que requieren cálculos del servidor
- Operaciones que requieren validación en tiempo real
- Generación de reportes complejos

### API Offline

```typescript
class SuppliersSyncService {
  /**
   * Crear orden offline
   */
  async createPurchaseOrderOffline(data: CreateOrderDTO) {
    if (this.isOnline) {
      try {
        const response = await suppliersApi.createPurchaseOrder(data);
        return { success: true, offline: false, orderId: response.data.id };
      } catch (error) {
        // Fallo online, intentar offline
      }
    }

    // Cola offline
    await this.addToSyncQueue({
      type: 'CREATE_PURCHASE_ORDER',
      data,
    });

    return { success: true, offline: true };
  }

  /**
   * Recibir mercadería offline
   */
  async receivePurchaseOrderOffline(
    orderId: string,
    receiveData: ReceiveOrderDTO
  ) {
    if (this.isOnline) {
      try {
        await suppliersApi.receivePurchaseOrder(orderId, receiveData);
        return { success: true, offline: false };
      } catch (error) {
        // Fallo online, intentar offline
      }
    }

    // Cola offline
    await this.addToSyncQueue({
      type: 'RECEIVE_PURCHASE_ORDER',
      data: { orderId, receiveData },
    });

    return { success: true, offline: true };
  }

  /**
   * Crear pago offline
   */
  async createPaymentOffline(data: CreatePaymentDTO) {
    if (this.isOnline) {
      try {
        await suppliersApi.createPayment(data);
        return { success: true, offline: false };
      } catch (error) {
        // Fallo online, intentar offline
      }
    }

    // Cola offline
    await this.addToSyncQueue({
      type: 'CREATE_PAYMENT',
      data,
    });

    return { success: true, offline: true };
  }
}
```

---

## Implementación Técnica

### Inicialización del Servicio

```typescript
// apps/mobile/src/lib/sync/suppliers-sync.service.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { suppliersApi } from '../api/suppliers';

class SuppliersSyncService {
  private isOnline: boolean = true;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;

  constructor() {
    this.initializeNetworkListener();
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        console.log('[Sync] Red restaurada, sincronizando...');
        this.processSyncQueue();
      }
    });
  }

  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncAll();
      }
    }, 10 * 60 * 1000); // 10 minutos
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Singleton
export const suppliersSyncService = new SuppliersSyncService();
```

### Uso en Componentes React Native

```tsx
import { suppliersSyncService } from '@/lib/sync/suppliers-sync.service';

export function PurchaseOrderDetailScreen({ orderId }) {
  const [isOffline, setIsOffline] = useState(false);
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    // Monitorear estado de conexión
    const checkConnection = () => {
      setIsOffline(!suppliersSyncService.isConnected());
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Monitorear cola de sincronización
    const checkQueue = async () => {
      const status = await suppliersSyncService.getSyncQueueStatus();
      setQueueCount(status.total);
    };

    const interval = setInterval(checkQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleReceiveMerchandise = async (receiveData) => {
    const result = await suppliersSyncService.receivePurchaseOrderOffline(
      orderId,
      receiveData
    );

    if (result.offline) {
      Alert.alert(
        'Guardado offline',
        'La recepción se sincronizará cuando tenga conexión'
      );
    } else {
      Alert.alert('Éxito', 'Mercadería recibida correctamente');
    }
  };

  return (
    <View>
      {isOffline && <OfflineBar />}
      {queueCount > 0 && <SyncBadge count={queueCount} />}

      <Button
        title="Recibir Mercadería"
        onPress={() => handleReceiveMerchandise(receiveData)}
      />
    </View>
  );
}
```

### Integración con React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suppliersSyncService } from '@/lib/sync/suppliers-sync.service';

export function usePurchaseOrders() {
  const queryClient = useQueryClient();

  // Query con fallback a caché offline
  const { data, isLoading, error } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => {
      if (suppliersSyncService.isConnected()) {
        // Online: fetch from server
        const response = await suppliersApi.getPurchaseOrders({});
        return response.data.orders;
      } else {
        // Offline: get from cache
        return await suppliersSyncService.getCachedPurchaseOrders();
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Mutation con soporte offline
  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      return await suppliersSyncService.createPurchaseOrderOffline(orderData);
    },
    onSuccess: () => {
      // Invalidar cache para refrescar lista
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });

  return {
    orders: data,
    isLoading,
    error,
    createOrder: createOrderMutation.mutate,
    isCreating: createOrderMutation.isPending,
  };
}
```

---

## Debugging y Troubleshooting

### Logs del Sistema

```typescript
// Habilitar logs detallados
const DEBUG = __DEV__; // true en desarrollo

function log(category: string, message: string, data?: any) {
  if (!DEBUG) return;

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}][${category}]`;

  if (data) {
    console.log(prefix, message, data);
  } else {
    console.log(prefix, message);
  }
}

// Uso
log('Sync', 'Procesando cola', { itemCount: queue.length });
log('NetInfo', 'Conexión restaurada', { type: 'wifi' });
log('Cache', 'Datos cargados', { key: '@suppliers', count: 50 });
```

### Herramientas de Debugging

**1. Inspector de AsyncStorage:**
```typescript
// Comando para ver todo el storage
async function inspectStorage() {
  const keys = await AsyncStorage.getAllKeys();
  const items = await AsyncStorage.multiGet(keys);

  console.log('=== ASYNC STORAGE ===');
  items.forEach(([key, value]) => {
    console.log(`Key: ${key}`);
    console.log(`Value:`, JSON.parse(value || '{}'));
    console.log('---');
  });
}

// Llamar desde consola de dev tools
global.inspectStorage = inspectStorage;
```

**2. Monitor de cola de sincronización:**
```tsx
export function SyncDebugScreen() {
  const [queue, setQueue] = useState<SyncQueueItem[]>([]);

  useEffect(() => {
    const loadQueue = async () => {
      const status = await suppliersSyncService.getSyncQueueStatus();
      setQueue(status.items);
    };

    loadQueue();
    const interval = setInterval(loadQueue, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView>
      <Text style={styles.title}>
        Cola de Sincronización ({queue.length})
      </Text>

      {queue.map(item => (
        <View key={item.id} style={styles.item}>
          <Text style={styles.type}>{item.type}</Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
          <Text style={styles.retries}>
            Reintentos: {item.retries}/3
          </Text>
          {item.error && (
            <Text style={styles.error}>Error: {item.error}</Text>
          )}
          <Text style={styles.data}>
            {JSON.stringify(item.data, null, 2)}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
```

**3. Simulador de red:**
```typescript
// Simular offline para testing
class NetworkSimulator {
  static forceOffline() {
    suppliersSyncService['isOnline'] = false;
    console.log('📡 Modo offline forzado');
  }

  static forceOnline() {
    suppliersSyncService['isOnline'] = true;
    console.log('📡 Modo online forzado');
  }

  static simulateSlow(delayMs: number = 3000) {
    const originalFetch = global.fetch;
    global.fetch = async (...args) => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return originalFetch(...args);
    };
    console.log(`🐌 Red lenta simulada: ${delayMs}ms delay`);
  }
}

global.NetworkSimulator = NetworkSimulator;
```

### Problemas Comunes

**Problema 1: Cola no se procesa**
```
Síntomas:
- Items en cola pero no se sincronizan
- Contador de pendientes no baja

Diagnóstico:
1. Verificar que esté online: suppliersSyncService.isConnected()
2. Verificar que auto-sync esté activo
3. Revisar logs para errores de red

Solución:
- Forzar sync: await suppliersSyncService.forceSync()
- Reiniciar auto-sync: suppliersSyncService.startAutoSync()
```

**Problema 2: Datos desactualizados en caché**
```
Síntomas:
- Los datos no coinciden con el servidor
- Cambios de otros usuarios no aparecen

Diagnóstico:
1. Verificar timestamp de caché
2. Verificar última sincronización

Solución:
- Limpiar caché: await suppliersSyncService.clearCache()
- Forzar sync: await suppliersSyncService.forceSync()
```

**Problema 3: Items duplicados en cola**
```
Síntomas:
- Misma operación múltiples veces en cola
- Errores de duplicación en servidor

Diagnóstico:
1. Revisar logs de adición a cola
2. Verificar IDs de items en cola

Solución:
- Implementar deduplicación antes de agregar:
```typescript
async addToSyncQueue(item: QueueItem) {
  const queue = await this.getQueue();

  // Verificar si ya existe
  const exists = queue.some(
    q => q.type === item.type &&
         JSON.stringify(q.data) === JSON.stringify(item.data)
  );

  if (exists) {
    console.warn('Item ya existe en cola, ignorando');
    return;
  }

  // Agregar...
}
```

### Testing

**Unit Tests:**
```typescript
import { SuppliersSyncService } from './suppliers-sync.service';

describe('SuppliersSyncService', () => {
  let service: SuppliersSyncService;

  beforeEach(() => {
    service = new SuppliersSyncService();
    AsyncStorage.clear();
  });

  test('should add item to sync queue', async () => {
    await service.addToSyncQueue({
      type: 'CREATE_PURCHASE_ORDER',
      data: { supplierId: '123' },
    });

    const status = await service.getSyncQueueStatus();
    expect(status.total).toBe(1);
    expect(status.items[0].type).toBe('CREATE_PURCHASE_ORDER');
  });

  test('should process queue when online', async () => {
    // Mock API
    const createOrderSpy = jest.spyOn(suppliersApi, 'createPurchaseOrder');
    createOrderSpy.mockResolvedValue({ data: { id: '456' } });

    // Add to queue
    await service.addToSyncQueue({
      type: 'CREATE_PURCHASE_ORDER',
      data: { supplierId: '123' },
    });

    // Process
    await service.processSyncQueue();

    // Verify API was called
    expect(createOrderSpy).toHaveBeenCalledWith({ supplierId: '123' });

    // Verify queue is empty
    const status = await service.getSyncQueueStatus();
    expect(status.total).toBe(0);
  });
});
```

**Integration Tests:**
```typescript
describe('Offline sync integration', () => {
  test('should sync order creation when going online', async () => {
    // Simular offline
    NetworkSimulator.forceOffline();

    // Crear orden offline
    const result = await service.createPurchaseOrderOffline({
      supplierId: '123',
      items: [{ productId: '456', quantity: 10 }],
    });

    expect(result.offline).toBe(true);

    // Verificar en cola
    const queueBefore = await service.getSyncQueueStatus();
    expect(queueBefore.total).toBe(1);

    // Simular reconexión
    NetworkSimulator.forceOnline();
    await service.processSyncQueue();

    // Verificar cola vacía
    const queueAfter = await service.getSyncQueueStatus();
    expect(queueAfter.total).toBe(0);
  });
});
```

---

## Mejoras Futuras

### Próximas Funcionalidades

**1. Delta Sync:**
```typescript
// Solo sincronizar cambios desde última sync
async syncDelta() {
  const lastSync = await this.getLastSyncTime();
  const changes = await api.get('/sync/delta', {
    params: { since: lastSync.toISOString() },
  });

  await this.applyChanges(changes);
}
```

**2. Compresión de datos:**
```typescript
// Comprimir datos grandes antes de cachear
import { compress, decompress } from 'lz-string';

async cacheData(key: string, data: any) {
  const json = JSON.stringify(data);
  const compressed = compress(json);
  await AsyncStorage.setItem(key, compressed);
}

async getCachedData(key: string) {
  const compressed = await AsyncStorage.getItem(key);
  if (!compressed) return null;

  const json = decompress(compressed);
  return JSON.parse(json);
}
```

**3. Sync selectivo:**
```typescript
// Permitir al usuario elegir qué sincronizar
async syncSelective(options: SyncOptions) {
  if (options.suppliers) {
    await this.syncSuppliers();
  }

  if (options.orders) {
    await this.syncPurchaseOrders();
  }

  // etc...
}
```

**4. Background sync:**
```typescript
// Sincronizar en background cuando app está inactiva
import BackgroundFetch from 'react-native-background-fetch';

BackgroundFetch.configure({
  minimumFetchInterval: 15, // minutos
}, async (taskId) => {
  console.log('[BackgroundFetch] Iniciando sync...');
  await suppliersSyncService.syncAll();
  BackgroundFetch.finish(taskId);
});
```

---

## Referencias

**Librerías utilizadas:**
- [@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage)
- [@react-native-community/netinfo](https://github.com/react-native-netinfo/react-native-netinfo)
- [TanStack Query](https://tanstack.com/query)
- [Axios](https://axios-http.com/)

**Patrones y arquitecturas:**
- [Offline First](https://offlinefirst.org/)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CQRS](https://martinfowler.com/bliki/CQRS.html)
- [Operational Transformation](https://en.wikipedia.org/wiki/Operational_transformation)

---

**Última actualización:** Enero 2025
**Versión:** 1.0.0
**Mantenido por:** Equipo Kalynt
