# Multi-Location Inventory Management System

Complete documentation for the multi-location inventory management system with stock transfers, analytics, and offline-first mobile support.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Frontend Components](#frontend-components)
- [Mobile Sync Strategy](#mobile-sync-strategy)
- [Workflows](#workflows)
- [Usage Examples](#usage-examples)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The multi-location inventory management system enables businesses to:

- Manage multiple physical locations (stores, warehouses, distribution centers)
- Transfer inventory between locations with full workflow management
- Track stock movements across all locations
- Get intelligent restock suggestions based on stock levels
- Analyze location performance and sales
- Sync data offline on mobile devices

### Key Features

✅ **Location Management**: Create and manage unlimited locations with different types
✅ **Stock Transfers**: Full workflow (PENDING → APPROVED → IN_TRANSIT → RECEIVED)
✅ **Real-time Analytics**: Sales comparison, stock distribution, performance metrics
✅ **Restock Suggestions**: Automatic detection of low stock with transfer recommendations
✅ **Offline-First Mobile**: Queue operations when offline, sync when connected
✅ **Role-Based Access**: Granular permissions for locations, transfers, and analytics
✅ **Audit Trail**: Complete timeline of all transfer status changes

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                   │
├──────────────┬──────────────────┬──────────────────────────┤
│   Locations  │  Stock Transfers │  Analytics & Restock     │
│   Management │     Workflow     │       Dashboards         │
└──────────────┴──────────────────┴──────────────────────────┘
                         ↓ REST API
┌─────────────────────────────────────────────────────────────┐
│                      Backend (NestJS)                        │
├──────────────┬──────────────────┬──────────────────────────┤
│   Locations  │  Stock Transfers │  Location Analytics      │
│   Service    │     Service      │       Service            │
└──────────────┴──────────────────┴──────────────────────────┘
                         ↓ Prisma ORM
┌─────────────────────────────────────────────────────────────┐
│                    Database (PostgreSQL)                     │
├──────────────┬──────────────────┬──────────────────────────┤
│   Location   │  StockTransfer   │   Stock & Movements      │
│   Product    │  TransferItems   │   Sales & Analytics      │
└──────────────┴──────────────────┴──────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                 │
├─────────────────────────────────────────────────────────────┤
│  Offline-First Sync Service with AsyncStorage & NetInfo     │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend (Web)**:
- Next.js 13+ with App Router
- TanStack Query for data fetching
- React Context for global state
- shadcn/ui component library
- Recharts for data visualization

**Backend (API)**:
- NestJS with TypeScript
- Prisma ORM
- PostgreSQL database
- JWT authentication
- Multi-tenancy support

**Mobile**:
- React Native with Expo
- AsyncStorage for offline data
- NetInfo for connectivity detection
- Sync queue with retry logic

## Database Schema

### Location Model

```prisma
model Location {
  id              String   @id @default(cuid())
  tenantId        String
  name            String
  code            String   @unique
  type            LocationType  // STORE, WAREHOUSE, DISTRIBUTION_CENTER
  address         String?
  city            String?
  province        String?
  postalCode      String?
  country         String    @default("Argentina")
  phone           String?
  email           String?
  managerId       String?
  isActive        Boolean   @default(true)
  isWarehouse     Boolean   @default(false)
  deletedAt       DateTime?

  // Relations
  tenant          Tenant    @relation(fields: [tenantId], references: [id])
  manager         User?     @relation(fields: [managerId], references: [id])
  stock           Stock[]
  transfersFrom   StockTransfer[] @relation("FromLocation")
  transfersTo     StockTransfer[] @relation("ToLocation")
  stockMovements  StockMovement[]
  sales           Sale[]
}
```

### StockTransfer Model

```prisma
model StockTransfer {
  id                  String        @id @default(cuid())
  tenantId            String
  transferNumber      String        @unique  // TRF-00001 format
  status              TransferStatus @default(PENDING)

  // Locations
  fromLocationId      String
  toLocationId        String

  // Workflow tracking
  requestedById       String
  requestedAt         DateTime      @default(now())
  approvedById        String?
  approvedAt          DateTime?
  sentById            String?
  sentAt              DateTime?
  receivedById        String?
  receivedAt          DateTime?
  rejectedAt          DateTime?
  cancelledAt         DateTime?

  // Transfer details
  shippingMethod      String?
  trackingNumber      String?
  estimatedArrival    DateTime?
  notes               String?
  internalNotes       String?
  rejectionReason     String?
  cancellationReason  String?

  // Relations
  tenant              Tenant        @relation(fields: [tenantId], references: [id])
  fromLocation        Location      @relation("FromLocation", fields: [fromLocationId], references: [id])
  toLocation          Location      @relation("ToLocation", fields: [toLocationId], references: [id])
  requestedBy         User          @relation("RequestedTransfers", fields: [requestedById], references: [id])
  approvedBy          User?         @relation("ApprovedTransfers", fields: [approvedById], references: [id])
  sentBy              User?         @relation("SentTransfers", fields: [sentById], references: [id])
  receivedBy          User?         @relation("ReceivedTransfers", fields: [receivedById], references: [id])
  items               StockTransferItem[]
  stockMovements      StockMovement[]
}

enum TransferStatus {
  PENDING
  APPROVED
  REJECTED
  IN_TRANSIT
  RECEIVED
  CANCELLED
}
```

### StockTransferItem Model

```prisma
model StockTransferItem {
  id                String         @id @default(cuid())
  transferId        String
  productId         String

  // Snapshot data
  productName       String
  productSku        String

  // Quantities
  quantityRequested Int
  quantitySent      Int?
  quantityReceived  Int?

  notes             String?

  // Relations
  transfer          StockTransfer  @relation(fields: [transferId], references: [id], onDelete: Cascade)
  product           Product        @relation(fields: [productId], references: [id])
}
```

## API Reference

### Locations API

#### GET /locations
Get all locations for the tenant.

**Query Parameters:**
- `includeInactive` (boolean): Include inactive locations
- `type` (string): Filter by location type (STORE, WAREHOUSE, DISTRIBUTION_CENTER)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx",
      "name": "Main Warehouse",
      "code": "WH-001",
      "type": "WAREHOUSE",
      "isActive": true,
      "isWarehouse": true,
      "manager": {
        "id": "clyyy",
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  ]
}
```

#### POST /locations
Create a new location.

**Request Body:**
```json
{
  "name": "Downtown Store",
  "code": "ST-001",
  "type": "STORE",
  "address": "123 Main St",
  "city": "Buenos Aires",
  "province": "Buenos Aires",
  "postalCode": "1000",
  "country": "Argentina",
  "phone": "+54 11 1234-5678",
  "email": "store@example.com",
  "managerId": "clyyy",
  "isWarehouse": false
}
```

**Permissions Required:** `LOCATIONS:CREATE`

#### PUT /locations/:id
Update a location.

**Permissions Required:** `LOCATIONS:UPDATE`

#### DELETE /locations/:id
Soft delete a location.

**Permissions Required:** `LOCATIONS:DELETE`

### Stock Transfers API

#### GET /stock-transfers
Get all transfers with pagination and filters.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50)
- `status` (TransferStatus): Filter by status
- `fromLocationId` (string): Filter by source location
- `toLocationId` (string): Filter by destination location
- `startDate` (ISO date): Filter by request date (from)
- `endDate` (ISO date): Filter by request date (to)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "totalPages": 3
  }
}
```

#### POST /stock-transfers
Create a new transfer request.

**Request Body:**
```json
{
  "fromLocationId": "clxxx",
  "toLocationId": "clyyy",
  "items": [
    {
      "productId": "clzzz",
      "quantityRequested": 20,
      "notes": "Urgent restock"
    }
  ],
  "shippingMethod": "Express",
  "estimatedArrival": "2025-11-10T10:00:00Z",
  "notes": "Handle with care",
  "internalNotes": "Customer order fulfillment"
}
```

**Validation:**
- Source and destination must be different
- Both locations must exist and be active
- All products must exist
- Sufficient stock must be available at source

**Permissions Required:** `STOCK_MOVEMENTS:CREATE`

#### POST /stock-transfers/:id/approve
Approve a pending transfer.

**Request Body:**
```json
{
  "notes": "Approved by warehouse manager"
}
```

**Requirements:**
- Transfer must be in PENDING status
- Stock availability is re-validated

**Permissions Required:** `STOCK_MOVEMENTS:APPROVE`

#### POST /stock-transfers/:id/reject
Reject a pending transfer.

**Request Body:**
```json
{
  "rejectionReason": "Insufficient warehouse capacity"
}
```

**Permissions Required:** `STOCK_MOVEMENTS:APPROVE`

#### POST /stock-transfers/:id/send
Mark transfer as sent and process stock removal.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "clzzz",
      "quantitySent": 18
    }
  ],
  "trackingNumber": "TRACK-123456",
  "shippingMethod": "Express Courier",
  "notes": "Dispatched at 14:00"
}
```

**Stock Movements Created:**
- TRANSFER_OUT movements at source location (negative quantities)
- Stock decremented at source

**Permissions Required:** `STOCK_MOVEMENTS:SEND`

#### POST /stock-transfers/:id/receive
Mark transfer as received and process stock addition.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "clzzz",
      "quantityReceived": 17
    }
  ],
  "notes": "1 unit damaged during transit"
}
```

