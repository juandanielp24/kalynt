# Convenciones del Proyecto

## 📁 Nomenclatura de Archivos
- Componentes: `PascalCase.tsx` (e.g., `ProductCard.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatCurrency.ts`)
- Tipos: `types.ts` o `[feature].types.ts`
- Constantes: `constants.ts` con `SCREAMING_SNAKE_CASE`

## 🎨 Estructura de Componentes React
```tsx
// Imports
import { useState } from 'react'
import { Card } from '@retail/ui'
import { formatCurrency } from '@retail/shared'

// Types
interface ProductCardProps {
  id: string
  name: string
  price: number
}

// Component
export function ProductCard({ id, name, price }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <Card>
      {/* JSX */}
    </Card>
  )
}
```

## 🔧 Funciones Utilitarias
```typescript
/**
 * Formatea un número como moneda argentina (ARS)
 * @param amount - Monto en centavos
 * @returns String formateado (e.g., "$1.234,56")
 */
export function formatCurrencyARS(amount: number): string {
  // Implementation
}
```

## 🗄️ Convenciones de Base de Datos
- Tablas: `snake_case` plural (e.g., `sales_transactions`)
- Columnas: `snake_case` (e.g., `created_at`, `user_id`)
- IDs: UUID v7 (ordenables por tiempo)
- Timestamps: `created_at`, `updated_at` siempre incluidos
- Soft deletes: `deleted_at` nullable

## 🌐 Convenciones API
- Endpoints: `/api/v1/[resource]` (e.g., `/api/v1/products`)
- Métodos: RESTful (GET, POST, PUT, PATCH, DELETE)
- Responses: Siempre JSON con estructura:
```json
{
  "success": true,
  "data": {},
  "error": null,
  "meta": { "page": 1, "total": 100 }
}
```

## 🔐 Variables de Entorno
- Prefijo: `NEXT_PUBLIC_` para variables públicas
- Naming: `SCREAMING_SNAKE_CASE`
- Ejemplo: `DATABASE_URL`, `NEXT_PUBLIC_API_URL`

## 🧪 Testing
- Tests: `[feature].test.ts` o `[component].test.tsx`
- Mocks: `__mocks__/[module].ts`
- Coverage mínimo: 80% para lógica crítica

## 📝 Commits
Formato: `type(scope): message`
- `feat(pos)`: Nueva funcionalidad
- `fix(inventory)`: Corrección de bug
- `docs(readme)`: Documentación
- `refactor(api)`: Refactorización
- `test(pos)`: Tests
- `chore(deps)`: Tareas mantenimiento
