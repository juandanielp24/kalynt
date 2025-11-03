# Subagentes Especializados de Claude Code

## 🏗️ Agent: ARCHITECT
**Rol**: Diseño de arquitectura y decisiones técnicas
**Especialización**: 
- Diseño de esquemas de base de datos
- Arquitectura de microservicios
- Patterns y mejores prácticas
- Revisión de diseño técnico

**Trigger**: Usar cuando necesites decisiones arquitectónicas importantes

**Ejemplo de Prompt**:
```
@ARCHITECT Necesito diseñar el schema de PostgreSQL para el módulo de inventario. 
Debe soportar:
- Productos con variantes (talla, color)
- Multi-ubicación (múltiples tiendas)
- Tracking de movimientos de stock
- Histórico de precios
- Soft deletes

Usa NUMERIC para precios, UUID v7 para IDs, y considera índices para queries frecuentes.
```

---

## 🎨 Agent: FRONTEND_DEV
**Rol**: Desarrollo de interfaces con Next.js y React Native
**Especialización**:
- Componentes shadcn/ui
- Hooks de React
- Estado con Zustand/React Query
- Responsive design
- Accesibilidad

**Trigger**: Para crear componentes UI, páginas, layouts

**Ejemplo de Prompt**:
```
@FRONTEND_DEV Crea el componente ProductGrid para mostrar productos en el POS.
Requisitos:
- Grid responsive (1 col móvil, 3-4 desktop)
- Card con imagen, nombre, precio formateado ARS
- Estado hover/active
- Click abre modal de variantes
- Usar shadcn Card, Badge, Dialog
- TypeScript strict
- Incluir loading skeleton

Referencia: packages/ui/src/components/
```

---

## 📱 Agent: MOBILE_DEV
**Rol**: Desarrollo React Native específico
**Especialización**:
- Expo SDK
- React Navigation
- AsyncStorage para offline
- Permisos nativos (cámara, ubicación)
- Optimización de rendimiento móvil

**Trigger**: Para features mobile-specific

**Ejemplo de Prompt**:
```
@MOBILE_DEV Implementa el scanner de códigos de barras para el POS móvil.
Requisitos:
- Usar expo-barcode-scanner
- Soporte códigos EAN-13, UPC-A
- Feedback visual (frame, sonido)
- Manejo de permisos cámara
- Fallback input manual
- Vibración al escanear exitoso
- Integrar con búsqueda de productos

Ubicación: apps/mobile/src/features/pos/BarcodeScanner.tsx
```

---

## 🔧 Agent: BACKEND_DEV
**Rol**: APIs, lógica de negocio, integraciones
**Especialización**:
- NestJS controllers/services
- Prisma ORM
- Redis caching
- Validación con Zod
- Error handling
- Logging

**Trigger**: Para endpoints API, servicios, workers

**Ejemplo de Prompt**:
```
@BACKEND_DEV Crea el endpoint POST /api/v1/sales para procesar una venta.
Requisitos:
- Validar items, calcular totales con IVA
- Actualizar inventario en transacción
- Generar factura AFIP (llamar servicio externo)
- Procesar pago con Mercado Pago
- Guardar en DB con audit log
- Manejar errores (rollback si falla)
- Rate limiting (10 req/min por tenant)
- Respuesta incluye: sale_id, invoice_url, payment_status

Ubicación: apps/api/src/modules/sales/
Referencia: docs/api/sales-endpoint.md
```

---

## 🔐 Agent: AUTH_SPECIALIST
**Rol**: Autenticación, autorización, seguridad
**Especialización**:
- better-auth setup
- JWT tokens
- RBAC (roles)
- Multi-tenancy
- Session management

**Trigger**: Para todo lo relacionado con auth

**Ejemplo de Prompt**:
```
@AUTH_SPECIALIST Configura better-auth con soporte multi-tenant.
Requisitos:
- Estrategias: email/password, Google OAuth
- JWT debe incluir: user_id, tenant_id, role
- Roles: owner, admin, cashier, viewer
- Middleware para proteger rutas por rol
- Sesiones en Redis (TTL 7 días)
- Refresh tokens
- CORS configurado para mobile

Archivos:
- packages/shared/src/auth/config.ts
- apps/api/src/middleware/auth.middleware.ts
Referencia: https://better-auth.com/docs/multi-tenancy
```

---

## 💾 Agent: DATABASE_EXPERT
**Rol**: Schemas, migraciones, queries optimizados
**Especialización**:
- Prisma schema design
- Migraciones seguras
- Índices y performance
- Relaciones complejas
- Data integrity

**Trigger**: Para diseño de modelos, queries complejos