**Stock Movements Created:**
- TRANSFER_IN movements at destination location (positive quantities)
- Stock incremented at destination
- Creates stock record if it doesn't exist

**Permissions Required:** `STOCK_MOVEMENTS:RECEIVE`

#### POST /stock-transfers/:id/cancel
Cancel a pending or approved transfer.

**Request Body:**
```json
{
  "cancellationReason": "No longer needed"
}
```

**Requirements:**
- Transfer must be PENDING or APPROVED (cannot cancel IN_TRANSIT or RECEIVED)

**Permissions Required:** `STOCK_MOVEMENTS:CANCEL`

#### GET /stock-transfers/stats
Get transfer statistics.

**Query Parameters:**
- `locationId` (string): Filter by location (transfers from or to this location)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTransfers": 247,
    "byStatus": {
      "pending": 12,
      "approved": 5,
      "inTransit": 8,
      "received": 215,
      "cancelled": 4,
      "rejected": 3
    }
  }
}
```

#### GET /stock-transfers/:locationId/restock-suggestions
Get intelligent restock suggestions for a location.

**How it works:**
1. Finds all products where `quantity <= minQuantity`
2. For each low stock product, finds other locations with available stock
3. Prioritizes warehouses over stores
4. Sorts by quantity available (descending)

**Response:**
```json
{
  "success": true,
  "data": {
    "location": {
      "id": "clxxx",
      "name": "Downtown Store",
      "code": "ST-001"
    },
    "suggestions": [
      {
        "product": {
          "id": "clzzz",
          "name": "Widget A",
          "sku": "WGT-001"
        },
        "currentQuantity": 5,
        "minQuantity": 20,
        "neededQuantity": 15,
        "suggestedSources": [
          {
            "locationId": "clyyy",
            "locationName": "Main Warehouse",
            "locationCode": "WH-001",
            "availableQuantity": 500,
            "isWarehouse": true
          }
        ]
      }
    ]
  }
}
```

### Location Analytics API

#### GET /location-analytics/sales-comparison
Compare sales across all locations.

**Query Parameters:**
- `startDate` (ISO date): Default: 30 days ago
- `endDate` (ISO date): Default: now

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "location": {
        "id": "clxxx",
        "name": "Downtown Store",
        "code": "ST-001"
      },
      "totalSales": 125340.50,
      "salesCount": 423,
      "averageSale": 296.35
    }
  ]
}
```

