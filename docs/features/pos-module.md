# POS Module Documentation

## Overview

The Point of Sale (POS) module is a complete sales management system for the Kalynt retail platform. It provides a modern, intuitive interface for processing sales transactions, managing inventory, and automatically generating AFIP-compliant electronic invoices for Argentina.

## Features

### Core Functionality

- **Product Selection**: Browse and search products with real-time stock indicators
- **Shopping Cart**: Add, remove, and adjust product quantities with automatic calculations
- **Multiple Payment Methods**: Support for cash, credit/debit cards, Mercado Pago, MODO, and bank transfers
- **Automatic Tax Calculation**: IVA calculated automatically based on product tax rates
- **AFIP Integration**: Automatic electronic invoice generation with CAE (Código de Autorización Electrónico)
- **Stock Management**: Real-time stock validation and automatic inventory updates
- **Multi-tenant**: Complete data isolation per tenant
- **Multi-location**: Support for multiple store locations
- **Receipt Management**: Print or send receipts via email
- **Offline Support** (Mobile): Work offline and sync when connection is restored

### Business Logic

1. **Sale Creation**: Creates a draft sale with stock validation
2. **Stock Reservation**: Decrements stock atomically during sale creation
3. **Payment Processing**: Marks payment as completed
4. **Invoice Generation**: Generates AFIP-compliant invoice (Factura A/B/C)
5. **Sale Completion**: Finalizes sale with invoice data (CAE, invoice number)
6. **Audit Trail**: Complete logging of all sales transactions

## Architecture

### Backend (NestJS)

Located in `apps/api/src/modules/sales/`

#### Components

##### DTOs (Data Transfer Objects)
- `CreateSaleDto`: Validation for creating new sales
- `QuerySalesDto`: Filtering and pagination for sales list
- `CompleteSaleDto`: Additional data when completing sales

##### Service (`sales.service.ts`)

Main business logic:

```typescript
class SalesService {
  async create(tenantId, userId, dto: CreateSaleDto): Promise<Sale>
  async complete(tenantId, saleId, dto?: CompleteSaleDto): Promise<CompleteSaleResponse>
  async findAll(tenantId, query: QuerySalesDto): Promise<PaginatedSalesResponse>
  async findOne(tenantId, id): Promise<Sale>
  async cancel(tenantId, saleId): Promise<CancelResponse>
  async getAFIPStatus(): Promise<AFIPStatusResponse>
}
```

**Key Features**:
- Atomic transactions for stock management
- Sequential sale numbering per tenant
- AFIP invoice type determination (A/B/C)
- Stock validation before sale creation
- Automatic stock restoration on cancellation

##### Controller (`sales.controller.ts`)

REST API endpoints:

```
GET    /sales              - List all sales with filters
GET    /sales/:id          - Get sale by ID
POST   /sales              - Create new sale (draft)
POST   /sales/:id/complete - Complete sale and generate AFIP invoice
DELETE /sales/:id          - Cancel sale and restore stock
GET    /sales/afip/status  - Get AFIP server status
```

All endpoints protected by:
- `AuthGuard`: Requires authentication
- `TenantGuard`: Ensures tenant context

### Frontend Web (Next.js)

Located in `apps/web/src/`

#### Components

##### ProductGrid (`components/pos/ProductGrid.tsx`)

Product display with:
- Responsive grid layout (2-5 columns)
- Stock indicators (in stock, low stock, out of stock)
- Price display with IVA percentage
- Category badges
- Add to cart functionality
- Loading skeletons
- Empty states

##### CartSidebar (`components/pos/CartSidebar.tsx`)

Shopping cart with:
- Item list with quantities
- Quantity controls (+/-)
- Individual item removal
- Discount display
- Subtotal, IVA, and total calculations
- Clear cart button
- Checkout button

##### CheckoutDialog (`components/pos/CheckoutDialog.tsx`)

Checkout interface with:
- Payment method selection
- Customer information (optional):
  - Name
  - CUIT/CUIL
  - Email
  - Phone
- Order summary
- Process button
- Error handling
- Success confirmation

##### POS Page (`app/(dashboard)/pos/page.tsx`)