**Ejemplo de Prompt**:
```
@DATABASE_EXPERT Diseña el schema completo para el módulo de inventario.
Requisitos:
- Producto con variantes (jerarquía padre-hijo)
- Multi-ubicación con stock por ubicación
- Movimientos de stock (ventas, compras, ajustes, transferencias)
- Histórico de precios
- Categorías (árbol, niveles ilimitados)
- Soft deletes en todo
- NUMERIC(19,4) para precios/costos
- UUID v7 para IDs
- Índices para: SKU, búsqueda por nombre, queries por ubicación

Genera:
1. schema.prisma completo
2. Diagrama de relaciones
3. Migraciones iniciales
4. Seed data de ejemplo

Ubicación: packages/database/prisma/
```

---

## 🧪 Agent: TEST_ENGINEER
**Rol**: Tests unitarios, integración, E2E
**Especialización**:
- Vitest/Jest
- React Testing Library
- Playwright (E2E)
- Mocking
- Coverage

**Trigger**: Para crear tests comprehensivos

**Ejemplo de Prompt**:
```
@TEST_ENGINEER Crea tests para el servicio de cálculo de totales de venta.
Funcionalidad:
- calculateSaleTotal(items, discounts, taxRate)
- Debe calcular: subtotal, descuentos, IVA (21%), total

Test cases:
1. Venta simple sin descuentos (happy path)
2. Venta con descuento porcentual
3. Venta con descuento fijo
4. Venta con múltiples items
5. Edge case: items vacío (debe lanzar error)
6. Edge case: precio negativo (debe lanzar error)
7. Redondeo correcto (2 decimales)

Usar Vitest + mock de productos
Coverage esperado: 100%

Ubicación: packages/shared/src/sales/__tests__/calculate-total.test.ts
```

---

## 🌍 Agent: LOCALIZATION_EXPERT
**Rol**: i18n, adaptadores por país, cumplimiento local
**Especialización**:
- Adaptadores país (AR, CL, CO)
- Formato de monedas/fechas
- Reglas fiscales
- APIs locales (AFIP, SII)

**Trigger**: Para features específicos de Argentina o multi-país

**Ejemplo de Prompt**:
```
@LOCALIZATION_EXPERT Implementa el adaptador AFIP para facturación electrónica argentina.
Requisitos:
- Integración AFIP wsfev1 (Factura Electrónica v1)
- Tipos de factura: A, B, C
- Autenticación con certificado digital (wsaa)
- Generar CAE (Código Autorización Electrónico)
- Cumplimiento RG 5614/2024 (IVA discriminado en tipo B)
- Guardar XML request/response para auditoría
- Retry lógica (3 intentos con backoff)
- Cache de tokens (validez 12hs)
- Error handling específico AFIP

Estructura:
apps/ar/src/afip/
  ├── afip.service.ts
  ├── afip.types.ts
  ├── wsaa.client.ts (autenticación)
  ├── wsfev1.client.ts (facturación)
  └── __tests__/

Referencias:
- docs/argentina/AFIP-integration.md
- AFIP SDK oficial (si existe)
```

---

## 📚 Agent: DOCUMENTATION_WRITER
**Rol**: Documentación técnica, API docs, guías
**Especialización**:
- README.md comprehensivos
- OpenAPI/Swagger specs
- Guías de desarrollo
- Diagramas (Mermaid)

**Trigger**: Para documentar features, APIs, arquitectura

**Ejemplo de Prompt**:
```
@DOCUMENTATION_WRITER Documenta el módulo de POS completo.
Incluir:
1. Overview del módulo (qué hace, por qué existe)
2. Arquitectura (diagrama de componentes)
3. Flujo de trabajo (diagrama Mermaid)
4. API endpoints con ejemplos de request/response
5. Modelos de datos (Prisma schemas)
6. Guía de uso para desarrolladores
7. Casos de uso comunes con código
8. Troubleshooting común
9. Testing strategy

Formato: Markdown con código syntax-highlighted
Ubicación: docs/modules/pos.md
```

---

## 🔍 Agent: CODE_REVIEWER
**Rol**: Revisión de código, best practices, security
**Especialización**:
- Code smells
- Security vulnerabilities
- Performance issues
- Consistency con convenciones

**Trigger**: Para revisar código existente antes de commit

**Ejemplo de Prompt**:
```
@CODE_REVIEWER Revisa el siguiente código del servicio de pagos Mercado Pago.
Checklist:
- ✅ Manejo correcto de errores
- ✅ No expone secretos/API keys
- ✅ Validación de inputs
- ✅ Logging apropiado
- ✅ Type safety
- ✅ Tests adecuados
- ✅ Performance (no queries N+1)
- ✅ Consistente con convenciones del proyecto

Reportar:
1. Issues críticos (security, bugs)
2. Sugerencias de mejora
3. Cambios requeridos antes de merge

Código a revisar:
[PEGAR CÓDIGO]
```