**Permissions Required:** `ANALYTICS:READ`

#### GET /location-analytics/stock-distribution
Get stock distribution across locations.

**Query Parameters:**
- `productId` (string, optional): Filter by specific product

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "location": {
        "id": "clxxx",
        "name": "Main Warehouse",
        "code": "WH-001",
        "type": "WAREHOUSE"
      },
      "quantity": 15420,
      "productsCount": 234,
      "percentage": 65.3
    }
  ]
}
```

#### GET /location-analytics/locations/:locationId/performance
Get comprehensive performance metrics for a location.

**Query Parameters:**
- `days` (number): Time period (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "sales": {
      "total": 85340.25,
      "count": 287,
      "average": 297.35,
      "growth": 12.5,
      "countGrowth": 8.3
    },
    "stock": {
      "totalProducts": 156,
      "totalUnits": 2340,
      "lowStock": 12,
      "outOfStock": 3
    },
    "transfers": {
      "incoming": 15,
      "outgoing": 8,
      "total": 23
    }
  }
}
```

## Frontend Components

### LocationContext

Global state management for current location and locations list.

**Usage:**
```tsx
import { useLocation } from '@/contexts/LocationContext';

function MyComponent() {
  const { currentLocation, locations, setCurrentLocation, isLoading, refetch } = useLocation();

  return (
    <div>
      <p>Current: {currentLocation?.name}</p>
      <select onChange={(e) => {
        const location = locations.find(l => l.id === e.target.value);
        if (location) setCurrentLocation(location);
      }}>
        {locations.map(loc => (
          <option key={loc.id} value={loc.id}>{loc.name}</option>
        ))}
      </select>
    </div>
  );
}
```

