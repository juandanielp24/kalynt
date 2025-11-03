import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('retail.db');

export function initDatabase() {
  try {
    // Products cache
    db.execSync(
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        sku TEXT NOT NULL,
        price_cents INTEGER NOT NULL,
        tax_rate REAL NOT NULL,
        synced_at INTEGER NOT NULL
      );`
    );

    // Pending sales (offline queue)
    db.execSync(
      `CREATE TABLE IF NOT EXISTS pending_sales (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );`
    );

    // Sync log
    db.execSync(
      `CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity TEXT NOT NULL,
        action TEXT NOT NULL,
        synced_at INTEGER NOT NULL
      );`
    );

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export function saveProductsCache(products: any[]) {
  try {
    const stmt = db.prepareSync(
      `INSERT OR REPLACE INTO products (id, name, sku, price_cents, tax_rate, synced_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    products.forEach((product) => {
      stmt.executeSync([
        product.id,
        product.name,
        product.sku,
        product.priceCents,
        product.taxRate,
        Date.now(),
      ]);
    });

    stmt.finalizeSync();
  } catch (error) {
    console.error('Error saving products cache:', error);
    throw error;
  }
}

export function getProductsCache(): any[] {
  try {
    const result = db.getAllSync('SELECT * FROM products ORDER BY name;');
    return result as any[];
  } catch (error) {
    console.error('Error getting products cache:', error);
    return [];
  }
}

export function savePendingSale(saleData: any) {
  try {
    const stmt = db.prepareSync(
      `INSERT INTO pending_sales (id, data, created_at)
       VALUES (?, ?, ?)`
    );

    stmt.executeSync([
      saleData.id,
      JSON.stringify(saleData),
      Date.now(),
    ]);

    stmt.finalizeSync();
  } catch (error) {
    console.error('Error saving pending sale:', error);
    throw error;
  }
}

export function getPendingSales(): any[] {
  try {
    const result = db.getAllSync(
      'SELECT * FROM pending_sales ORDER BY created_at;'
    );

    return (result as any[]).map((row) => ({
      ...row,
      data: JSON.parse(row.data),
    }));
  } catch (error) {
    console.error('Error getting pending sales:', error);
    return [];
  }
}

export function deletePendingSale(id: string) {
  try {
    const stmt = db.prepareSync('DELETE FROM pending_sales WHERE id = ?');
    stmt.executeSync([id]);
    stmt.finalizeSync();
  } catch (error) {
    console.error('Error deleting pending sale:', error);
    throw error;
  }
}
