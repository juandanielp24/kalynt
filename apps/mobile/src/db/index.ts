import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite/next';
import * as schema from './schema';

const expoDb = openDatabaseSync('retail-pos.db');
export const db = drizzle(expoDb, { schema });

export async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Create tables if they don't exist
    await expoDb.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        sku TEXT NOT NULL,
        name TEXT NOT NULL,
        barcode TEXT,
        price_cents INTEGER NOT NULL,
        cost_cents INTEGER,
        tax_rate REAL DEFAULT 0.21,
        category_id TEXT,
        image_url TEXT,
        is_active INTEGER DEFAULT 1,
        synced_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS stock (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        location_id TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        synced_at INTEGER,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS local_sales (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        location_id TEXT NOT NULL,
        sale_number TEXT,
        subtotal_cents INTEGER NOT NULL,
        tax_cents INTEGER NOT NULL,
        discount_cents INTEGER DEFAULT 0,
        total_cents INTEGER NOT NULL,
        customer_name TEXT,
        customer_email TEXT,
        customer_cuit TEXT,
        customer_phone TEXT,
        payment_method TEXT NOT NULL,
        generate_invoice INTEGER DEFAULT 0,
        invoice_type TEXT,
        invoice_number TEXT,
        cae TEXT,
        sync_status TEXT NOT NULL DEFAULT 'pending',
        synced_at INTEGER,
        sync_error TEXT,
        server_id TEXT,
        notes TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS local_sale_items (
        id TEXT PRIMARY KEY,
        local_sale_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        product_name TEXT NOT NULL,
        product_sku TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price_cents INTEGER NOT NULL,
        tax_rate REAL NOT NULL,
        discount_percent REAL DEFAULT 0,
        total_cents INTEGER NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (local_sale_id) REFERENCES local_sales(id)
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        operation TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        attempts INTEGER DEFAULT 0,
        last_attempt INTEGER,
        error TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
      CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
      CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
      CREATE INDEX IF NOT EXISTS idx_local_sales_sync_status ON local_sales(sync_status);
      CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Helper to clear database (for testing)
export async function clearDatabase() {
  await expoDb.execAsync(`
    DELETE FROM products;
    DELETE FROM stock;
    DELETE FROM local_sales;
    DELETE FROM local_sale_items;
    DELETE FROM sync_queue;
    DELETE FROM sync_metadata;
  `);
}

// Helper to get database statistics
export async function getDatabaseStats() {
  const result = await expoDb.getAllAsync(`
    SELECT
      (SELECT COUNT(*) FROM products) as products_count,
      (SELECT COUNT(*) FROM local_sales WHERE sync_status = 'pending') as pending_sales,
      (SELECT COUNT(*) FROM local_sales WHERE sync_status = 'synced') as synced_sales
  `);

  return result[0];
}