### LocationSelector Component

Dropdown to switch between locations with visual indicators.

**Props:**
```tsx
interface LocationSelectorProps {
  // No props required - uses LocationContext
}
```

**Features:**
- Shows warehouse icon for warehouses, map pin for stores
- Auto-hides dropdown if only one location exists
- Persists selection to localStorage

### CreateTransferDialog Component

Complex dialog for creating stock transfers.

**Features:**
- Source/destination location selection
- Product search with real-time stock validation
- Multiple products per transfer
- Quantity validation (cannot exceed available stock)
- Shipping information (method, tracking, estimated arrival)

### Transfer Detail Page

Full transfer view with workflow actions.

**Location:** `/inventory/transfers/[id]`

**Features:**
- Status badge with color coding
- Locations information cards
- Products table with quantities (requested/sent/received)
- Shipping information display
- Timeline sidebar showing all status changes
- Action buttons based on current status and permissions
- Real-time updates via TanStack Query

### Restock Suggestions Page

Intelligent restock recommendations.

**Location:** `/inventory/restock`

**Features:**
- Location selector
- Stats cards (low stock count, units needed, selected count)
- Product cards showing current/min/needed quantities
- Available sources with stock levels
- Bulk checkbox selection
- Create transfers button (creates one transfer per source location)

### Location Analytics Dashboard

**Location:** `/analytics/locations`

**Features:**
- Date range selector (7/30/90 days)
- Summary cards (total sales, active locations, top performer, average ticket)
- Three tabs:
  - **Sales by Location**: Bar charts for total sales, sales count, average ticket
  - **Stock Distribution**: Pie chart and detailed list
  - **Detailed Comparison**: Location cards with metrics and percentage of total

## Mobile Sync Strategy

### Offline-First Architecture

The mobile app uses an offline-first approach where all operations can be performed offline and automatically sync when online.

### LocationSyncService

**Key Features:**
- AsyncStorage for local caching
- NetInfo for connectivity detection
- Sync queue with retry logic (max 3 retries)
- Auto-sync every 5 minutes when online
- Immediate sync when network restored

**Usage:**
```typescript
import { locationSyncService } from '@/lib/sync/location-sync.service';

// Start auto-sync
locationSyncService.startAutoSync();

// Create transfer offline
const result = await locationSyncService.createTransferOffline({
  fromLocationId: 'clxxx',
  toLocationId: 'clyyy',
  items: [{ productId: 'clzzz', quantityRequested: 10 }],
});

if (result.offline) {
  // Operation queued for sync
  console.log('Transfer queued, will sync when online');
} else {
  // Operation completed immediately
  console.log('Transfer created:', result.transferId);
}

// Check sync queue status
const status = await locationSyncService.getSyncQueueStatus();
console.log(`${status.total} items pending sync`);

// Force sync now
await locationSyncService.forceSync();

// Get cached data
const locations = await locationSyncService.getCachedLocations();
const transfers = await locationSyncService.getCachedTransfers();
```

### Sync Queue Structure

```typescript
interface SyncQueueItem {
  id: string;
  type: 'CREATE_TRANSFER' | 'APPROVE_TRANSFER' | 'SEND_TRANSFER' | 'RECEIVE_TRANSFER';
  data: any;
  timestamp: number;
  retries: number;
  error?: string;
}
```

### Network Status Handling

```typescript
// Check if online
if (locationSyncService.isConnected()) {
  // Perform online-only operations
}

// Auto-sync triggers when network restored
// No manual intervention needed
```

## Workflows

### Complete Transfer Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                         TRANSFER LIFECYCLE                       │
└─────────────────────────────────────────────────────────────────┘

1. CREATE (PENDING)
   ├─ User creates transfer request
   ├─ System validates locations exist
   ├─ System validates products exist
   ├─ System validates stock availability
   ├─ Generates transfer number (TRF-00001)
   └─ Status: PENDING

