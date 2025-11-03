# @retail/ui

Paquete de componentes UI compartidos usando shadcn/ui para el proyecto Retail Super App.

## Componentes incluidos

### shadcn/ui components
- **Button** - Botones con variantes (default, destructive, outline, ghost, link)
- **Card** - Tarjetas con header, content y footer
- **Dialog** - Modales y diálogos
- **Dropdown Menu** - Menús desplegables
- **Input** - Inputs de formulario
- **Label** - Labels para formularios
- **Select** - Select dropdown
- **Table** - Tablas con header, body y footer
- **Tabs** - Pestañas navegables
- **Toast** - Notificaciones toast
- **Badge** - Badges para estados
- **Avatar** - Avatares de usuario
- **Skeleton** - Loading skeletons
- **Alert** - Alertas de información
- **Separator** - Separadores visuales

### Componentes Custom

#### CurrencyInput
Input especializado para montos en moneda argentina (ARS).

```tsx
import { CurrencyInput } from '@retail/ui';

function PriceForm() {
  const [price, setPrice] = useState(0); // en centavos

  return (
    <CurrencyInput
      value={price}
      onChange={setPrice}
      placeholder="Ingrese el precio"
    />
  );
}
```

#### LoadingSpinner
Spinner de carga con tamaños personalizables.

```tsx
import { LoadingSpinner } from '@retail/ui';

function Loading() {
  return (
    <div className="flex justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
```

#### EmptyState
Estado vacío con icono, título, descripción y acción opcional.

```tsx
import { EmptyState } from '@retail/ui';
import { PackageIcon } from 'lucide-react';

function ProductsList() {
  return (
    <EmptyState
      icon={PackageIcon}
      title="No hay productos"
      description="Comienza agregando tu primer producto al inventario"
      action={{
        label: "Agregar producto",
        onClick: () => console.log('Add product')
      }}
    />
  );
}
```

## Utilidades

### cn()
Función helper para combinar clases CSS con Tailwind.

```tsx
import { cn } from '@retail/ui';

function MyComponent({ className }) {
  return (
    <div className={cn('text-base font-medium', className)}>
      Content
    </div>
  );
}
```

## Uso en apps

### 1. Instalar el paquete
El paquete se instala automáticamente como workspace dependency en el monorepo.

### 2. Importar estilos globales
En tu app de Next.js o React, importa los estilos globales:

```tsx
// app/layout.tsx o _app.tsx
import '@retail/ui/src/styles/globals.css';
```

### 3. Usar componentes
```tsx
import { Button, Card, CardHeader, CardTitle, CardContent } from '@retail/ui';

export function Dashboard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <Button>Click me</Button>
      </CardContent>
    </Card>
  );
}
```

## Temas

El paquete soporta light/dark mode usando CSS variables. Las variables de color están definidas en `globals.css`.

Para cambiar el tema en tu app, simplemente agrega la clase `dark` al elemento `<html>`:

```tsx
<html className={isDarkMode ? 'dark' : ''}>
```

## Desarrollo

```bash
# Compilar tipos
pnpm typecheck

# Build del paquete
pnpm build

# Desarrollo con watch mode
pnpm dev
```
