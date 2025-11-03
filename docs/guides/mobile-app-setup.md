# Mobile App Setup Guide - React Native + Expo

Esta guía documenta la configuración y estructura de la aplicación móvil POS con React Native y Expo.

## 📁 Estructura de Archivos

```
apps/mobile/
├── app/                          # Expo Router - File-based routing
│   ├── (auth)/                   # Grupo de rutas de autenticación
│   │   ├── _layout.tsx           # Layout de auth
│   │   └── login.tsx             # Pantalla de login
│   ├── (tabs)/                   # Grupo de rutas con tabs
│   │   ├── _layout.tsx           # Tab navigation
│   │   ├── index.tsx             # POS principal
│   │   ├── inventory.tsx         # Inventario
│   │   ├── sales.tsx             # Ventas
│   │   └── more.tsx              # Más opciones
│   ├── _layout.tsx               # Root layout
│   └── +not-found.tsx            # 404
├── components/
│   ├── pos/
│   │   ├── ProductCard.tsx       # Tarjeta de producto
│   │   └── Cart.tsx              # Carrito de compras
│   └── ui/
│       ├── Button.tsx            # Botón reutilizable
│       ├── Card.tsx              # Tarjeta contenedor
│       ├── Input.tsx             # Input de texto
│       └── LoadingSpinner.tsx    # Spinner de carga
├── lib/
│   ├── api-client.ts             # Axios client configurado
│   ├── storage.ts                # AsyncStorage wrapper
│   └── database.ts               # SQLite para offline
├── hooks/
│   ├── use-products.ts           # Hook para productos
│   ├── use-sales.ts              # Hook para ventas
│   └── use-offline-sync.ts       # Hook para sync offline
├── store/
│   ├── cart-store.ts             # Zustand - Carrito
│   ├── auth-store.ts             # Zustand - Auth
│   └── sync-store.ts             # Zustand - Sync state
├── types/
│   └── navigation.ts             # Tipos de navegación
├── constants/
│   └── Colors.ts                 # Paleta de colores
├── app.json                      # Configuración de Expo
├── babel.config.js               # Babel config
└── tsconfig.json                 # TypeScript config
```

## 🚀 Características

### 1. Expo Router (File-Based Routing)

La app usa **Expo Router v4** para navegación basada en archivos:

- **Route Groups**: `(auth)` y `(tabs)` organizan rutas sin afectar URLs
- **Tab Navigation**: Navegación por pestañas en la pantalla principal
- **Type Safety**: Rutas tipadas automáticamente

### 2. Offline-First con SQLite

La app funciona **completamente offline**:

**Base de datos SQLite** (`lib/database.ts`):
- Cache de productos localmente
- Cola de ventas pendientes
- Log de sincronización

**Sincronización automática** (`hooks/use-offline-sync.ts`):
- Detecta conexión a internet
- Sincroniza ventas pendientes automáticamente
- Maneja errores de red gracefully

```typescript
// Ejemplo de uso
import { useOfflineSync } from '@/hooks/use-offline-sync';

function MyComponent() {
  const { isOnline, syncPendingSales } = useOfflineSync();

  return (
    <View>
      <Text>{isOnline ? 'Online' : 'Offline'}</Text>
      <Button onPress={syncPendingSales} title="Sincronizar" />
    </View>
  );
}
```

### 3. State Management con Zustand

**Cart Store** (`store/cart-store.ts`):
- Gestión del carrito de compras
- Persistencia con AsyncStorage
- Cálculos de totales e impuestos

```typescript
import { useCartStore } from '@/store/cart-store';

const cart = useCartStore();
cart.addItem({ productId, productName, sku, unitPriceCents, taxRate });
cart.getTotalCents();
cart.clearCart();
```

**Auth Store** (`store/auth-store.ts`):
- Usuario autenticado
- Token de sesión
- Persistencia entre sesiones

**Sync Store** (`store/sync-store.ts`):
- Estado de sincronización
- Cambios pendientes
- Última sincronización

### 4. React Query para Server State