2. APPROVE (APPROVED)
   ├─ Manager reviews transfer
   ├─ System re-validates stock availability
   ├─ Records approver and timestamp
   ├─ Can add approval notes
   └─ Status: APPROVED

   OR

2. REJECT (REJECTED)
   ├─ Manager rejects transfer
   ├─ Must provide rejection reason
   ├─ Records rejector and timestamp
   └─ Status: REJECTED (END)

3. SEND (IN_TRANSIT)
   ├─ Warehouse processes transfer
   ├─ Can adjust quantities sent
   ├─ System creates TRANSFER_OUT movements
   ├─ Stock decremented at source
   ├─ Can add tracking number
   └─ Status: IN_TRANSIT

4. RECEIVE (RECEIVED)
   ├─ Destination receives transfer
   ├─ Can adjust quantities received
   ├─ System creates TRANSFER_IN movements
   ├─ Stock incremented at destination
   ├─ Creates stock record if needed
   └─ Status: RECEIVED (END)

CANCEL (CANCELLED)
   ├─ Can cancel if PENDING or APPROVED
   ├─ Cannot cancel IN_TRANSIT or RECEIVED
   ├─ Must provide cancellation reason
   └─ Status: CANCELLED (END)
```

### Restock Workflow

```
1. DETECTION
   ├─ System monitors stock levels
   ├─ Identifies products where quantity <= minQuantity
   └─ Calculates needed quantity

2. SUGGESTION
   ├─ Finds locations with available stock
   ├─ Prioritizes warehouses
   ├─ Sorts by quantity (descending)
   └─ Presents suggestions to user

3. AUTO-TRANSFER CREATION
   ├─ User selects products
   ├─ System groups by source location
   ├─ Creates one transfer per source
   ├─ Quantities limited by available stock
   └─ Status: PENDING (follows normal workflow)
```

### Stock Movement Tracking

Every transfer creates detailed stock movements:

**On SEND:**
```json
{
  "type": "TRANSFER_OUT",
  "locationId": "source-location-id",
  "quantity": -20,
  "previousQuantity": 100,
  "newQuantity": 80,
  "reason": "Transfer to Downtown Store (TRF-00042)",
  "transferId": "clxxx"
}
```

**On RECEIVE:**
```json
{
  "type": "TRANSFER_IN",
  "locationId": "destination-location-id",
  "quantity": 20,
  "previousQuantity": 15,
  "newQuantity": 35,
  "reason": "Transfer from Main Warehouse (TRF-00042)",
  "transferId": "clxxx"
}
```

## Usage Examples

### Example 1: Creating a Location

```typescript
// API call
const response = await locationsApi.createLocation({
  name: "North Branch",
  code: "NB-001",
  type: "STORE",
  address: "789 North Ave",
  city: "Córdoba",
  province: "Córdoba",
  postalCode: "5000",
  country: "Argentina",
  phone: "+54 351 1234-5678",
  managerId: "clxxx",
  isWarehouse: false,
});

console.log('Location created:', response.data.id);
```

### Example 2: Creating and Completing a Transfer

```typescript
// 1. Create transfer
const transfer = await locationsApi.createTransfer({
  fromLocationId: 'warehouse-id',
  toLocationId: 'store-id',
  items: [
    { productId: 'product-1-id', quantityRequested: 50 },
    { productId: 'product-2-id', quantityRequested: 30 },
  ],
  shippingMethod: 'Ground',
  notes: 'Weekly restock',
});

const transferId = transfer.data.id;

// 2. Approve
await locationsApi.approveTransfer(transferId, 'Approved for shipment');

// 3. Send
await locationsApi.sendTransfer(transferId, {
  trackingNumber: 'TRACK-123',
  shippingMethod: 'Express',
});

// 4. Receive
await locationsApi.receiveTransfer(transferId);
```

### Example 3: Getting Restock Suggestions

```typescript
// Get suggestions for a store
const suggestions = await locationsApi.getRestockSuggestions('store-id');

console.log(`Found ${suggestions.data.suggestions.length} low stock products`);

for (const suggestion of suggestions.data.suggestions) {
  console.log(`${suggestion.product.name}:`);
  console.log(`  Current: ${suggestion.currentQuantity}`);
  console.log(`  Minimum: ${suggestion.minQuantity}`);
  console.log(`  Needed: ${suggestion.neededQuantity}`);
  console.log(`  Available from ${suggestion.suggestedSources.length} locations`);
}
```

### Example 4: Location Performance Analytics

```typescript
// Get 90-day performance for a location
const performance = await apiClient.get(
  `/location-analytics/locations/${locationId}/performance`,
  { params: { days: 90 } }
);

