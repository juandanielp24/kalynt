# Products & Inventory API Documentation

## Overview

Complete API reference for managing products and inventory in the Retail POS system.

## Table of Contents

1. [Products API](#products-api)
2. [Inventory API](#inventory-api)
3. [Authentication](#authentication)
4. [Error Handling](#error-handling)
5. [Examples](#examples)

---

## Authentication

All endpoints require:
- **Header**: `x-tenant-id` - Your tenant identifier
- **Header**: `Authorization: Bearer <token>` - JWT authentication token

---

## Products API

### Base URL
```
/api/v1/products
```

### 1. List Products

Get a paginated list of products.

**Endpoint**: `GET /products`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | No | Page number (default: 1) |
| limit | number | No | Items per page (default: 50) |
| search | string | No | Search in name, SKU, or barcode |
| categoryId | string | No | Filter by category ID |

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "prod-123",
      "sku": "PROD-001",
      "name": "Product Name",
      "description": "Product description",
      "barcode": "7790001234567",
      "costCents": 5000,
      "priceCents": 10000,
      "taxRate": 0.21,
      "categoryId": "cat-123",
      "category": {
        "id": "cat-123",
        "name": "Category Name"
      },
      "trackStock": true,
      "isActive": true,
      "stock": [
        {
          "locationId": "loc-123",
          "location": {
            "name": "Main Warehouse"
          },
          "quantity": 100,
          "minQuantity": 10
        }
      ],
      "createdAt": "2025-11-03T10:00:00Z",
      "updatedAt": "2025-11-03T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

---

### 2. Get Product by ID

Get detailed information about a specific product.

**Endpoint**: `GET /products/:id`

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Product ID |

**Response**: `200 OK`
```json
{
  "id": "prod-123",
  "sku": "PROD-001",
  "name": "Product Name",
  "description": "Product description",
  "barcode": "7790001234567",
  "costCents": 5000,
  "priceCents": 10000,
  "taxRate": 0.21,
  "stock": [...],
  "category": {...}
}
```

**Errors**:
- `404 Not Found` - Product not found

---

### 3. Get Product by Barcode

Search for a product using its barcode.

**Endpoint**: `GET /products/barcode/:barcode`

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| barcode | string | Yes | Product barcode |

**Example**:
```bash
GET /products/barcode/7790001234567
```

**Response**: `200 OK` (same structure as Get Product by ID)

**Errors**:
- `404 Not Found` - Product with barcode not found

---

### 4. Create Product

Create a new product.

**Endpoint**: `POST /products`

**Request Body**:
```json
{
  "sku": "PROD-001",
  "name": "Product Name",
  "description": "Optional description",
  "barcode": "7790001234567",
  "costCents": 5000,
  "priceCents": 10000,
  "taxRate": 0.21,
  "categoryId": "cat-123",
  "trackStock": true,
  "isActive": true,
  "initialStock": {
    "locationId": "loc-123",
    "quantity": 100,
    "minQuantity": 10
  }
}
```

**Validation**:
- `sku`: Required, must be unique per tenant
- `name`: Required
- `priceCents`: Required, must be >= 0
- `costCents`: Optional, must be >= 0
- `taxRate`: Required, 0-1 (e.g., 0.21 for 21%)

**Response**: `201 Created`
```json
{
  "id": "prod-123",
  "sku": "PROD-001",
  "name": "Product Name",
  ...
}
```

**Errors**:
- `400 Bad Request` - Validation error or duplicate SKU
- `404 Not Found` - Category or location not found

---

### 5. Update Product

Update an existing product.

**Endpoint**: `PUT /products/:id`

**Request Body**: (all fields optional)
```json
{
  "name": "Updated Product Name",
  "priceCents": 12000,
  "isActive": false
}
```

**Response**: `200 OK`

**Errors**:
- `404 Not Found` - Product not found
- `400 Bad Request` - Validation error

---

### 6. Delete Product

Soft delete a product.

**Endpoint**: `DELETE /products/:id`

**Response**: `200 OK`
```json
{
  "id": "prod-123",
  "deletedAt": "2025-11-03T10:00:00Z"
}
```

---

### 7. Bulk Update Prices

Update prices for multiple products at once.

**Endpoint**: `POST /products/bulk-update-prices`

**Request Body**:
```json
{
  "products": [
    {
      "id": "prod-123",
      "priceCents": 12000,
      "costCents": 6000
    },
    {
      "id": "prod-456",
      "priceCents": 15000
    }
  ]
}
```

**Response**: `200 OK`
```json
[
  {
    "id": "prod-123",
    "priceCents": 12000,
    "costCents": 6000
  },
  {
    "id": "prod-456",
    "priceCents": 15000
  }
]
```

**Errors**:
- `400 Bad Request` - Some products not found or validation error

---

### 8. Import Products from Excel

Import multiple products from an Excel file.

**Endpoint**: `POST /products/import`

**Content-Type**: `multipart/form-data`

**Form Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | file | Yes | Excel file (.xlsx) |
| locationId | string | Yes | Default location for stock |

**Excel Format**:
| Column | Description | Required |
|--------|-------------|----------|
| SKU | Product SKU | Yes |
| Nombre | Product name | Yes |
| Costo | Cost (in currency, not cents) | No |
| Precio | Price (in currency) | Yes |
| Stock | Initial quantity | No |
| Código Barras | Barcode | No |

**Example**:
```bash
curl -X POST http://localhost:3001/api/v1/products/import \
  -H "x-tenant-id: tenant-123" \
  -H "Authorization: Bearer <token>" \
  -F "file=@productos.xlsx" \
  -F "locationId=loc-123"
```

**Response**: `200 OK`
```json
{
  "success": true,
  "imported": 45,
  "failed": 2,
  "errors": [
    "Row 10: Missing required fields",
    "SKU PROD-999: Product with SKU PROD-999 already exists"
  ]
}
```

---

### 9. Export Products to Excel

Export all products to an Excel file.

**Endpoint**: `GET /products/export`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| search | string | No | Filter products |
| categoryId | string | No | Filter by category |

**Response**: `200 OK`
- **Content-Type**: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Content-Disposition**: `attachment; filename="productos-[timestamp].xlsx"`
- **Body**: Excel file binary

**Example**:
```bash
curl http://localhost:3001/api/v1/products/export \
  -H "x-tenant-id: tenant-123" \
  -H "Authorization: Bearer <token>" \
  -o productos.xlsx
```

---

### 10. Duplicate Product

Create a copy of an existing product.

**Endpoint**: `POST /products/:id/duplicate`

**Response**: `201 Created`
```json
{
  "id": "prod-456",
  "sku": "PROD-001-COPY-123456",
  "name": "Product Name (Copia)",
  "isActive": false,
  ...
}
```

**Note**: The duplicated product will have:
- A new SKU with `-COPY-[timestamp]` suffix
- Name with " (Copia)" suffix
- `isActive` set to `false`
- No initial stock

---

### 11. Toggle Product Active Status

Enable or disable a product.

**Endpoint**: `PATCH /products/:id/toggle-active`

**Response**: `200 OK`
```json
{
  "id": "prod-123",
  "isActive": false
}
```

---

### 12. Get Product Stock

Get stock levels for a product across all locations.

**Endpoint**: `GET /products/:id/stock`

**Response**: `200 OK`
```json
[
  {
    "id": "stock-123",
    "productId": "prod-123",
    "locationId": "loc-123",
    "location": {
      "id": "loc-123",
      "name": "Main Warehouse"
    },
    "quantity": 100,
    "minQuantity": 10
  },
  {
    "id": "stock-456",
    "productId": "prod-123",
    "locationId": "loc-456",
    "location": {
      "id": "loc-456",
      "name": "Store 1"
    },
    "quantity": 25,
    "minQuantity": 5
  }
]
```

---

## Inventory API

### Base URL
```
/api/v1/inventory
```

### 1. Adjust Stock

Manually adjust stock quantity for a product at a location.

**Endpoint**: `POST /inventory/adjust`

**Request Body**:
```json
{
  "productId": "prod-123",
  "locationId": "loc-123",
  "quantity": -5,
  "reason": "Producto dañado"
}
```

**Fields**:
- `quantity`: Can be positive (add) or negative (subtract)
- `reason`: Required explanation for the adjustment

**Response**: `200 OK`
```json
{
  "id": "stock-123",
  "productId": "prod-123",
  "locationId": "loc-123",
  "quantity": 95
}
```

**Errors**:
- `400 Bad Request` - Stock record not found or resulting stock would be negative
- `404 Not Found` - Product or location not found

---

### 2. Transfer Stock

Transfer stock between two locations.

**Endpoint**: `POST /inventory/transfer`

**Request Body**:
```json
{
  "productId": "prod-123",
  "fromLocationId": "loc-123",
  "toLocationId": "loc-456",
  "quantity": 10
}
```

**Validation**:
- `quantity`: Must be positive
- Source and destination must be different
- Sufficient stock must be available at source

**Response**: `200 OK`
```json
{
  "success": true,
  "quantity": 10,
  "fromLocationId": "loc-123",
  "toLocationId": "loc-456"
}
```

**Errors**:
- `400 Bad Request` - Validation error or insufficient stock

---

### 3. Get Stock Movements

Get audit trail of stock changes.

**Endpoint**: `GET /inventory/movements`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| productId | string | No | Filter by product |
| locationId | string | No | Filter by location |
| dateFrom | ISO date | No | Start date |
| dateTo | ISO date | No | End date |

**Response**: `200 OK`
```json
[
  {
    "id": "audit-123",
    "tenantId": "tenant-123",
    "userId": "user-123",
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    },
    "action": "stock_adjustment",
    "entity": "stock",
    "entityId": "product-123",
    "changes": {
      "productId": "prod-123",
      "locationId": "loc-123",
      "previousQuantity": 100,
      "newQuantity": 95,
      "adjustment": -5,
      "reason": "Producto dañado"
    },
    "createdAt": "2025-11-03T10:00:00Z"
  }
]
```

---

### 4. Get Low Stock Products

Get list of products below minimum stock level.

**Endpoint**: `GET /inventory/low-stock`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| locationId | string | No | Filter by location |

**Response**: `200 OK`
```json
[
  {
    "id": "prod-123",
    "name": "Product Name",
    "sku": "PROD-001",
    "stock": [
      {
        "locationId": "loc-123",
        "locationName": "Main Warehouse",
        "currentStock": 5,
        "minStock": 10,
        "deficit": 5
      }
    ]
  }
]
```

---

### 5. Get Inventory Summary

Get overview of inventory across all locations.

**Endpoint**: `GET /inventory/summary`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| locationId | string | No | Filter by location |

**Response**: `200 OK`
```json
{
  "totalProducts": 150,
  "totalStockValue": 125000.50,
  "lowStockCount": 12,
  "outOfStockCount": 3,
  "byLocation": {
    "Main Warehouse": {
      "locationId": "loc-123",
      "totalItems": 100,
      "totalQuantity": 5000,
      "totalValue": 95000.00,
      "lowStockCount": 8,
      "outOfStockCount": 2
    },
    "Store 1": {
      "locationId": "loc-456",
      "totalItems": 50,
      "totalQuantity": 800,
      "totalValue": 30000.50,
      "lowStockCount": 4,
      "outOfStockCount": 1
    }
  }
}
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 422 | Unprocessable Entity |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "priceCents",
      "message": "priceCents must be a positive number"
    }
  ]
}
```

---

## Complete Examples

### Example 1: Create Product and Set Initial Stock

```bash
curl -X POST http://localhost:3001/api/v1/products \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sku": "COCA-500",
    "name": "Coca Cola 500ml",
    "barcode": "7790001234567",
    "costCents": 8000,
    "priceCents": 15000,
    "taxRate": 0.21,
    "categoryId": "cat-bebidas",
    "trackStock": true,
    "isActive": true,
    "initialStock": {
      "locationId": "loc-deposito",
      "quantity": 100,
      "minQuantity": 20
    }
  }'
```

### Example 2: Search Product by Barcode

```bash
curl http://localhost:3001/api/v1/products/barcode/7790001234567 \
  -H "x-tenant-id: tenant-123" \
  -H "Authorization: Bearer <token>"
```

### Example 3: Adjust Stock (Damaged Product)

```bash
curl -X POST http://localhost:3001/api/v1/inventory/adjust \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "productId": "prod-123",
    "locationId": "loc-deposito",
    "quantity": -5,
    "reason": "Productos dañados durante inventario"
  }'
```

### Example 4: Transfer Stock Between Locations

```bash
curl -X POST http://localhost:3001/api/v1/inventory/transfer \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "productId": "prod-123",
    "fromLocationId": "loc-deposito",
    "toLocationId": "loc-tienda1",
    "quantity": 50
  }'
```

### Example 5: Bulk Update Prices

```bash
curl -X POST http://localhost:3001/api/v1/products/bulk-update-prices \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-123" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "products": [
      {
        "id": "prod-123",
        "priceCents": 16000
      },
      {
        "id": "prod-456",
        "priceCents": 18000,
        "costCents": 9000
      }
    ]
  }'
```

### Example 6: Get Low Stock Alert

```bash
curl http://localhost:3001/api/v1/inventory/low-stock?locationId=loc-deposito \
  -H "x-tenant-id: tenant-123" \
  -H "Authorization: Bearer <token>"
```

---

## Best Practices

1. **Stock Management**:
   - Always use the inventory adjustment endpoint for manual changes
   - Use transfer endpoint for moving stock between locations
   - Check low stock regularly to avoid stockouts

2. **Bulk Operations**:
   - Use bulk update for price changes affecting multiple products
   - Import/export for initial setup or periodic updates

3. **Audit Trail**:
   - All stock movements are automatically logged
   - Use movements endpoint to track history

4. **Performance**:
   - Use pagination for large product lists
   - Filter by category or location when possible
   - Export to Excel for reporting, not for frequent queries

---

**Last Updated**: 2025-11-03
**API Version**: 1.0
