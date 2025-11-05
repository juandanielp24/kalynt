# Guía de Usuario - Sistema de Proveedores y Órdenes de Compra

## Índice

1. [Introducción](#introducción)
2. [Acceso al Sistema](#acceso-al-sistema)
3. [Gestión de Proveedores](#gestión-de-proveedores)
4. [Gestión de Órdenes de Compra](#gestión-de-órdenes-de-compra)
5. [Recepción de Mercadería](#recepción-de-mercadería)
6. [Gestión de Pagos](#gestión-de-pagos)
7. [Sugerencias de Reorden](#sugerencias-de-reorden)
8. [Uso en Dispositivos Móviles](#uso-en-dispositivos-móviles)
9. [Preguntas Frecuentes](#preguntas-frecuentes)
10. [Consejos y Mejores Prácticas](#consejos-y-mejores-prácticas)

---

## Introducción

### ¿Qué es el Sistema de Proveedores y Órdenes de Compra?

Este sistema le permite gestionar todo el proceso de compras de su negocio, desde el registro de proveedores hasta el pago de órdenes de compra. Las funcionalidades principales incluyen:

- **Gestionar proveedores**: Mantener un registro completo de sus proveedores con toda la información de contacto y términos comerciales
- **Crear órdenes de compra**: Generar órdenes de compra profesionales y hacer seguimiento de su estado
- **Recibir mercadería**: Registrar la recepción de productos y actualizar automáticamente el inventario
- **Controlar pagos**: Llevar un registro detallado de todos los pagos realizados a proveedores
- **Reordenar inteligentemente**: Recibir sugerencias automáticas cuando productos necesiten ser reabastecidos

### ¿Quién puede usar este sistema?

El acceso a las funcionalidades depende de su rol:

| Funcionalidad | Admin | Gerente | Comprador | Almacenero | Vendedor |
|--------------|-------|---------|-----------|------------|----------|
| Ver proveedores | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear/editar proveedores | ✅ | ✅ | ✅ | ❌ | ❌ |
| Ver órdenes de compra | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear órdenes | ✅ | ✅ | ✅ | ❌ | ❌ |
| Recibir mercadería | ✅ | ✅ | ✅ | ✅ | ❌ |
| Gestionar pagos | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## Acceso al Sistema

### Aplicación Web

1. Abra su navegador web (Chrome, Firefox, Safari o Edge recomendados)
2. Ingrese a la URL de su empresa: `https://[su-empresa].kalynt.com`
3. Ingrese su usuario y contraseña
4. Haga clic en "Iniciar Sesión"

**Menú de Navegación:**

Una vez dentro, encontrará las opciones de compras en el menú lateral izquierdo, bajo la sección "Compras":

- **Proveedores**: Gestión de proveedores
- **Órdenes de Compra**: Listado de todas las órdenes
- **Sugerencias**: Productos que necesitan ser reordenados

### Aplicación Móvil

1. Descargue la aplicación "Kalynt" desde la App Store (iOS) o Google Play (Android)
2. Ingrese su usuario y contraseña
3. Toque en "Más" en la barra inferior
4. Encontrará las opciones de compras en la sección "Compras"

**Nota importante sobre el modo offline:**
La aplicación móvil puede funcionar sin conexión a internet. Los cambios realizados offline se sincronizarán automáticamente cuando recupere la conexión.

---

## Gestión de Proveedores

### Ver Lista de Proveedores

**En la Web:**
1. Haga clic en "Proveedores" en el menú lateral
2. Verá una lista con todos sus proveedores activos

**En el Móvil:**
1. Toque "Más" → "Proveedores"
2. Verá tarjetas con cada proveedor

**Información que se muestra:**
- Nombre del proveedor
- Código único
- Información de contacto (email, teléfono)
- Cantidad de productos que suministra
- Cantidad de órdenes de compra realizadas
- Términos de pago

### Buscar un Proveedor

**En la Web:**
1. En la página de proveedores, use el campo de búsqueda en la parte superior
2. Escriba el nombre o código del proveedor
3. Los resultados se filtrarán automáticamente mientras escribe

**En el Móvil:**
1. En la lista de proveedores, toque el ícono de búsqueda
2. Escriba el nombre o código
3. Los resultados aparecerán inmediatamente

### Crear un Nuevo Proveedor

**Paso a Paso:**

1. **Abrir formulario de creación**
   - Web: Haga clic en "Nuevo Proveedor"
   - Móvil: Toque el botón "+" en la esquina inferior derecha

2. **Completar información general** (Pestaña "General")
   - **Nombre**: Nombre completo del proveedor (requerido)
   - **Código**: Código único para identificarlo (requerido)
     - *Ejemplo: SUP-001, PROV-ABC*
   - **CUIT/Tax ID**: Número de identificación fiscal
     - *Ejemplo: 20-12345678-9*

3. **Agregar datos de contacto** (Pestaña "Contacto")
   - **Email**: Correo electrónico principal
   - **Teléfono**: Número de teléfono
   - **Sitio web**: URL del sitio web (si tiene)
   - **Dirección**: Dirección completa
   - **Ciudad**: Ciudad
   - **Provincia/Estado**: Provincia o estado
   - **Código Postal**: Código postal
   - **País**: País (por defecto: Argentina)
   - **Persona de contacto**: Nombre de la persona de contacto
   - **Teléfono de contacto**: Teléfono directo de la persona
   - **Email de contacto**: Email directo de la persona

4. **Configurar términos de pago** (Pestaña "Pago")
   - **Términos de pago**: Plazo de pago acordado
     - *Ejemplos: "30 days", "60 days", "Contado"*
   - **Moneda**: Moneda en la que se realizan las transacciones
     - *Opciones: ARS, USD, EUR*
   - **Banco**: Nombre del banco del proveedor
   - **Cuenta bancaria**: Número de cuenta
   - **Notas**: Información adicional relevante

5. **Guardar**
   - Haga clic/toque en "Crear Proveedor"
   - Verá un mensaje de confirmación
   - El proveedor aparecerá en la lista

**Ejemplo completo:**

```
General:
  Nombre: Electrónica del Sur SA
  Código: ELEC-001
  Tax ID: 20-34567890-1

Contacto:
  Email: ventas@electronicadelsur.com
  Teléfono: +54 11 4567-8901
  Sitio web: https://electronicadelsur.com
  Dirección: Av. Rivadavia 5678
  Ciudad: Buenos Aires
  Estado: CABA
  Código Postal: 1424
  País: Argentina
  Contacto: María Rodríguez
  Tel. Contacto: +54 11 4567-8902
  Email Contacto: maria@electronicadelsur.com

Pago:
  Términos de pago: 30 days
  Moneda: ARS
  Banco: Banco Santander
  Cuenta: 0123456789
  Notas: Proveedor confiable, entregas puntuales
```

### Editar un Proveedor

1. **Localizar el proveedor**
   - Búsquelo en la lista o use la función de búsqueda

2. **Abrir edición**
   - Web: Haga clic en el botón "Editar" junto al proveedor
   - Móvil: Toque el proveedor y luego "Editar"

3. **Modificar la información**
   - Cambie los campos que necesite actualizar
   - Todas las pestañas están disponibles

4. **Guardar cambios**
   - Haga clic/toque en "Guardar Cambios"
   - Verá un mensaje de confirmación

### Desactivar un Proveedor

Si ya no trabaja con un proveedor pero quiere mantener el historial:

1. Abra el proveedor en modo edición
2. Desmarque la opción "Proveedor activo"
3. Guarde los cambios

**Nota:** Los proveedores inactivos no aparecen en las listas por defecto, pero sus órdenes históricas permanecen visibles.

### Vincular Productos a un Proveedor

Después de crear un proveedor, puede vincularle productos para facilitar la creación de órdenes:

1. **Abrir detalle del proveedor**
   - Haga clic/toque en el nombre del proveedor

2. **Agregar producto**
   - Haga clic/toque en "Agregar Producto"

3. **Completar información**
   - **Producto**: Seleccione el producto de su catálogo
   - **Costo**: Precio de costo que cobra el proveedor
   - **SKU del proveedor**: Código que usa el proveedor (opcional)
   - **Cantidad mínima de orden**: Cantidad mínima que debe pedir (opcional)
   - **Días de entrega**: Tiempo de entrega en días (opcional)
   - **Proveedor preferido**: Marque si este es el proveedor preferido para este producto

4. **Guardar**
   - El producto quedará vinculado al proveedor

**Ejemplo:**

```
Producto: Cable HDMI 2.0 - 2 metros
Costo: $450
SKU del proveedor: HDMI-2M-BK
Cantidad mínima: 10 unidades
Días de entrega: 7 días
Proveedor preferido: ✓ Sí
```

**Ventajas de vincular productos:**
- Autocompletar precios al crear órdenes
- Recibir sugerencias de reorden automáticas
- Comparar precios entre proveedores

---

## Gestión de Órdenes de Compra

### Ver Lista de Órdenes

**En la Web:**
1. Haga clic en "Compras" → "Órdenes de Compra" en el menú
2. Verá una lista con todas las órdenes

**En el Móvil:**
1. Toque "Más" → "Órdenes de Compra"
2. Verá tarjetas con cada orden

**Información que se muestra:**
- Número de orden (PO-00001)
- Proveedor
- Estado de la orden (Borrador, Enviada, Confirmada, etc.)
- Estado de pago (Pendiente, Parcial, Pagado)
- Monto total
- Monto pendiente de pago
- Fecha de la orden

### Filtrar Órdenes

Puede filtrar las órdenes por diferentes criterios:

**Por Estado:**
- Borrador: Órdenes en preparación
- Enviada: Enviadas al proveedor
- Confirmada: Confirmadas por el proveedor
- Parcial: Recepción parcial de mercadería
- Recibida: Mercadería completamente recibida
- Cancelada: Órdenes canceladas

**Por Estado de Pago:**
- Pendiente: Sin pagos realizados
- Parcial: Pagos parciales
- Pagado: Completamente pagado

**Por Proveedor:**
- Seleccione un proveedor del filtro

**Por Fecha:**
- Ingrese un rango de fechas

### Crear una Orden de Compra

**Paso a Paso Detallado:**

#### 1. Iniciar Nueva Orden

- Web: Haga clic en "Nueva Orden de Compra"
- Móvil: Toque el botón "+" en la esquina inferior derecha

#### 2. Seleccionar Proveedor

1. Haga clic/toque en "Seleccionar proveedor"
2. Busque el proveedor en la lista
3. Haga clic/toque en el proveedor deseado
4. El sistema cargará los productos vinculados a ese proveedor

**Consejo:** Si el proveedor tiene productos vinculados, será más fácil agregarlos a la orden.

#### 3. Agregar Productos

1. Haga clic/toque en "Agregar Producto"
2. **Buscar producto:**
   - Use el campo de búsqueda
   - Escriba el nombre, SKU o código de barras
   - Los resultados se filtrarán automáticamente
3. **Seleccionar producto:**
   - Haga clic/toque en el producto deseado
4. **Configurar cantidades y precios:**
   - **Cantidad ordenada**: Número de unidades a pedir
   - **Costo unitario**: Precio por unidad (se autocompleta si está vinculado)
   - **Impuesto**: Porcentaje de impuesto (por defecto 21%)
   - **Descuento**: Descuento aplicado si corresponde
5. **Repetir** para agregar más productos

**Ejemplo de producto agregado:**

```
Producto: Cable HDMI 2.0 - 2 metros
Cantidad: 50 unidades
Costo unitario: $450
Impuesto: 21%
Descuento: $0

Cálculo:
  Subtotal: 50 × $450 = $22,500
  Impuesto: $22,500 × 21% = $4,725
  Total item: $27,225
```

#### 4. Configurar Detalles Adicionales

**Ubicación de destino (opcional):**
- Seleccione a qué ubicación (tienda o almacén) llegará la mercadería
- Esto facilitará la recepción posterior

**Fecha esperada de entrega:**
- Ingrese la fecha en que espera recibir la mercadería
- Se usa para planificación y alertas

**Costo de envío:**
- Si el proveedor cobra envío, ingréselo aquí
- Se sumará al total de la orden

**Descuento general:**
- Si tiene un descuento sobre el total, ingréselo aquí
- Se restará del total

**Notas:**
- Información que quiera compartir con el proveedor
- Ejemplo: "Necesito entrega antes del 25"

**Notas internas:**
- Información privada, no visible para el proveedor
- Ejemplo: "Coordinar con María del almacén"

#### 5. Revisar Totales

El sistema calcula automáticamente:

```
Subtotal:         $22,500.00
Impuestos (21%):  $ 4,725.00
Descuento:        $     0.00
Envío:            $   500.00
─────────────────────────────
TOTAL:            $27,725.00
```

#### 6. Crear la Orden

1. Revise toda la información
2. Haga clic/toque en "Crear Orden"
3. La orden se creará en estado **BORRADOR**
4. Será redirigido a la página de detalle de la orden
5. Verá el número de orden asignado (ejemplo: PO-00015)

### Estados de una Orden de Compra

Una orden pasa por diferentes estados durante su ciclo de vida:

#### 📝 BORRADOR (DRAFT)
- **Qué significa:** La orden está en preparación
- **Qué puede hacer:**
  - Editar cualquier campo
  - Agregar o quitar productos
  - Eliminar la orden
  - Enviar al proveedor
- **Qué NO puede hacer:**
  - Recibir mercadería
  - Registrar pagos

#### 📤 ENVIADA (SENT)
- **Qué significa:** La orden fue enviada al proveedor
- **Qué puede hacer:**
  - Confirmar la orden
  - Cancelar la orden
  - Ver y editar notas
- **Qué NO puede hacer:**
  - Modificar productos o cantidades
  - Recibir mercadería (aún)

#### ✅ CONFIRMADA (CONFIRMED)
- **Qué significa:** El proveedor confirmó que procesará la orden
- **Qué puede hacer:**
  - Recibir mercadería (total o parcial)
  - Cancelar la orden (con justificación)
- **Qué NO puede hacer:**
  - Modificar productos o cantidades

#### 📦 PARCIAL (PARTIAL)
- **Qué significa:** Se recibió parte de la mercadería, falta el resto
- **Qué puede hacer:**
  - Continuar recibiendo el resto de la mercadería
  - Ver qué productos y cantidades faltan
- **Qué NO puede hacer:**
  - Modificar la orden original

#### ✅ RECIBIDA (RECEIVED)
- **Qué significa:** Toda la mercadería fue recibida
- **Qué puede hacer:**
  - Registrar pagos
  - Ver historial completo
  - Imprimir orden (próximamente)
- **Qué NO puede hacer:**
  - Modificar la orden
  - Recibir más mercadería

#### ❌ CANCELADA (CANCELLED)
- **Qué significa:** La orden fue cancelada
- **Qué puede hacer:**
  - Ver información histórica
  - Ver motivo de cancelación
- **Qué NO puede hacer:**
  - Reactivar la orden (debe crear una nueva)

### Transiciones de Estado

```
BORRADOR ──[Enviar al Proveedor]──> ENVIADA
    │
    └──[Eliminar]──> (eliminada)

ENVIADA ──[Confirmar]──> CONFIRMADA
    │
    └──[Cancelar]──> CANCELADA

CONFIRMADA ──[Recibir Parcial]──> PARCIAL
    │
    └──[Recibir Total]──> RECIBIDA

PARCIAL ──[Recibir Restante]──> RECIBIDA

Cualquier estado ──[Cancelar]──> CANCELADA
```

### Acciones Disponibles por Estado

| Acción | BORRADOR | ENVIADA | CONFIRMADA | PARCIAL | RECIBIDA | CANCELADA |
|--------|----------|---------|------------|---------|----------|-----------|
| Editar items | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Editar notas | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Enviar | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Confirmar | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Recibir | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Pagar | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Cancelar | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Eliminar | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Recepción de Mercadería

### Cuándo Recibir Mercadería

Debe registrar la recepción cuando:
- La mercadería llegó físicamente a su ubicación
- La orden está en estado **CONFIRMADA** o **PARCIAL**
- Verificó que los productos recibidos coinciden con la orden

### Proceso de Recepción

#### 1. Abrir Orden

1. Vaya a "Órdenes de Compra"
2. Busque la orden que desea recibir (estado CONFIRMADA o PARCIAL)
3. Haga clic/toque en la orden para abrir el detalle

#### 2. Iniciar Recepción

1. Haga clic/toque en el botón "Recibir Mercadería"
2. Se abrirá un diálogo con la lista de productos

#### 3. Verificar y Registrar Cantidades

Para cada producto, verá:
- Nombre del producto
- Cantidad ordenada
- Cantidad ya recibida (si hubo recepciones previas)
- Cantidad pendiente
- Campo para ingresar la cantidad que está recibiendo ahora

**Ejemplo de pantalla de recepción:**

```
Producto: Cable HDMI 2.0 - 2 metros
Ordenado: 50 unidades
Ya recibido: 0 unidades
Pendiente: 50 unidades
Recibiendo ahora: [____] unidades
```

**Complete el campo "Recibiendo ahora":**
- Si recibió toda la cantidad pendiente, ingrese el número completo
- Si solo recibió parte, ingrese la cantidad parcial
- El sistema no le permitirá ingresar más de lo pendiente

#### 4. Agregar Fecha de Recepción (opcional)

- Por defecto se usa la fecha actual
- Puede modificarla si recibió la mercadería en otro día

#### 5. Confirmar Recepción

1. Revise que las cantidades sean correctas
2. Haga clic/toque en "Confirmar Recepción"
3. El sistema:
   - Actualizará las cantidades recibidas
   - Actualizará el stock de los productos
   - Cambiará el estado de la orden (PARCIAL o RECIBIDA)
   - Mostrará un mensaje de confirmación

### Recepción Completa vs Parcial

#### Recepción Completa

Si recibe TODA la mercadería ordenada:

```
ANTES:
  Producto A: Ordenado 50, Recibido 0, Pendiente 50
  Producto B: Ordenado 30, Recibido 0, Pendiente 30

REGISTRA:
  Producto A: Recibiendo 50
  Producto B: Recibiendo 30

DESPUÉS:
  Producto A: Ordenado 50, Recibido 50, Pendiente 0
  Producto B: Ordenado 30, Recibido 30, Pendiente 0

ESTADO: RECIBIDA ✅
```

#### Recepción Parcial

Si solo recibe PARTE de la mercadería:

```
ANTES:
  Producto A: Ordenado 50, Recibido 0, Pendiente 50
  Producto B: Ordenado 30, Recibido 0, Pendiente 30

REGISTRA (Primera recepción):
  Producto A: Recibiendo 30
  Producto B: Recibiendo 20

DESPUÉS:
  Producto A: Ordenado 50, Recibido 30, Pendiente 20
  Producto B: Ordenado 30, Recibido 20, Pendiente 10

ESTADO: PARCIAL ⚠️

REGISTRA (Segunda recepción):
  Producto A: Recibiendo 20
  Producto B: Recibiendo 10

FINAL:
  Producto A: Ordenado 50, Recibido 50, Pendiente 0
  Producto B: Ordenado 30, Recibido 30, Pendiente 0

ESTADO: RECIBIDA ✅
```

### Actualización Automática de Stock

Cuando confirma una recepción, el sistema automáticamente:

1. **Suma las cantidades al stock:**
   ```
   Stock anterior: 10 unidades
   Cantidad recibida: 50 unidades
   Stock nuevo: 60 unidades
   ```

2. **Registra la ubicación:**
   - Si especificó una ubicación en la orden, el stock se actualiza en esa ubicación
   - Si no, se actualiza el stock general

3. **Actualiza el costo:**
   - El sistema puede actualizar el costo del producto según el precio de compra
   - Esto depende de la configuración de su empresa

### Ver Historial de Recepciones

Para ver todas las recepciones de una orden:

1. Abra el detalle de la orden
2. Desplácese a la sección "Historial de Recepciones"
3. Verá una lista con:
   - Fecha de cada recepción
   - Usuario que registró la recepción
   - Cantidades recibidas por producto
   - Notas (si las hay)

---

## Gestión de Pagos

### Cuándo Registrar un Pago

Debe registrar un pago cuando:
- Realizó un pago al proveedor
- La orden está en estado **RECIBIDA** o **PARCIAL**
- Tiene el comprobante o referencia del pago

### Registrar un Pago

#### 1. Abrir Orden

1. Vaya a "Órdenes de Compra"
2. Busque la orden que desea pagar
3. Haga clic/toque en la orden para abrir el detalle

#### 2. Iniciar Registro de Pago

1. Haga clic/toque en el botón "Registrar Pago"
2. Se abrirá un formulario de pago

#### 3. Completar Información del Pago

**Monto:**
- Ingrese el monto que está pagando
- Puede ser el total o un pago parcial
- El sistema mostrará el saldo pendiente
- **Validación:** No puede pagar más del saldo pendiente

**Ejemplo:**
```
Total de la orden: $27,725.00
Pagos previos: $10,000.00
Saldo pendiente: $17,725.00
Monto a pagar: [____]  (máximo $17,725.00)
```

**Método de Pago:**
Seleccione el método utilizado:
- Efectivo
- Transferencia Bancaria
- Cheque
- Tarjeta de Crédito
- Tarjeta de Débito

**Fecha de Pago:**
- Por defecto: fecha actual
- Puede modificarla si el pago fue en otro día

**Referencia (opcional pero recomendado):**
- Número de transferencia
- Número de cheque
- Número de comprobante
- **Ejemplo:** "TRANS-987654", "CHQ-00123"

**Notas (opcional):**
- Información adicional sobre el pago
- **Ejemplo:** "Primera cuota de 3", "Pago adelantado con descuento"

#### 4. Confirmar Pago

1. Revise toda la información
2. Haga clic/toque en "Registrar Pago"
3. El sistema:
   - Creará el registro de pago
   - Actualizará el monto pagado de la orden
   - Actualizará el estado de pago
   - Mostrará un mensaje de confirmación

### Estados de Pago

La orden puede tener tres estados de pago:

#### 🔴 PENDIENTE (PENDING)
```
Total: $27,725.00
Pagado: $0.00
Pendiente: $27,725.00
```

#### 🟡 PARCIAL (PARTIAL)
```
Total: $27,725.00
Pagado: $15,000.00
Pendiente: $12,725.00
```

#### 🟢 PAGADO (PAID)
```
Total: $27,725.00
Pagado: $27,725.00
Pendiente: $0.00
```

### Pagos Parciales

Puede realizar múltiples pagos parciales hasta completar el total:

**Ejemplo de Pagos Parciales:**

```
ORDEN: PO-00015
Total: $27,725.00

Pago 1:
  Fecha: 15/01/2025
  Monto: $10,000.00
  Método: Efectivo
  Referencia: -
  Estado después: PARCIAL ($17,725 pendiente)

Pago 2:
  Fecha: 30/01/2025
  Monto: $10,000.00
  Método: Transferencia
  Referencia: TRANS-555123
  Estado después: PARCIAL ($7,725 pendiente)

Pago 3:
  Fecha: 15/02/2025
  Monto: $7,725.00
  Método: Cheque
  Referencia: CHQ-00789
  Estado después: PAGADO ($0 pendiente) ✅
```

### Ver Historial de Pagos

Para ver todos los pagos de una orden:

1. Abra el detalle de la orden
2. Desplácese a la sección "Historial de Pagos"
3. Verá una tabla con:
   - Número de pago (PAY-00001)
   - Fecha
   - Monto
   - Método de pago
   - Referencia
   - Usuario que registró el pago
   - Opciones para eliminar (si tiene permisos)

### Eliminar un Pago

Si registró un pago por error:

1. Vaya al historial de pagos de la orden
2. Haga clic/toque en "Eliminar" junto al pago
3. Confirme la eliminación
4. El sistema:
   - Eliminará el registro de pago
   - Recalculará el monto pagado
   - Actualizará el estado de pago
   - Mostrará confirmación

**Nota:** Solo usuarios con permiso `PAYMENTS:DELETE` pueden eliminar pagos.

---

## Sugerencias de Reorden

### ¿Qué son las Sugerencias de Reorden?

El sistema analiza automáticamente su inventario y detecta productos que necesitan ser reabastecidos. Genera sugerencias inteligentes basadas en:

- Stock actual vs stock mínimo configurado
- Proveedor preferido para cada producto
- Tiempo de entrega del proveedor
- Cantidades óptimas de orden

### Ver Sugerencias

1. Vaya a "Compras" → "Sugerencias" (o "Sugerencias de Reorden")
2. Verá una lista de productos que necesitan ser reordenados

### Información de Cada Sugerencia

Para cada producto, verá:

```
┌─────────────────────────────────────────────────┐
│ Cable HDMI 2.0 - 2 metros                      │
│ SKU: HDMI-2M                                   │
│                                                 │
│ Stock actual: 5 unidades ⚠️                    │
│ Stock mínimo: 20 unidades                      │
│ Stock máximo: 100 unidades                     │
│                                                 │
│ Cantidad sugerida: 95 unidades                 │
│                                                 │
│ Proveedor: Electrónica del Sur SA              │
│ Costo unitario: $450                           │
│ Tiempo de entrega: 7 días                      │
│ Fecha estimada: 25/01/2025                     │
│                                                 │
│ Total estimado: $42,750                        │
│                                                 │
│ [ Seleccionar ]                                │
└─────────────────────────────────────────────────┘
```

### Prioridad de Sugerencias

Las sugerencias tienen diferentes niveles de prioridad:

#### 🔴 ALTA (HIGH)
```
Stock actual ≤ Stock mínimo ÷ 2

Ejemplo:
  Mínimo: 20
  Actual: 8 (≤ 10)
  → Prioridad ALTA
```

#### 🟡 MEDIA (MEDIUM)
```
Stock actual ≤ Stock mínimo

Ejemplo:
  Mínimo: 20
  Actual: 15 (≤ 20)
  → Prioridad MEDIA
```

#### 🟢 BAJA (LOW)
```
Stock actual ≤ Stock mínimo × 1.2

Ejemplo:
  Mínimo: 20
  Actual: 22 (≤ 24)
  → Prioridad BAJA
```

### Filtrar Sugerencias

Puede filtrar las sugerencias por:

**Por Ubicación:**
- Seleccione una ubicación específica
- Solo mostrará productos con stock bajo en esa ubicación

**Por Proveedor:**
- Seleccione un proveedor
- Solo mostrará productos de ese proveedor

**Por Categoría:**
- Seleccione una categoría de producto
- Solo mostrará productos de esa categoría

### Crear Orden desde Sugerencias

**Método 1: Crear orden para un solo producto**

1. En la tarjeta del producto, haga clic/toque en "Crear Orden"
2. El sistema creará una orden automáticamente con:
   - El proveedor preferido
   - La cantidad sugerida
   - El costo unitario vinculado
3. Será redirigido a la orden para revisarla
4. Puede editarla antes de enviarla

**Método 2: Crear orden para múltiples productos**

1. Marque la casilla "Seleccionar" en cada producto que desee ordenar
2. Haga clic/toque en "Crear Orden de Compra" (botón en la parte superior/inferior)
3. El sistema:
   - Agrupará productos por proveedor
   - Creará una orden por cada proveedor
   - Pre-llenará cantidades y precios
4. Revisará cada orden antes de confirmar

**Ejemplo de orden múltiple:**

```
Seleccionados:
  ✓ Cable HDMI (Proveedor: Electrónica del Sur)
  ✓ Cable USB-C (Proveedor: Electrónica del Sur)
  ✓ Mouse inalámbrico (Proveedor: TechSupply)

Resultado:
  → Orden 1: Electrónica del Sur
    - Cable HDMI: 95 unidades
    - Cable USB-C: 120 unidades
    Total: $72,150

  → Orden 2: TechSupply
    - Mouse inalámbrico: 50 unidades
    Total: $12,500
```

### Configurar Stock Mínimo y Máximo

Para que las sugerencias funcionen correctamente, debe configurar el stock mínimo y máximo de cada producto:

1. Vaya a "Inventario" → "Productos"
2. Edite el producto
3. Configure:
   - **Stock mínimo**: Nivel de stock que no desea superar
   - **Stock máximo**: Stock ideal para tener
4. Guarde los cambios

**Ejemplo de configuración:**

```
Producto: Cable HDMI 2.0
Venta promedio: 15 unidades/mes
Tiempo de reorden: 7 días

Stock mínimo: 20 unidades
  → Suficiente para 1.5 meses de buffer

Stock máximo: 100 unidades
  → 6-7 meses de stock, evita obsolescencia
```

### Productos sin Proveedor Preferido

Si un producto necesita reorden pero no tiene proveedor preferido:

1. Aparecerá en la lista con una advertencia ⚠️
2. El botón "Crear Orden" estará deshabilitado
3. Acciones que puede tomar:
   - Vincular el producto a un proveedor
   - Marcar un proveedor como preferido
   - Crear orden manualmente seleccionando proveedor

---

## Uso en Dispositivos Móviles

### Ventajas de la Aplicación Móvil

- ✅ Funciona sin conexión a internet (modo offline)
- ✅ Reciba mercadería desde el almacén con su tablet
- ✅ Consulte proveedores y órdenes desde cualquier lugar
- ✅ Registre pagos inmediatamente después de realizarlos
- ✅ Sincronización automática cuando recupere conexión

### Modo Offline

La aplicación móvil puede funcionar completamente sin conexión:

#### Qué funciona offline:

**Ver información:**
- ✅ Lista de proveedores (con datos del última sincronización)
- ✅ Lista de órdenes de compra
- ✅ Detalles de órdenes
- ✅ Historial de pagos

**Crear y modificar:**
- ✅ Crear nuevas órdenes de compra
- ✅ Recibir mercadería
- ✅ Registrar pagos
- ✅ Actualizar información de proveedores

#### Cómo funciona:

1. **Caché local:**
   - La app descarga y guarda datos cuando tiene conexión
   - Estos datos están disponibles offline

2. **Cola de sincronización:**
   - Las acciones realizadas offline se guardan en una "cola"
   - Cuando recupera conexión, se envían automáticamente al servidor
   - Orden de procesamiento: primero lo más antiguo

3. **Indicador visual:**
   - Verá un ícono 📶 que indica si está online u offline
   - En offline, verá "Modo sin conexión" en la barra superior
   - Verá la cantidad de acciones pendientes de sincronización

#### Ejemplo de flujo offline:

```
1. Está en el almacén sin WiFi
2. Llega mercadería del proveedor
3. Abre la app → ve "Modo sin conexión" ⚠️
4. Abre la orden de compra
5. Registra la recepción de mercadería
6. La app guarda la acción en la cola
7. Muestra "1 acción pendiente de sincronización"
8. Sale del almacén y se conecta al WiFi
9. La app automáticamente:
   - Detecta la conexión
   - Procesa la cola
   - Envía la recepción al servidor
   - Actualiza el stock
   - Muestra "Sincronizado ✓"
```

### Sincronización Manual

Si desea forzar una sincronización:

1. Vaya a "Más"
2. Toque "Configuración"
3. Toque "Sincronizar ahora"
4. Espere a que complete (verá un indicador de progreso)

### Ver Estado de Sincronización

Para ver qué acciones están pendientes:

1. Vaya a "Más"
2. Toque "Estado de sincronización"
3. Verá una lista con:
   - Tipo de acción (crear orden, recibir mercadería, etc.)
   - Fecha/hora
   - Estado (pendiente, sincronizando, completado, error)
   - Número de reintentos (máx. 3)

**Ejemplo:**

```
┌────────────────────────────────────────┐
│ COLA DE SINCRONIZACIÓN                │
│                                        │
│ 1. Recibir Orden PO-00015             │
│    15/01/2025 10:30                   │
│    Estado: Pendiente                  │
│    Reintentos: 0/3                    │
│                                        │
│ 2. Registrar Pago PAY-00045           │
│    15/01/2025 11:15                   │
│    Estado: Sincronizando...           │
│    Reintentos: 1/3                    │
│                                        │
│ Total pendiente: 2 acciones           │
└────────────────────────────────────────┘
```

### Resolución de Conflictos

Si una acción offline genera un conflicto (ej: el producto ya fue recibido desde otro dispositivo):

1. La app mostrará una alerta
2. Explicará el conflicto
3. Ofrecerá opciones:
   - Descartar cambio local
   - Mantener ambos (si aplica)
   - Revisar manualmente

### Limpiar Caché

Si experimenta problemas con datos desactualizados:

1. Vaya a "Más" → "Configuración"
2. Toque "Limpiar caché"
3. Confirme la acción
4. La app descargará datos frescos en la próxima sincronización

**Nota:** Esto NO elimina acciones pendientes de sincronización.

---

## Preguntas Frecuentes

### Proveedores

**P: ¿Puedo tener dos proveedores con el mismo código?**
R: No, el código debe ser único. El sistema no permitirá guardar un código duplicado.

**P: ¿Qué pasa si elimino un proveedor que tiene órdenes?**
R: No puede eliminar proveedores con órdenes activas. Puede desactivarlo para que no aparezca en las listas, pero las órdenes históricas permanecerán visibles.

**P: ¿Puedo cambiar el código de un proveedor después de crearlo?**
R: Sí, puede editarlo siempre que el nuevo código no esté en uso.

### Órdenes de Compra

**P: ¿Puedo modificar una orden después de enviarla?**
R: No puede modificar productos o cantidades después de enviarla. Solo puede editar notas y campos administrativos.

**P: ¿Qué hago si me equivoqué al crear una orden?**
R: Si la orden está en estado BORRADOR, puede eliminarla completamente. Si ya la envió, puede cancelarla y crear una nueva.

**P: ¿Puedo recibir mercadería sin pasar por el estado CONFIRMADA?**
R: No, debe confirmar la orden primero. El flujo es: DRAFT → SENT → CONFIRMED → RECIBIDA.

**P: ¿Los números de orden son secuenciales?**
R: Sí, el sistema genera números automáticos consecutivos (PO-00001, PO-00002, etc.). No puede personalizar el número.

**P: ¿Puedo tener múltiples órdenes abiertas con el mismo proveedor?**
R: Sí, puede tener tantas órdenes como necesite con el mismo proveedor.

### Recepción de Mercadería

**P: ¿Qué pasa si recibo más cantidad de la ordenada?**
R: El sistema no permitirá registrar más de lo ordenado. Debe ajustar la orden primero o crear una nota de crédito.

**P: ¿Puedo recibir productos de diferentes órdenes al mismo tiempo?**
R: Debe procesar cada orden por separado. No puede combinar recepciones de múltiples órdenes.

**P: ¿Qué hago si recibo productos dañados?**
R: Registre solo la cantidad en buen estado. Coordine con el proveedor para nota de crédito o reposición.

**P: ¿El stock se actualiza inmediatamente?**
R: Sí, en cuanto confirma la recepción, el stock se actualiza en tiempo real.

### Pagos

**P: ¿Puedo registrar un pago antes de recibir la mercadería?**
R: No, solo puede registrar pagos para órdenes en estado PARCIAL o RECIBIDA.

**P: ¿Qué pasa si me equivoqué en el monto del pago?**
R: Puede eliminar el pago incorrecto (si tiene permisos) y registrar el correcto. El sistema recalculará automáticamente.

**P: ¿Puedo pagar más del total de la orden?**
R: No, el sistema no permitirá ingresar un monto que exceda el saldo pendiente.

**P: ¿Los pagos afectan la contabilidad automáticamente?**
R: Esto depende de la integración configurada en su empresa. Consulte con el administrador.

### Sugerencias de Reorden

**P: ¿Por qué no veo sugerencias si tengo productos con stock bajo?**
R: Verifique que:
- El producto tenga configurado stock mínimo
- El producto esté vinculado a un proveedor preferido
- El stock actual sea menor al mínimo

**P: ¿Puedo cambiar la cantidad sugerida?**
R: Sí, cuando crea la orden desde una sugerencia, puede editar las cantidades antes de confirmar.

**P: ¿Las sugerencias se actualizan en tiempo real?**
R: Las sugerencias se recalculan cada vez que el stock cambia (venta, recepción, ajuste).

### Aplicación Móvil

**P: ¿Cuánto espacio ocupa la app en mi dispositivo?**
R: Aproximadamente 50-100 MB dependiendo de la cantidad de datos en caché.

**P: ¿Qué pasa si hago cambios offline desde dos dispositivos?**
R: El sistema procesará los cambios en orden de llegada. Si hay conflictos, recibirá una alerta en cada dispositivo.

**P: ¿Puedo trabajar offline indefinidamente?**
R: Sí, pero le recomendamos sincronizar al menos una vez al día para evitar conflictos.

**P: ¿Los datos offline están encriptados?**
R: Sí, todos los datos locales están encriptados por seguridad.

---

## Consejos y Mejores Prácticas

### Para Administradores

1. **Configure proveedores preferidos:**
   - Marque proveedores preferidos para cada producto
   - Esto optimiza las sugerencias de reorden
   - Facilita la creación rápida de órdenes

2. **Establezca stock mínimo y máximo realista:**
   - Analice su rotación de inventario
   - Considere el tiempo de entrega del proveedor
   - No configure mínimos demasiado altos (aumenta costos)
   - No configure mínimos demasiado bajos (riesgo de quiebre)

3. **Revise términos de pago:**
   - Mantenga actualizados los términos con cada proveedor
   - Esto le ayudará a planificar el flujo de caja

4. **Use códigos consistentes:**
   - Establezca un patrón para códigos de proveedores
   - Ejemplo: SUP-001, SUP-002 o usar acrónimos del nombre

### Para Compradores

1. **Cree órdenes en borrador primero:**
   - No envíe órdenes inmediatamente
   - Déjelas en borrador para revisión
   - Envíelas cuando esté seguro

2. **Use notas internas:**
   - Registre información importante que no debe ver el proveedor
   - Ejemplo: "Negociar descuento en próxima orden"

3. **Agrupe productos del mismo proveedor:**
   - Una orden con múltiples productos reduce costos de envío
   - Use las sugerencias de reorden agrupadas por proveedor

4. **Configure alertas de fechas:**
   - Revise regularmente órdenes confirmadas cercanas a fecha esperada
   - Contacte al proveedor si hay retraso

5. **Revise historial antes de crear órdenes:**
   - Mire el historial de órdenes previas con el proveedor
   - Le ayudará a estimar tiempos de entrega reales
   - Puede copiar estructura de órdenes anteriores

### Para Almaceneros

1. **Verifique antes de recibir:**
   - Cuente físicamente la mercadería
   - Compare con la orden
   - Reporte discrepancias antes de confirmar

2. **Use tablet en el almacén:**
   - Instale la app móvil en una tablet
   - Reciba mercadería en el lugar donde llega
   - No dependa de conexión WiFi

3. **Registre recepciones parciales:**
   - Si no llega todo, registre lo que sí llegó
   - Deje pendiente el resto
   - Esto actualiza el stock inmediatamente

4. **Tome fotos de mercadería dañada:**
   - Use su dispositivo móvil
   - Documente antes de rechazar mercadería
   - Facilita reclamos al proveedor

### Para Contadores/Finanzas

1. **Registre pagos con referencia:**
   - Siempre incluya número de transferencia/cheque
   - Facilita la conciliación bancaria
   - Ayuda en auditorías

2. **Use método de pago correcto:**
   - Seleccione el método exacto utilizado
   - Permite análisis de formas de pago preferidas

3. **Pagos parciales con notas:**
   - Si hace un plan de pagos, documente en notas
   - Ejemplo: "Pago 1 de 3 - vence 30/01"

4. **Revise periódicamente pendientes de pago:**
   - Filtre por estado PARCIAL o PENDING
   - Priorice según términos de pago
   - Evite cargos por mora

### Optimización del Proceso

1. **Ciclo de revisión semanal:**
   ```
   Lunes:
   - Revisar sugerencias de reorden
   - Crear borradores de órdenes necesarias

   Martes:
   - Revisar y enviar órdenes al proveedor

   Miércoles:
   - Seguimiento de órdenes enviadas
   - Confirmar órdenes aceptadas por proveedor

   Jueves:
   - Preparar recepciones de la semana

   Viernes:
   - Procesar pagos pendientes
   - Revisar métricas de la semana
   ```

2. **Indicadores clave a monitorear:**
   - Tiempo promedio entre crear y recibir orden
   - Porcentaje de recepciones parciales (objetivo: <10%)
   - Días promedio para pagar (debe coincidir con términos)
   - Productos frecuentemente en stock bajo

3. **Automatizaciones sugeridas:**
   - Revisar sugerencias diariamente
   - Crear órdenes desde sugerencias de prioridad ALTA inmediatamente
   - Agrupar prioridad MEDIA y BAJA para orden semanal

---

## Glosario de Términos

**Borrador (DRAFT):**
Estado inicial de una orden de compra, permite edición completa.

**Costo Unitario:**
Precio que paga al proveedor por una unidad del producto.

**Envío (Shipping):**
Costo adicional que cobra el proveedor por entregar la mercadería.

**Lead Time:**
Tiempo en días que tarda el proveedor en entregar desde que recibe la orden.

**Orden de Compra (Purchase Order):**
Documento formal que envía a un proveedor para solicitar mercadería.

**Pago Parcial:**
Pago que cubre solo una parte del total de la orden.

**Proveedor Preferido:**
Proveedor marcado como la mejor opción para un producto específico.

**Recepción Parcial:**
Cuando se recibe solo parte de la mercadería ordenada.

**SKU (Stock Keeping Unit):**
Código único que identifica un producto en el inventario.

**Stock Mínimo:**
Cantidad mínima que desea mantener en inventario antes de reordenar.

**Stock Máximo:**
Cantidad ideal a la que desea llegar al reordenar.

**Sugerencia de Reorden:**
Recomendación automática del sistema para crear una orden de compra.

**Sync Queue (Cola de Sincronización):**
Lista de acciones pendientes de enviar al servidor (modo offline).

**Tax ID:**
Número de identificación fiscal (CUIT en Argentina).

**Términos de Pago (Payment Terms):**
Acuerdo sobre el plazo para pagar al proveedor (ej: 30 días).

---

## Soporte

Si necesita ayuda adicional:

**Soporte Técnico:**
- Email: soporte@kalynt.com
- Teléfono: +54 11 XXXX-XXXX
- Horario: Lunes a Viernes, 9:00 a 18:00 hs

**Centro de Ayuda:**
- https://ayuda.kalynt.com

**Tutoriales en Video:**
- https://youtube.com/kalynt-tutoriales

**Comunidad:**
- Foro: https://comunidad.kalynt.com

---

**Última actualización:** Enero 2025
**Versión del sistema:** 1.0.0
**Autor:** Equipo Kalynt