const { sales, stock, transfers } = performance.data.data;

console.log(`Sales Growth: ${sales.growth.toFixed(1)}%`);
console.log(`Low Stock Items: ${stock.lowStock}`);
console.log(`Total Transfers: ${transfers.total}`);
```

### Example 5: Offline Mobile Transfer

```typescript
// Mobile app - create transfer offline
const result = await locationSyncService.createTransferOffline({
  fromLocationId: warehouseId,
  toLocationId: storeId,
  items: [{ productId, quantityRequested: 10 }],
  notes: 'Created offline',
});

if (result.offline) {
  // Show offline indicator
  Alert.alert(
    'Queued for Sync',
    'Transfer will be created when you reconnect'
  );
} else {
  // Show success
  Alert.alert('Success', `Transfer ${result.transferId} created`);
}
```

## Testing

### Running Backend Unit Tests

```bash
# Run all tests
npm test

# Run location module tests
npm test -- stock-transfers.service.spec.ts

# Run with coverage
npm test -- --coverage
```

### Running E2E Tests

```bash
# Install Playwright browsers (first time)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run location tests only
npm run test:e2e -- specs/locations

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Debug mode
npm run test:e2e -- --debug
```

### Test Coverage

**Backend Unit Tests:** `/apps/api/src/modules/locations/__tests__/stock-transfers.service.spec.ts`

Covers:
- ✅ Transfer number generation
- ✅ Create transfer with validation
- ✅ Approve transfer workflow
- ✅ Send transfer with stock movements
- ✅ Receive transfer with stock creation
- ✅ Restock suggestions algorithm
- ✅ Transfer statistics
- ✅ Error handling

**E2E Tests:** `/tests/e2e/specs/locations/transfers-flow.spec.ts`

Covers:
- ✅ Complete transfer lifecycle
- ✅ Partial quantities handling
- ✅ Reject and cancel flows
- ✅ Restock suggestions UI
- ✅ Auto-transfer creation
- ✅ Insufficient stock validation
- ✅ Transfer statistics and filters
- ✅ Timeline visualization

## Troubleshooting

### Transfer Creation Fails: "Insufficient stock"

**Problem:** Cannot create transfer even though stock appears available.

**Solutions:**
1. Verify stock at source location:
   ```bash
   GET /stock?productId={id}&locationId={sourceId}
   ```
2. Check for pending transfers that haven't been sent yet (stock may be reserved)
3. Ensure stock records exist (quantity > 0)
4. Verify tenantId matches (multi-tenant isolation)

### Transfer Stuck in PENDING Status

**Problem:** Transfer remains pending, cannot approve.

**Solutions:**
1. Check user permissions: `STOCK_MOVEMENTS:APPROVE` required
2. Verify stock availability hasn't changed:
   - Another transfer may have depleted stock
   - Sales may have reduced stock
3. Check transfer detail page for validation errors
4. Review transfer items to ensure products still exist

### Mobile Sync Queue Growing

**Problem:** Sync queue has many items that aren't processing.

**Solutions:**
1. Check network connectivity:
   ```typescript
   console.log('Online:', locationSyncService.isConnected());
   ```
2. Review error messages in queue items:
   ```typescript
   const status = await locationSyncService.getSyncQueueStatus();
   status.items.forEach(item => {
     if (item.error) console.log(`${item.type}: ${item.error}`);
   });
   ```
3. Clear failed items after max retries:
   ```typescript
   await locationSyncService.clearCache(); // Clears entire queue
   ```
4. Check API endpoint availability
5. Verify auth token is valid

### Analytics Not Showing Data

**Problem:** Analytics dashboard shows no data or zero values.

**Solutions:**
1. Verify date range: Default is last 30 days
   - Adjust date range selector
   - Check if data exists in selected period
2. Check sales status filter: Only non-VOIDED sales count
3. Verify location has sales/stock records
4. Ensure user has `ANALYTICS:READ` permission
5. Check browser console for API errors

### Stock Discrepancies After Transfer

**Problem:** Stock levels don't match expected values after receiving transfer.

**Solutions:**
1. Review stock movements:
   ```bash
   GET /stock-movements?locationId={id}&transferId={transferId}
   ```
2. Check received quantity vs sent quantity
   - May have recorded damaged/lost items
   - Review transfer notes for explanation
3. Verify no concurrent stock adjustments:
   - Check stock movement history
   - Look for ADJUSTMENT type movements
4. Ensure transfer wasn't duplicated:
   ```bash
   GET /stock-transfers?toLocationId={id}&status=RECEIVED
   ```

### Permission Denied Errors

**Problem:** User cannot perform actions despite being logged in.

**Solutions:**
1. Verify user role has required permissions:
   - `LOCATIONS:CREATE` - Create locations
   - `STOCK_MOVEMENTS:CREATE` - Create transfers
   - `STOCK_MOVEMENTS:APPROVE` - Approve/reject transfers
   - `STOCK_MOVEMENTS:SEND` - Send transfers
   - `STOCK_MOVEMENTS:RECEIVE` - Receive transfers
   - `ANALYTICS:READ` - View analytics
2. Check if user's role is active
3. Verify tenant context is correct
4. Review permission guards in code:
   ```tsx
   <PermissionGuard resource="STOCK_MOVEMENTS" action="CREATE">
     {/* Content */}
   </PermissionGuard>
   ```

### Transfer Number Conflicts

**Problem:** Duplicate transfer numbers or incorrect sequence.

**Solutions:**
1. Check transfer number generation query:
   - Should order by `createdAt DESC`
   - Should filter by tenantId
2. Verify database transaction isolation:
   - May need `SERIALIZABLE` for high-concurrency environments
3. Consider using database sequences:
   ```sql
   CREATE SEQUENCE transfer_sequence START 1;
   ```
4. Add unique constraint if missing:
   ```prisma
   transferNumber String @unique
   ```

## Best Practices

### Location Management

1. **Use meaningful codes**: `WH-001`, `ST-NYC`, `DC-WEST`
2. **Set realistic minimum stock levels**: Based on sales velocity and lead time
3. **Designate warehouses**: Set `isWarehouse: true` for central distribution
4. **Assign managers**: Improves accountability and notifications
5. **Regular audits**: Verify stock matches physical inventory

### Transfer Workflow

1. **Approve promptly**: Delays cause stock uncertainty
2. **Update quantities accurately**: Record actual sent/received amounts
3. **Use tracking numbers**: Helps locate delayed shipments
4. **Add detailed notes**: Explain variances and special handling
5. **Batch small transfers**: Reduce shipping costs and complexity

### Stock Management

1. **Set appropriate minimums**:
   - High-velocity items: 7-14 days supply
   - Medium-velocity: 14-30 days supply
   - Low-velocity: 30-60 days supply
2. **Monitor restock suggestions daily**: Prevent stockouts
3. **Balance warehouse distribution**:
   - Central warehouse: 60-70% of total stock
   - Stores: 30-40% of total stock
4. **Use analytics to optimize**: Review slow-moving stock, redistribute

### Performance Optimization

1. **Enable query caching**: TanStack Query automatic caching
2. **Paginate large lists**: Default 50 items per page
3. **Use lazy loading**: Load transfer details on demand
4. **Batch API calls**: Use Promise.all for parallel requests
5. **Index database fields**: Ensure indexes on frequently queried fields

### Security

1. **Enforce permissions**: Always use PermissionGuard components
2. **Validate tenant context**: Prevent cross-tenant data leaks
3. **Audit critical actions**: Log approvals, sends, receives
4. **Secure mobile sync**: Use encrypted AsyncStorage
5. **Rotate API tokens**: Implement token refresh

### Mobile Sync

1. **Monitor queue size**: Alert if > 50 pending items
2. **Handle conflicts**: Implement version-based conflict resolution
3. **Limit cache size**: Clear old transfers periodically
4. **Test offline scenarios**: Airplane mode, poor connectivity
5. **Provide sync status UI**: Show pending operations count

---

## Support

For additional help:

- **Issues:** [GitHub Issues](https://github.com/your-org/retail-system/issues)
- **Documentation:** [Full Docs](https://docs.your-system.com)
- **API Reference:** [Swagger/OpenAPI](https://api.your-system.com/docs)

## Version History

- **v1.0.0** (2025-11-04): Initial release
  - Multi-location management
  - Stock transfer workflow
  - Location analytics
  - Mobile offline sync
  - Restock suggestions

---

**Last Updated:** November 4, 2025
**Contributors:** Development Team