```typescript
import { useProducts } from '@/hooks/use-products';

function POSScreen() {
  const { data: products, isLoading } = useProducts();

  // Si API falla, automáticamente usa cache de SQLite
  return <ProductList products={products} />;
}
```

**Características**:
- Cache automático
- Retry logic
- Fallback a SQLite si offline
- Stale time de 5 minutos

### 5. Integración con @retail/shared

Usa utilidades compartidas del monorepo:

```typescript
import { formatCurrencyARS, validateCUIT } from '@retail/shared';

<Text>{formatCurrencyARS(priceCents)}</Text>
```

## 🔧 Configuración

### Variables de Entorno

Crea `app.config.js` para variables de entorno:

```javascript
export default {
  expo: {
    extra: {
      apiUrl: process.env.API_URL || 'http://localhost:3001',
    },
  },
};
```

### Desarrollo

**Iniciar el servidor de desarrollo:**

```bash
# Desde la raíz del monorepo
pnpm --filter @retail/mobile start

# O desde apps/mobile/
cd apps/mobile
pnpm start
```

**Opciones:**
- Presiona `a` para Android
- Presiona `i` para iOS
- Presiona `w` para Web
- Escanea el QR con Expo Go app

### Build

**Android:**
```bash
pnpm --filter @retail/mobile android
```

**iOS:**
```bash
pnpm --filter @retail/mobile ios
```

### Type Checking

```bash
pnpm --filter @retail/mobile typecheck
```

## 📦 Dependencias Principales

### Expo SDK
- `expo@~54.0.20`: SDK de Expo
- `expo-router@~4.0.0`: File-based routing
- `expo-sqlite@~15.0.0`: Base de datos offline
- `expo-camera@~16.0.0`: Acceso a cámara
- `expo-barcode-scanner@~14.0.0`: Escaneo de códigos
- `expo-secure-store@~14.0.0`: Almacenamiento seguro

### React Native
- `react@19.1.0`: React 19
- `react-native@0.81.5`: RN con nueva arquitectura
- `react-native-safe-area-context`: Safe areas
- `react-native-screens`: Optimización de navegación

### State y Data
- `@tanstack/react-query@^5.28.0`: Server state
- `zustand@^4.5.2`: Client state
- `@react-native-async-storage/async-storage`: Persistencia
- `@react-native-community/netinfo`: Detección de red

### HTTP y Validación
- `axios@^1.6.7`: HTTP client
- `zod@^3.22.4`: Validación

### UI
- `lucide-react-native@^0.344.0`: Iconos
- `date-fns@^3.3.1`: Manejo de fechas

### Workspace
- `@retail/shared@workspace:*`: Lógica compartida

## 📱 Pantallas

### 1. Login (`app/(auth)/login.tsx`)

Pantalla de autenticación con:
- Input de email y contraseña
- Validación de formulario
- Demo credentials
- Navegación a tabs después de login

### 2. POS (`app/(tabs)/index.tsx`)

Punto de venta principal con:
- Lista de productos en grid
- Búsqueda de productos
- Botón de escáner de códigos
- Carrito lateral
- Procesamiento de ventas

**Componentes:**
- `ProductCard`: Muestra producto con imagen y precio
- `Cart`: Carrito con items, total y checkout

### 3. Inventario (`app/(tabs)/inventory.tsx`)

Gestión de inventario (placeholder - a implementar):
- Lista de productos
- Stock por ubicación
- Movimientos de inventario
- Ajustes de stock

### 4. Ventas (`app/(tabs)/sales.tsx`)

Historial de ventas (placeholder - a implementar):
- Lista de ventas realizadas
- Detalles de cada venta
- Filtros por fecha
- Exportación de reportes

### 5. Más (`app/(tabs)/more.tsx`)

Configuración y opciones (placeholder - a implementar):
- Perfil de usuario
- Configuración de impresora
- Sincronización manual
- Cerrar sesión

## 🎯 Próximos Pasos

### Funcionalidades Pendientes

