import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Products table (synced from server)
export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  sku: text('sku').notNull(),
  name: text('name').notNull(),
  barcode: text('barcode'),
  priceCents: integer('price_cents').notNull(),
  costCents: integer('cost_cents'),
  taxRate: real('tax_rate').default(0.21),
  categoryId: text('category_id'),
  imageUrl: text('image_url'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Stock table (synced from server)
export const stock = sqliteTable('stock', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  productId: text('product_id').notNull(),
  locationId: text('location_id').notNull(),
  quantity: integer('quantity').notNull().default(0),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Local sales (pending sync)
export const localSales = sqliteTable('local_sales', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  locationId: text('location_id').notNull(),
  saleNumber: text('sale_number'),

  // Totals
  subtotalCents: integer('subtotal_cents').notNull(),
  taxCents: integer('tax_cents').notNull(),
  discountCents: integer('discount_cents').default(0),
  totalCents: integer('total_cents').notNull(),

  // Customer
  customerName: text('customer_name'),
  customerEmail: text('customer_email'),
  customerCuit: text('customer_cuit'),
  customerPhone: text('customer_phone'),

  // Payment
  paymentMethod: text('payment_method').notNull(),

  // Invoice
  generateInvoice: integer('generate_invoice', { mode: 'boolean' }).default(false),
  invoiceType: text('invoice_type'),
  invoiceNumber: text('invoice_number'),
  cae: text('cae'),

  // Sync status
  syncStatus: text('sync_status').notNull().default('pending'), // pending, syncing, synced, error
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
  syncError: text('sync_error'),
  serverId: text('server_id'), // ID from server after sync

  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Local sale items
export const localSaleItems = sqliteTable('local_sale_items', {
  id: text('id').primaryKey(),
  localSaleId: text('local_sale_id').notNull(),
  productId: text('product_id').notNull(),
  productName: text('product_name').notNull(),
  productSku: text('product_sku').notNull(),
  quantity: integer('quantity').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  taxRate: real('tax_rate').notNull(),
  discountPercent: real('discount_percent').default(0),
  totalCents: integer('total_cents').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Sync queue for operations
export const syncQueue = sqliteTable('sync_queue', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull(),
  operation: text('operation').notNull(), // 'create_sale', 'update_stock', etc.
  entityType: text('entity_type').notNull(), // 'sale', 'stock', etc.
  entityId: text('entity_id').notNull(),
  payload: text('payload').notNull(), // JSON string
  status: text('status').notNull().default('pending'), // pending, processing, completed, failed
  attempts: integer('attempts').default(0),
  lastAttempt: integer('last_attempt', { mode: 'timestamp' }),
  error: text('error'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});

// Sync metadata
export const syncMetadata = sqliteTable('sync_metadata', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
});
