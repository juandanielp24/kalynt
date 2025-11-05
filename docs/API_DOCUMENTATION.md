# API Documentation - Suppliers & Purchase Orders

## Índice

1. [Autenticación](#autenticación)
2. [Endpoints de Proveedores](#endpoints-de-proveedores)
3. [Endpoints de Órdenes de Compra](#endpoints-de-órdenes-de-compra)
4. [Endpoints de Pagos](#endpoints-de-pagos)
5. [Endpoints de Sugerencias](#endpoints-de-sugerencias)
6. [Modelos de Datos](#modelos-de-datos)
7. [Códigos de Error](#códigos-de-error)
8. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Autenticación

Todos los endpoints requieren autenticación mediante JWT token en el header `Authorization`.

```http
Authorization: Bearer {jwt_token}
```

El token contiene:
- `userId`: ID del usuario autenticado
- `tenantId`: ID del tenant (multi-tenancy)
- `permissions`: Array de permisos del usuario

---

## Endpoints de Proveedores

### GET /suppliers

Obtener lista de proveedores.

**Permisos requeridos:** `SUPPLIERS:READ`

**Query Parameters:**
| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| search | string | No | Búsqueda por nombre o código |
| includeInactive | boolean | No | Incluir proveedores inactivos (default: false) |
| page | number | No | Número de página (default: 1) |
| limit | number | No | Items por página (default: 20) |

**Response:**
```json
{
  "data": [
    {
      "id": "clx123abc",
      "name": "Proveedor ABC",
      "code": "SUP-001",
      "taxId": "20-12345678-9",
      "email": "contacto@proveedorabc.com",
      "phone": "+54 11 1234-5678",
      "website": "https://proveedorabc.com",
      "address": "Av. Corrientes 1234",
      "city": "Buenos Aires",
      "state": "CABA",
      "zipCode": "1043",
      "country": "Argentina",
      "contactName": "Juan Pérez",
      "contactPhone": "+54 11 8765-4321",
      "contactEmail": "juan@proveedorabc.com",
      "paymentTerms": "30 days",
      "currency": "ARS",
      "bankName": "Banco Galicia",
      "bankAccount": "1234567890",
      "notes": "Proveedor confiable",
      "isActive": true,
      "createdAt": "2025-01-15T10:00:00Z",
      "updatedAt": "2025-01-15T10:00:00Z",
      "_count": {
        "products": 15,
        "purchaseOrders": 8
      }
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Ejemplo:**
```bash
curl -X GET "https://api.kalynt.com/suppliers?search=ABC&includeInactive=false" \
  -H "Authorization: Bearer {token}"
```

---

### GET /suppliers/:id

Obtener un proveedor por ID.

**Permisos requeridos:** `SUPPLIERS:READ`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID del proveedor |

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| includeProducts | boolean | Incluir productos vinculados (default: false) |
| includeOrders | boolean | Incluir órdenes de compra (default: false) |

**Response:**
```json
{
  "id": "clx123abc",
  "name": "Proveedor ABC",
  "code": "SUP-001",
  "taxId": "20-12345678-9",
  "email": "contacto@proveedorabc.com",
  "phone": "+54 11 1234-5678",
  "website": "https://proveedorabc.com",
  "address": "Av. Corrientes 1234",
  "city": "Buenos Aires",
  "state": "CABA",
  "zipCode": "1043",
  "country": "Argentina",
  "contactName": "Juan Pérez",
  "contactPhone": "+54 11 8765-4321",
  "contactEmail": "juan@proveedorabc.com",
  "paymentTerms": "30 days",
  "currency": "ARS",
  "bankName": "Banco Galicia",
  "bankAccount": "1234567890",
  "notes": "Proveedor confiable",
  "isActive": true,
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z",
  "products": [
    {
      "id": "clx456def",
      "productId": "clx789ghi",
      "cost": 150.00,
      "supplierSku": "ABC-001",
      "minOrderQty": 10,
      "leadTimeDays": 7,
      "isPreferred": true,
      "product": {
        "id": "clx789ghi",
        "name": "Producto X",
        "sku": "PROD-001",
        "stock": 50
      }
    }
  ]
}
```

---

### POST /suppliers

Crear un nuevo proveedor.

**Permisos requeridos:** `SUPPLIERS:CREATE`

**Request Body:**
```json
{
  "name": "Proveedor Nuevo",
  "code": "SUP-002",
  "taxId": "20-98765432-1",
  "email": "info@nuevoproveedor.com",
  "phone": "+54 11 9999-8888",
  "website": "https://nuevoproveedor.com",
  "address": "Calle Falsa 123",
  "city": "Rosario",
  "state": "Santa Fe",
  "zipCode": "2000",
  "country": "Argentina",
  "contactName": "María López",
  "contactPhone": "+54 341 1111-2222",
  "contactEmail": "maria@nuevoproveedor.com",
  "paymentTerms": "60 days",
  "currency": "USD",
  "bankName": "Banco Nación",
  "bankAccount": "9876543210",
  "notes": "Nuevo proveedor de electrónicos"
}
```

**Validaciones:**
- `name`: Requerido, mínimo 2 caracteres
- `code`: Requerido, único, formato alfanumérico
- `email`: Formato de email válido
- `currency`: Debe ser código ISO (ARS, USD, EUR, etc.)

**Response:** `201 Created`
```json
{
  "id": "clx999xyz",
  "name": "Proveedor Nuevo",
  "code": "SUP-002",
  "taxId": "20-98765432-1",
  // ... resto de campos
  "createdAt": "2025-01-15T11:00:00Z",
  "updatedAt": "2025-01-15T11:00:00Z"
}
```

---

### PUT /suppliers/:id

Actualizar un proveedor existente.

**Permisos requeridos:** `SUPPLIERS:UPDATE`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID del proveedor |

**Request Body:**
```json
{
  "name": "Proveedor ABC Actualizado",
  "phone": "+54 11 5555-6666",
  "notes": "Información actualizada"
}
```

**Response:** `200 OK`
```json
{
  "id": "clx123abc",
  "name": "Proveedor ABC Actualizado",
  "phone": "+54 11 5555-6666",
  "notes": "Información actualizada",
  // ... resto de campos
  "updatedAt": "2025-01-15T12:00:00Z"
}
```

---

### DELETE /suppliers/:id

Eliminar un proveedor (soft delete).

**Permisos requeridos:** `SUPPLIERS:DELETE`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID del proveedor |

**Response:** `204 No Content`

**Notas:**
- Solo se puede eliminar si no tiene órdenes de compra activas
- Marca `isActive = false` en lugar de eliminar físicamente

---

### GET /suppliers/:id/products

Obtener productos vinculados a un proveedor.

**Permisos requeridos:** `SUPPLIERS:READ`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID del proveedor |

**Response:**
```json
{
  "data": [
    {
      "id": "clx456def",
      "supplierId": "clx123abc",
      "productId": "clx789ghi",
      "cost": 150.00,
      "supplierSku": "ABC-001",
      "minOrderQty": 10,
      "leadTimeDays": 7,
      "isPreferred": true,
      "product": {
        "id": "clx789ghi",
        "name": "Producto X",
        "sku": "PROD-001",
        "barcode": "BAR-001",
        "price": 300.00,
        "stock": 50,
        "minStock": 20,
        "maxStock": 100
      }
    }
  ]
}
```

---

### POST /suppliers/:id/products

Vincular un producto a un proveedor.

**Permisos requeridos:** `SUPPLIERS:UPDATE`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID del proveedor |

**Request Body:**
```json
{
  "productId": "clx789ghi",
  "cost": 150.00,
  "supplierSku": "ABC-001",
  "minOrderQty": 10,
  "leadTimeDays": 7,
  "isPreferred": true
}
```

**Response:** `201 Created`
```json
{
  "id": "clx456def",
  "supplierId": "clx123abc",
  "productId": "clx789ghi",
  "cost": 150.00,
  "supplierSku": "ABC-001",
  "minOrderQty": 10,
  "leadTimeDays": 7,
  "isPreferred": true,
  "createdAt": "2025-01-15T13:00:00Z"
}
```

---

## Endpoints de Órdenes de Compra

### GET /purchase-orders

Obtener lista de órdenes de compra.

**Permisos requeridos:** `PURCHASE_ORDERS:READ`

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| status | string | Filtrar por estado (DRAFT, SENT, CONFIRMED, PARTIAL, RECEIVED, CANCELLED) |
| paymentStatus | string | Filtrar por estado de pago (PENDING, PARTIAL, PAID) |
| supplierId | string | Filtrar por proveedor |
| locationId | string | Filtrar por ubicación |
| fromDate | string | Fecha desde (ISO 8601) |
| toDate | string | Fecha hasta (ISO 8601) |
| page | number | Número de página (default: 1) |
| limit | number | Items por página (default: 20) |

**Response:**
```json
{
  "data": {
    "orders": [
      {
        "id": "clx111aaa",
        "orderNumber": "PO-00001",
        "status": "CONFIRMED",
        "paymentStatus": "PENDING",
        "orderDate": "2025-01-10T08:00:00Z",
        "expectedDate": "2025-01-20T08:00:00Z",
        "receivedDate": null,
        "subtotal": 1000.00,
        "taxAmount": 210.00,
        "discount": 0.00,
        "shippingCost": 50.00,
        "totalAmount": 1260.00,
        "paidAmount": 0.00,
        "notes": "Entrega antes del 20",
        "supplier": {
          "id": "clx123abc",
          "name": "Proveedor ABC",
          "code": "SUP-001"
        },
        "location": {
          "id": "clx555loc",
          "name": "Almacén Central",
          "type": "WAREHOUSE"
        },
        "_count": {
          "items": 3,
          "payments": 0
        }
      }
    ],
    "total": 25
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

---

### GET /purchase-orders/:id

Obtener una orden de compra por ID.

**Permisos requeridos:** `PURCHASE_ORDERS:READ`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID de la orden |

**Response:**
```json
{
  "id": "clx111aaa",
  "orderNumber": "PO-00001",
  "status": "CONFIRMED",
  "paymentStatus": "PENDING",
  "orderDate": "2025-01-10T08:00:00Z",
  "expectedDate": "2025-01-20T08:00:00Z",
  "receivedDate": null,
  "subtotal": 1000.00,
  "taxAmount": 210.00,
  "discount": 0.00,
  "shippingCost": 50.00,
  "totalAmount": 1260.00,
  "paidAmount": 0.00,
  "notes": "Entrega antes del 20",
  "internalNotes": "Contactar a María para coordinar",
  "supplier": {
    "id": "clx123abc",
    "name": "Proveedor ABC",
    "code": "SUP-001",
    "email": "contacto@proveedorabc.com",
    "phone": "+54 11 1234-5678"
  },
  "location": {
    "id": "clx555loc",
    "name": "Almacén Central",
    "type": "WAREHOUSE"
  },
  "createdBy": {
    "id": "clx999usr",
    "name": "Pedro González",
    "email": "pedro@empresa.com"
  },
  "items": [
    {
      "id": "clx222itm",
      "productId": "clx789ghi",
      "productName": "Producto X",
      "productSku": "PROD-001",
      "quantityOrdered": 10,
      "quantityReceived": 0,
      "unitCost": 100.00,
      "taxRate": 21.00,
      "discount": 0.00,
      "subtotal": 1000.00,
      "taxAmount": 210.00,
      "totalAmount": 1210.00
    }
  ],
  "payments": [],
  "createdAt": "2025-01-10T08:00:00Z",
  "updatedAt": "2025-01-10T08:00:00Z"
}
```

---

### POST /purchase-orders

Crear una nueva orden de compra.

**Permisos requeridos:** `PURCHASE_ORDERS:CREATE`

**Request Body:**
```json
{
  "supplierId": "clx123abc",
  "locationId": "clx555loc",
  "expectedDate": "2025-01-25T00:00:00Z",
  "notes": "Entrega urgente",
  "internalNotes": "Coordinar con almacén",
  "shippingCost": 100.00,
  "discount": 50.00,
  "items": [
    {
      "productId": "clx789ghi",
      "quantityOrdered": 20,
      "unitCost": 95.00,
      "taxRate": 21.00,
      "discount": 0.00
    },
    {
      "productId": "clx888jkl",
      "quantityOrdered": 15,
      "unitCost": 120.00,
      "taxRate": 21.00,
      "discount": 10.00
    }
  ]
}
```

**Validaciones:**
- `supplierId`: Debe existir y estar activo
- `items`: Mínimo 1 item
- `quantityOrdered`: Mayor a 0
- `unitCost`: Mayor a 0
- `taxRate`: Entre 0 y 100

**Response:** `201 Created`
```json
{
  "id": "clx333new",
  "orderNumber": "PO-00026",
  "status": "DRAFT",
  "paymentStatus": "PENDING",
  "orderDate": "2025-01-15T14:00:00Z",
  "expectedDate": "2025-01-25T00:00:00Z",
  "subtotal": 3700.00,
  "taxAmount": 777.00,
  "discount": 50.00,
  "shippingCost": 100.00,
  "totalAmount": 4527.00,
  "paidAmount": 0.00,
  // ... resto de campos
}
```

**Cálculo de Totales:**
```
Item 1: 20 × $95 = $1,900
Item 2: 15 × $120 = $1,800
Subtotal: $3,700
Tax (21%): $777
Discount: -$50
Shipping: $100
Total: $4,527
```

---

### PUT /purchase-orders/:id

Actualizar una orden de compra.

**Permisos requeridos:** `PURCHASE_ORDERS:UPDATE`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID de la orden |

**Request Body:**
```json
{
  "expectedDate": "2025-01-30T00:00:00Z",
  "notes": "Fecha de entrega modificada",
  "shippingCost": 150.00
}
```

**Notas:**
- Solo órdenes en estado `DRAFT` pueden modificar items
- Otros estados solo pueden actualizar campos de metadata (notas, fechas)

**Response:** `200 OK`

---

### PUT /purchase-orders/:id/send

Enviar orden al proveedor (DRAFT → SENT).

**Permisos requeridos:** `PURCHASE_ORDERS:UPDATE`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID de la orden |

**Response:** `200 OK`
```json
{
  "id": "clx111aaa",
  "orderNumber": "PO-00001",
  "status": "SENT",
  // ... resto de campos
}
```

**Validaciones:**
- Estado actual debe ser `DRAFT`
- Debe tener al menos 1 item

---

### PUT /purchase-orders/:id/confirm

Confirmar orden (SENT → CONFIRMED).

**Permisos requeridos:** `PURCHASE_ORDERS:UPDATE`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID de la orden |

**Response:** `200 OK`
```json
{
  "id": "clx111aaa",
  "orderNumber": "PO-00001",
  "status": "CONFIRMED",
  // ... resto de campos
}
```

**Validaciones:**
- Estado actual debe ser `SENT`

---

### PUT /purchase-orders/:id/receive

Recibir mercadería (CONFIRMED/PARTIAL → PARTIAL/RECEIVED).

**Permisos requeridos:** `PURCHASE_ORDERS:UPDATE`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID de la orden |

**Request Body:**
```json
{
  "receivedDate": "2025-01-18T10:00:00Z",
  "items": [
    {
      "itemId": "clx222itm",
      "quantityReceived": 8
    },
    {
      "itemId": "clx333itm",
      "quantityReceived": 15
    }
  ]
}
```

**Validaciones:**
- Estado actual debe ser `CONFIRMED` o `PARTIAL`
- `quantityReceived` no puede exceder `quantityOrdered - quantityReceived` actual
- `quantityReceived` debe ser mayor a 0

**Response:** `200 OK`
```json
{
  "id": "clx111aaa",
  "orderNumber": "PO-00001",
  "status": "PARTIAL",
  "receivedDate": "2025-01-18T10:00:00Z",
  "items": [
    {
      "id": "clx222itm",
      "quantityOrdered": 10,
      "quantityReceived": 8,
      // ...
    },
    {
      "id": "clx333itm",
      "quantityOrdered": 15,
      "quantityReceived": 15,
      // ...
    }
  ]
}
```

**Efectos Secundarios:**
- Actualiza `quantityReceived` de los items
- Actualiza stock de productos en la ubicación especificada
- Cambia estado a `PARTIAL` si no se recibió todo
- Cambia estado a `RECEIVED` si se recibió todo

---

### PUT /purchase-orders/:id/cancel

Cancelar orden.

**Permisos requeridos:** `PURCHASE_ORDERS:UPDATE`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID de la orden |

**Request Body:**
```json
{
  "reason": "Proveedor no puede cumplir con el plazo"
}
```

**Response:** `200 OK`
```json
{
  "id": "clx111aaa",
  "orderNumber": "PO-00001",
  "status": "CANCELLED",
  "internalNotes": "Cancelada: Proveedor no puede cumplir con el plazo",
  // ... resto de campos
}
```

**Validaciones:**
- No se puede cancelar órdenes ya recibidas (`RECEIVED`)
- `reason` es requerido

---

### DELETE /purchase-orders/:id

Eliminar orden de compra.

**Permisos requeridos:** `PURCHASE_ORDERS:DELETE`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID de la orden |

**Response:** `204 No Content`

**Notas:**
- Solo se pueden eliminar órdenes en estado `DRAFT`
- Elimina en cascada los items asociados

---

## Endpoints de Pagos

### GET /payments

Obtener lista de pagos.

**Permisos requeridos:** `PAYMENTS:READ`

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| purchaseOrderId | string | Filtrar por orden de compra |
| fromDate | string | Fecha desde (ISO 8601) |
| toDate | string | Fecha hasta (ISO 8601) |
| paymentMethod | string | Filtrar por método de pago |
| page | number | Número de página (default: 1) |
| limit | number | Items por página (default: 20) |

**Response:**
```json
{
  "data": [
    {
      "id": "clx444pay",
      "paymentNumber": "PAY-00001",
      "amount": 500.00,
      "paymentMethod": "Transferencia Bancaria",
      "paymentDate": "2025-01-15T10:00:00Z",
      "reference": "TRANS-123456",
      "notes": "Pago parcial",
      "purchaseOrder": {
        "id": "clx111aaa",
        "orderNumber": "PO-00001",
        "totalAmount": 1260.00
      },
      "createdBy": {
        "id": "clx999usr",
        "name": "Pedro González"
      },
      "createdAt": "2025-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### GET /payments/:id

Obtener un pago por ID.

**Permisos requeridos:** `PAYMENTS:READ`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID del pago |

**Response:**
```json
{
  "id": "clx444pay",
  "paymentNumber": "PAY-00001",
  "amount": 500.00,
  "paymentMethod": "Transferencia Bancaria",
  "paymentDate": "2025-01-15T10:00:00Z",
  "reference": "TRANS-123456",
  "notes": "Pago parcial",
  "purchaseOrder": {
    "id": "clx111aaa",
    "orderNumber": "PO-00001",
    "totalAmount": 1260.00,
    "paidAmount": 500.00,
    "paymentStatus": "PARTIAL"
  },
  "createdBy": {
    "id": "clx999usr",
    "name": "Pedro González",
    "email": "pedro@empresa.com"
  },
  "createdAt": "2025-01-15T10:00:00Z",
  "updatedAt": "2025-01-15T10:00:00Z"
}
```

---

### POST /payments

Crear un nuevo pago.

**Permisos requeridos:** `PAYMENTS:CREATE`

**Request Body:**
```json
{
  "purchaseOrderId": "clx111aaa",
  "amount": 500.00,
  "paymentMethod": "Transferencia Bancaria",
  "paymentDate": "2025-01-15T10:00:00Z",
  "reference": "TRANS-123456",
  "notes": "Pago parcial - primera cuota"
}
```

**Validaciones:**
- `purchaseOrderId`: Debe existir
- `amount`: Debe ser mayor a 0
- `amount`: No puede exceder el saldo pendiente (`totalAmount - paidAmount`)
- `paymentMethod`: Requerido
- `paymentDate`: Debe ser fecha válida (no futura)

**Métodos de Pago Válidos:**
- Efectivo
- Transferencia Bancaria
- Cheque
- Tarjeta de Crédito
- Tarjeta de Débito

**Response:** `201 Created`
```json
{
  "id": "clx444pay",
  "paymentNumber": "PAY-00001",
  "amount": 500.00,
  "paymentMethod": "Transferencia Bancaria",
  "paymentDate": "2025-01-15T10:00:00Z",
  "reference": "TRANS-123456",
  "notes": "Pago parcial - primera cuota",
  "purchaseOrderId": "clx111aaa",
  "createdById": "clx999usr",
  "createdAt": "2025-01-15T10:00:00Z"
}
```

**Efectos Secundarios:**
- Actualiza `paidAmount` de la orden de compra
- Actualiza `paymentStatus` de la orden:
  - `PENDING` si `paidAmount = 0`
  - `PARTIAL` si `0 < paidAmount < totalAmount`
  - `PAID` si `paidAmount = totalAmount`

---

### DELETE /payments/:id

Eliminar un pago.

**Permisos requeridos:** `PAYMENTS:DELETE`

**Path Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| id | string | ID del pago |

**Response:** `204 No Content`

**Efectos Secundarios:**
- Recalcula `paidAmount` de la orden de compra
- Actualiza `paymentStatus` de la orden según el nuevo total

---

## Endpoints de Sugerencias

### GET /purchase-orders/reorder/suggestions

Obtener sugerencias de reorden.

**Permisos requeridos:** `PURCHASE_ORDERS:READ`

**Query Parameters:**
| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| locationId | string | Filtrar por ubicación |
| supplierId | string | Filtrar por proveedor |
| categoryId | string | Filtrar por categoría de producto |

**Response:**
```json
{
  "data": [
    {
      "product": {
        "id": "clx789ghi",
        "name": "Producto X",
        "sku": "PROD-001",
        "currentStock": 5,
        "minStock": 20,
        "maxStock": 100,
        "suggestedQuantity": 95
      },
      "supplier": {
        "id": "clx123abc",
        "name": "Proveedor ABC",
        "code": "SUP-001"
      },
      "supplierProduct": {
        "cost": 100.00,
        "supplierSku": "ABC-001",
        "minOrderQty": 10,
        "leadTimeDays": 7,
        "isPreferred": true
      },
      "estimatedDeliveryDate": "2025-01-25T00:00:00Z",
      "estimatedTotal": 9500.00,
      "priority": "HIGH"
    }
  ],
  "summary": {
    "totalProducts": 15,
    "totalEstimatedCost": 45000.00,
    "bySupplier": [
      {
        "supplierId": "clx123abc",
        "supplierName": "Proveedor ABC",
        "productCount": 8,
        "estimatedCost": 25000.00
      },
      {
        "supplierId": "clx456def",
        "supplierName": "Proveedor XYZ",
        "productCount": 7,
        "estimatedCost": 20000.00
      }
    ]
  }
}
```

**Lógica de Prioridad:**
```
HIGH: currentStock <= minStock / 2
MEDIUM: currentStock <= minStock
LOW: currentStock <= minStock * 1.2
```

**Cálculo de Cantidad Sugerida:**
```
suggestedQuantity = maxStock - currentStock
```

Si existe `minOrderQty`, se ajusta:
```
suggestedQuantity = Math.max(suggestedQuantity, minOrderQty)
```

---

## Modelos de Datos

### Supplier

```typescript
interface Supplier {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  taxId?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  paymentTerms?: string;
  currency?: string;
  bankName?: string;
  bankAccount?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### PurchaseOrder

```typescript
interface PurchaseOrder {
  id: string;
  tenantId: string;
  supplierId: string;
  orderNumber: string;
  status: PurchaseOrderStatus;
  paymentStatus: PaymentStatus;
  orderDate: Date;
  expectedDate?: Date;
  receivedDate?: Date;
  locationId?: string;
  createdById: string;
  subtotal: number;
  taxAmount: number;
  discount: number;
  shippingCost: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  internalNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  CONFIRMED = 'CONFIRMED',
  PARTIAL = 'PARTIAL',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED'
}

enum PaymentStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID'
}
```

### PurchaseOrderItem

```typescript
interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  taxRate: number;
  discount: number;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Payment

```typescript
interface Payment {
  id: string;
  tenantId: string;
  purchaseOrderId: string;
  paymentNumber: string;
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  reference?: string;
  notes?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### SupplierProduct

```typescript
interface SupplierProduct {
  id: string;
  supplierId: string;
  productId: string;
  cost: number;
  supplierSku?: string;
  minOrderQty?: number;
  leadTimeDays?: number;
  isPreferred: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Códigos de Error

### Errores Comunes

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| 400 | Bad Request | Datos de entrada inválidos |
| 401 | Unauthorized | Token JWT ausente o inválido |
| 403 | Forbidden | Usuario sin permisos suficientes |
| 404 | Not Found | Recurso no encontrado |
| 409 | Conflict | Conflicto (ej: código duplicado) |
| 422 | Unprocessable Entity | Validación de negocio falló |
| 500 | Internal Server Error | Error del servidor |

### Formato de Error

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "amount",
      "message": "Amount cannot exceed remaining balance"
    }
  ],
  "timestamp": "2025-01-15T15:00:00Z",
  "path": "/payments"
}
```

### Errores Específicos

**Suppliers:**
```json
{
  "statusCode": 409,
  "message": "Supplier code already exists",
  "code": "DUPLICATE_CODE"
}
```

**Purchase Orders:**
```json
{
  "statusCode": 422,
  "message": "Invalid status transition",
  "code": "INVALID_TRANSITION",
  "details": {
    "currentStatus": "DRAFT",
    "requestedStatus": "RECEIVED",
    "allowedTransitions": ["SENT"]
  }
}
```

**Payments:**
```json
{
  "statusCode": 422,
  "message": "Payment amount exceeds remaining balance",
  "code": "AMOUNT_EXCEEDS_BALANCE",
  "details": {
    "totalAmount": 1260.00,
    "paidAmount": 800.00,
    "remainingBalance": 460.00,
    "requestedAmount": 500.00
  }
}
```

---

## Ejemplos de Uso

### Ejemplo 1: Flujo Completo de Compra

```bash
# 1. Crear proveedor
curl -X POST "https://api.kalynt.com/suppliers" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electrónica SA",
    "code": "ELEC-001",
    "paymentTerms": "30 days",
    "currency": "ARS"
  }'

# Response: { "id": "supplier123", ... }

# 2. Vincular productos
curl -X POST "https://api.kalynt.com/suppliers/supplier123/products" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod456",
    "cost": 150.00,
    "leadTimeDays": 7,
    "isPreferred": true
  }'

# 3. Crear orden de compra
curl -X POST "https://api.kalynt.com/purchase-orders" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": "supplier123",
    "items": [
      {
        "productId": "prod456",
        "quantityOrdered": 20,
        "unitCost": 150.00,
        "taxRate": 21.00
      }
    ]
  }'

# Response: { "id": "order789", "orderNumber": "PO-00001", "status": "DRAFT", ... }

# 4. Enviar al proveedor
curl -X PUT "https://api.kalynt.com/purchase-orders/order789/send" \
  -H "Authorization: Bearer {token}"

# 5. Confirmar orden
curl -X PUT "https://api.kalynt.com/purchase-orders/order789/confirm" \
  -H "Authorization: Bearer {token}"

# 6. Recibir mercadería
curl -X PUT "https://api.kalynt.com/purchase-orders/order789/receive" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "itemId": "item999",
        "quantityReceived": 20
      }
    ]
  }'

# 7. Registrar pago
curl -X POST "https://api.kalynt.com/payments" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseOrderId": "order789",
    "amount": 3630.00,
    "paymentMethod": "Transferencia Bancaria",
    "reference": "TRANS-987654"
  }'
```

### Ejemplo 2: Recepción Parcial

```bash
# Primera recepción (10 de 20 unidades)
curl -X PUT "https://api.kalynt.com/purchase-orders/order789/receive" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "itemId": "item999",
        "quantityReceived": 10
      }
    ]
  }'

# Response: { "status": "PARTIAL", ... }

# Segunda recepción (10 unidades restantes)
curl -X PUT "https://api.kalynt.com/purchase-orders/order789/receive" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "itemId": "item999",
        "quantityReceived": 10
      }
    ]
  }'

# Response: { "status": "RECEIVED", ... }
```

### Ejemplo 3: Pagos Parciales

```bash
# Orden total: $3,630

# Pago 1: $1,500
curl -X POST "https://api.kalynt.com/payments" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseOrderId": "order789",
    "amount": 1500.00,
    "paymentMethod": "Efectivo"
  }'

# Pago 2: $1,000
curl -X POST "https://api.kalynt.com/payments" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseOrderId": "order789",
    "amount": 1000.00,
    "paymentMethod": "Cheque",
    "reference": "CHQ-123"
  }'

# Pago 3: $1,130 (completa el pago)
curl -X POST "https://api.kalynt.com/payments" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "purchaseOrderId": "order789",
    "amount": 1130.00,
    "paymentMethod": "Transferencia Bancaria",
    "reference": "TRANS-555"
  }'

# Verificar estado
curl -X GET "https://api.kalynt.com/purchase-orders/order789" \
  -H "Authorization: Bearer {token}"

# Response: { "paymentStatus": "PAID", "paidAmount": 3630.00, ... }
```

### Ejemplo 4: Sugerencias de Reorden

```bash
# Obtener sugerencias
curl -X GET "https://api.kalynt.com/purchase-orders/reorder/suggestions" \
  -H "Authorization: Bearer {token}"

# Crear orden desde sugerencias
curl -X POST "https://api.kalynt.com/purchase-orders" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "supplierId": "supplier123",
    "items": [
      {
        "productId": "prod456",
        "quantityOrdered": 95,
        "unitCost": 150.00,
        "taxRate": 21.00
      }
    ],
    "notes": "Orden generada desde sugerencias de reorden"
  }'
```

---

## Rate Limiting

- **Límite general**: 100 requests por minuto por tenant
- **Límite de escritura**: 20 requests por minuto por tenant
- **Límite de lecturas pesadas**: 10 requests por minuto

**Headers de respuesta:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

**Error de límite excedido:**
```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "retryAfter": 45
}
```

---

## Versionado

La API usa versionado en la URL:

```
https://api.kalynt.com/v1/suppliers
```

**Versiones soportadas:**
- `v1`: Versión actual (documentada aquí)

**Política de deprecación:**
- Aviso 6 meses antes de deprecar una versión
- Soporte de versiones anteriores por 12 meses

---

## Webhooks (Próximamente)

Eventos disponibles:
- `purchase_order.created`
- `purchase_order.status_changed`
- `purchase_order.received`
- `payment.created`
- `payment.deleted`

---

**Última actualización:** Enero 2025
**Versión de API:** v1
**Mantenido por:** Equipo Kalynt