Main POS interface:
- Location selector
- Product search
- Barcode scanner button (future)
- ProductGrid integration
- CartSidebar integration
- CheckoutDialog integration

#### State Management

##### Cart Store (`store/cart-store.ts`)

Zustand store with localStorage persistence:

```typescript
interface CartStore {
  items: CartItem[]
  locationId: string | null

  // Actions
  setLocationId(locationId: string): void
  addItem(item: Omit<CartItem, 'quantity'>): void
  removeItem(productId: string): void
  updateQuantity(productId: string, quantity: number): void
  updateDiscount(productId: string, discountCents: number): void
  clearCart(): void

  // Computed
  getSubtotalCents(): number
  getTaxCents(): number
  getTotalCents(): number
  getItemCount(): number
}
```

#### API Client (`lib/api/sales.ts`)

Type-safe API client:

```typescript
const salesApi = {
  findAll(query?: QuerySalesDto): Promise<PaginatedSalesResponse>
  findOne(id: string): Promise<Sale>
  create(dto: CreateSaleDto): Promise<Sale>
  complete(id: string, dto?: CompleteSaleDto): Promise<CompleteSaleResponse>
  cancel(id: string): Promise<CancelResponse>
  getAFIPStatus(): Promise<AFIPStatusResponse>
}
```

### Mobile (React Native + Expo)

Located in `apps/mobile/`

#### Components

##### POS Screen (`app/(tabs)/index.tsx`)

Mobile POS interface with:
- Product search
- Barcode scanner button
- Product cards in grid
- Cart sidebar
- Checkout functionality

##### Cart Store (`store/cart-store.ts`)

Similar to web version but uses AsyncStorage for persistence.

##### Offline Support

Uses SQLite for local data storage and sync mechanism for offline transactions.

## Data Flow

### Creating a Sale

```mermaid
sequenceDiagram
    User->>POS Page: Select products
    POS Page->>Cart Store: Add items
    User->>POS Page: Click "Procesar Venta"
    POS Page->>CheckoutDialog: Open dialog
    User->>CheckoutDialog: Enter payment method & customer info
    CheckoutDialog->>Sales API: POST /sales (create draft)
    Sales API->>Database: Validate stock
    Sales API->>Database: Create sale & decrement stock
    Sales API->>CheckoutDialog: Return sale
    CheckoutDialog->>Sales API: POST /sales/:id/complete
    Sales API->>AFIP Service: Generate invoice
    AFIP Service->>AFIP: Request CAE
    AFIP->>AFIP Service: Return CAE
    Sales API->>Database: Update sale with invoice data
    Sales API->>CheckoutDialog: Return completed sale
    CheckoutDialog->>Cart Store: Clear cart
    CheckoutDialog->>User: Show success message
```

### Sale Statuses

1. **DRAFT**: Sale created, stock reserved, payment pending
2. **COMPLETED**: Payment confirmed, AFIP invoice generated
3. **CANCELLED**: Sale cancelled, stock restored
4. **REFUNDED**: Sale refunded (future implementation)

### Payment Statuses

1. **PENDING**: Payment not yet processed
2. **COMPLETED**: Payment confirmed
3. **FAILED**: Payment failed
4. **REFUNDED**: Payment refunded

## Invoice Types (AFIP)

### Type Determination

Based on seller's fiscal condition and customer's CUIT:

| Seller Condition | Customer CUIT | Invoice Type | Description |
|-----------------|---------------|--------------|-------------|
| Responsable Inscripto | Yes | Factura A | VAT discriminated, for RI customers |
| Responsable Inscripto | No | Factura B | VAT included, for final consumers |
| Monotributista | - | Factura C | No VAT discrimination |
| Exento | - | Factura C | Tax exempt |

### Invoice Data

Generated invoices include:
- Invoice number (format: 0001-00012345)
- CAE (Código de Autorización Electrónico)
- CAE expiration date
- QR code for verification
- Complete itemized list
- Tax breakdown
- Customer information

## Money Handling

### Cents-based Storage

All monetary amounts are stored as **integers in cents** to avoid floating-point precision issues:

```typescript
// Price: $1,234.56 ARS
const priceCents = 123456; // Stored as 123456 cents

// Display
formatCurrencyARS(123456); // Returns "$1,234.56"
```

### Currency Formatting

Utility function in `@retail/shared`:

```typescript
formatCurrencyARS(cents: number): string
// Input: 123456
// Output: "$1,234.56"
```

## Tax Calculation

### IVA (Value Added Tax)

Calculated per item:

```typescript
const subtotal = unitPriceCents * quantity;
const taxAmount = Math.round(subtotal * taxRate);
const total = subtotal + taxAmount - (discountCents || 0);
```

Common tax rates in Argentina:
- 21% (0.21) - General rate
- 10.5% (0.105) - Reduced rate
- 27% (0.27) - Special rate
- 0% (0.00) - Exempt

## Stock Management

### Atomic Operations

Stock updates use database transactions to ensure consistency:

```typescript
await prisma.$transaction(async (tx) => {
  // Create sale
  const sale = await tx.sale.create({ data: {...} });

  // Create items
  await tx.saleItem.createMany({ data: items });

  // Update stock (decrement)
  for (const item of items) {
    await tx.stock.update({
      where: { productId_locationId: {...} },
      data: { quantity: { decrement: item.quantity } }
    });
  }
});
```

If any operation fails, the entire transaction rolls back.

### Stock Validation

Before creating a sale:

```typescript
// Check all products exist and have sufficient stock
for (const item of dto.items) {
  const product = await getProduct(item.productId);
  const stock = product.stock.find(s => s.locationId === dto.locationId);

  if (!stock || stock.quantity < item.quantity) {
    throw new BadRequestException(
      `Insufficient stock for ${product.name}. ` +
      `Available: ${stock?.quantity || 0}, Requested: ${item.quantity}`
    );
  }
}
```

### Stock Restoration

When cancelling a sale:

```typescript
await prisma.$transaction(async (tx) => {
  // Update sale status
  await tx.sale.update({
    where: { id: saleId },
    data: { status: 'CANCELLED' }
  });

  // Restore stock (increment)
  for (const item of sale.items) {
    await tx.stock.update({
      where: { productId_locationId: {...} },
      data: { quantity: { increment: item.quantity } }
    });
  }
});
```

## Error Handling

### Common Errors

#### Backend

- `BadRequestException`: Invalid input, insufficient stock
- `NotFoundException`: Sale/product not found
- `UnauthorizedException`: Missing/invalid authentication
- `ForbiddenException`: Tenant access denied

#### Frontend

- Network errors: Displayed with retry option
- Validation errors: Shown inline in forms
- AFIP errors: Detailed error message with error codes

### Error Messages

User-friendly messages in Spanish:

```typescript
// Stock validation
"Stock insuficiente para Coca Cola 500ml. Disponible: 5, Solicitado: 10"

// AFIP errors
"Error al generar factura AFIP: [error details]"

// Network errors
"Error de red. Verifica tu conexión."
```

## Testing

### Backend Tests

Located in `apps/api/src/modules/sales/tests/`

```bash
# Run all sales tests
pnpm --filter @retail/api test sales

# Run specific test file
pnpm --filter @retail/api test sales.service.spec.ts
```

Test coverage:
- Sale creation with stock validation
- AFIP invoice generation
- Stock updates (increment/decrement)
- Sale cancellation
- Multi-tenant isolation

### Frontend Tests

Located in `apps/web/src/components/pos/__tests__/`

```bash
# Run all POS tests
pnpm --filter @retail/web test pos

# Run with coverage
pnpm --filter @retail/web test --coverage
```

Test coverage:
- Cart store operations
- Component rendering
- User interactions
- API integration

## Security

### Authentication

All API endpoints require authentication via Bearer token:

```typescript
@UseGuards(AuthGuard, TenantGuard)
export class SalesController { ... }
```

### Multi-tenant Isolation

All queries filtered by tenantId from headers:

```typescript
const sales = await prisma.sale.findMany({
  where: { tenantId: req.headers['x-tenant-id'] }
});
```

### Input Validation

All DTOs validated using class-validator:

```typescript
export class CreateSaleDto {
  @IsUUID()
  locationId: string;

  @IsArray()
  @ValidateNested({ each: true })
  items: SaleItemDto[];
}
```

### SQL Injection Protection

Prisma ORM provides automatic protection against SQL injection.

## Performance

### Optimizations

1. **Database Indexes**: On frequently queried fields (tenantId, locationId, saleNumber)
2. **Pagination**: Default 50 items per page, max 100
3. **Select Projections**: Only fetch needed fields
4. **Transaction Batching**: Bulk operations in single transaction
5. **Caching**: Product data cached on frontend

### Load Testing

Recommended tool: Apache Bench or k6

```bash
# Test sale creation endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer $TOKEN" \
   -p sale.json -T application/json \
   http://localhost:3001/sales
```

## Monitoring

### Metrics to Track

- Sales per hour/day/month
- Average sale value
- Payment method distribution
- AFIP success rate
- Stock out frequency
- API response times

### Logging

All sales operations logged with context:

```typescript
this.logger.log(`Creating sale for tenant ${tenantId}, user ${userId}`);
this.logger.log(`Sale created: ${sale.id} (${sale.saleNumber})`);
this.logger.error('AFIP invoice generation failed', afipResponse.errors);
```

## Deployment

### Environment Variables

Required in `apps/api/.env`:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/kalynt"

# AFIP
AFIP_CERT_PATH="/path/to/cert.crt"
AFIP_KEY_PATH="/path/to/key.key"
AFIP_CUIT="20123456789"
AFIP_PRODUCTION=false

# App
PORT=3001
NODE_ENV=production
```

### Database Migrations

```bash
# Generate migration
pnpm --filter @retail/database db:generate

# Run migrations
pnpm --filter @retail/database db:migrate

# Seed test data
pnpm --filter @retail/database db:seed
```

### Build and Deploy

```bash
# Build all apps
pnpm build

# Start API
pnpm --filter @retail/api start:prod

# Start Web
pnpm --filter @retail/web start

# Start Mobile (development)
pnpm --filter @retail/mobile start
```

## Future Enhancements

### Planned Features

- [ ] Barcode scanner integration (mobile)
- [ ] Receipt thermal printer support
- [ ] Customer loyalty program integration
- [ ] Discounts and promotions engine
- [ ] Split payments (multiple payment methods per sale)
- [ ] Sale notes and custom fields
- [ ] Returns and refunds workflow
- [ ] Sales reports and analytics
- [ ] Integration with cash drawer
- [ ] Offline mode full sync (mobile)
- [ ] Multi-currency support
- [ ] Gift cards and vouchers

### API Extensions

- Bulk sale import/export
- Sale templates for common transactions
- Custom receipt templates
- Webhook notifications for sale events
- GraphQL API option

## Troubleshooting

### Common Issues

#### "Insufficient stock" error

**Cause**: Product stock is below requested quantity
**Solution**: Check stock levels, restock product, or reduce quantity

#### AFIP invoice generation fails

**Causes**:
- Invalid AFIP credentials
- AFIP server down
- Certificate expired
- Invalid customer CUIT

**Solutions**:
- Check AFIP server status: `GET /sales/afip/status`
- Verify certificate validity
- Validate customer CUIT format
- Check AFIP logs

#### Cart not persisting between sessions

**Cause**: localStorage/AsyncStorage disabled or corrupted
**Solution**: Clear browser storage and reload

#### Sale appears twice

**Cause**: Double submission (user clicking twice)
**Solution**: Button disabled during processing (already implemented)

### Debug Mode

Enable detailed logging:

```typescript
// Backend
LOG_LEVEL=debug pnpm start

// Frontend
NEXT_PUBLIC_DEBUG=true pnpm dev
```

## Support

### Documentation

- API Docs: `http://localhost:3001/api/docs` (Swagger)
- Component Storybook: `pnpm --filter @retail/ui storybook`

### Contact

For questions or issues:
- GitHub Issues: `https://github.com/yourorg/kalynt/issues`
- Email: support@kalynt.com

## License

Copyright © 2024 Kalynt. All rights reserved.