1. **Escáner de Códigos de Barras**
   - Pantalla de scanner con `expo-camera`
   - Búsqueda de producto por código
   - Agregar al carrito desde scanner

2. **Procesamiento de Ventas**
   - Pantalla de checkout
   - Selección de método de pago
   - Impresión de ticket
   - Integración con AFIP (futuro)

3. **Gestión de Inventario Completa**
   - CRUD de productos
   - Ajustes de stock
   - Movimientos entre ubicaciones
   - Alertas de stock bajo

4. **Sincronización Mejorada**
   - Progress bar durante sync
   - Resolución de conflictos
   - Retry automático con backoff
   - Notificaciones de sync

5. **Impresión de Tickets**
   - Integración con impresoras Bluetooth
   - Templates personalizables
   - Logo del comercio
   - QR code en tickets

6. **Reportes**
   - Dashboard de métricas
   - Gráficos de ventas
   - Productos más vendidos
   - Exportación a PDF/CSV

## 🎨 Guía de Estilos

### Colores

Usa las constantes de `constants/Colors.ts`:

```typescript
import { Colors } from '@/constants/Colors';

<View style={{ backgroundColor: Colors.light.primary }} />
```

### Componentes UI

Componentes reutilizables en `components/ui/`:

```typescript
import { Button, Card, Input, LoadingSpinner } from '@/components/ui';

<Card>
  <Input label="Email" value={email} onChangeText={setEmail} />
  <Button title="Login" onPress={handleLogin} variant="primary" />
</Card>
```

### Estilos

Usa StyleSheet para mejor performance:

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
```

## 🔒 Seguridad

### SecureStore para Datos Sensibles

```typescript
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('auth_token', token);
const token = await SecureStore.getItemAsync('auth_token');
```

### AsyncStorage para Datos No Sensibles

```typescript
import { storage } from '@/lib/storage';

await storage.setItem('last_sync', Date.now().toString());
const lastSync = await storage.getItem('last_sync');
```

## 🐛 Debugging

### React Native Debugger

1. Instalar React Native Debugger
2. Shake el dispositivo/emulador
3. Seleccionar "Debug JS Remotely"

### Expo DevTools

```bash
pnpm start
```

Abre automáticamente DevTools en el navegador.

### Logs

```typescript
console.log('Debug:', data);
console.error('Error:', error);
console.warn('Warning:', message);
```

## 📚 Recursos

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://expo.github.io/router/docs/)
- [React Native](https://reactnative.dev/)
- [React Query](https://tanstack.com/query/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/)

## 🤝 Convenciones de Código

1. **Componentes**: PascalCase (`ProductCard.tsx`)
2. **Hooks**: camelCase con prefijo `use` (`useProducts.ts`)
3. **Screens**: En carpetas de route groups (`app/(tabs)/index.tsx`)
4. **Stores**: kebab-case con sufijo `-store` (`cart-store.ts`)
5. **Tipos**: PascalCase (`CartItem`, `Product`)

### Orden de Imports

```typescript
// 1. React y React Native
import { View, Text } from 'react-native';

// 2. Expo
import { useRouter } from 'expo-router';

// 3. Librerías externas
import { useQuery } from '@tanstack/react-query';

// 4. Workspace packages
import { formatCurrencyARS } from '@retail/shared';

// 5. Imports locales
import { useCartStore } from '@/store/cart-store';
import { ProductCard } from '@/components/pos/ProductCard';
```

## ✅ Checklist de Calidad

Antes de hacer commit:

- [ ] TypeScript compila sin errores
- [ ] No hay warnings de ESLint
- [ ] App funciona en modo offline
- [ ] Componentes usan tipos correctos
- [ ] Loading states implementados
- [ ] Error handling implementado
- [ ] Responsive para diferentes tamaños
- [ ] Accesibilidad básica (labels, tap areas)
- [ ] Performance optimizado

## 📞 Soporte

Para dudas o problemas:
1. Revisa la documentación de Expo
2. Consulta los ejemplos en el código
3. Crea un issue en el repositorio
