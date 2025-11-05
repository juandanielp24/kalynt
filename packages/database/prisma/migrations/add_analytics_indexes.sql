-- Índices para mejorar performance de analytics queries

-- Sales table indexes
-- Main index for tenant and date filtering (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_sales_tenant_date ON sales(tenant_id, sale_date);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_sales_status_date ON sales(status, sale_date);

-- Index for payment method analytics
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);

-- Composite index for optimal analytics queries
CREATE INDEX IF NOT EXISTS idx_sales_tenant_date_status ON sales(tenant_id, sale_date, status);

-- Sale items table indexes
-- Index for product analytics
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

-- Index for sale item lookups
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);

-- Composite index for common join queries
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_product ON sale_items(sale_id, product_id);

-- Products table indexes
-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- Index for active products filtering
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Index for tenant and category queries
CREATE INDEX IF NOT EXISTS idx_products_tenant_category ON products(tenant_id, category_id);

-- Stock table indexes
-- Index for low stock queries
CREATE INDEX IF NOT EXISTS idx_stock_quantity ON stock(quantity);

-- Composite index for product location stock queries
CREATE INDEX IF NOT EXISTS idx_stock_product_location ON stock(product_id, location_id);

-- Index for tenant stock queries
CREATE INDEX IF NOT EXISTS idx_stock_tenant ON stock(tenant_id);

-- Customer table indexes (if not already exists)
-- Index for tenant customer queries
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);

-- Index for customer activity
CREATE INDEX IF NOT EXISTS idx_customers_created ON customers(created_at);

-- Performance notes:
-- 1. idx_sales_tenant_date: Critical for date range queries (80% of analytics queries)
-- 2. idx_sales_tenant_date_status: Covers most common WHERE clause combinations
-- 3. idx_sale_items_product: Essential for top products and product analytics
-- 4. idx_products_category: Required for sales by category queries
-- 5. idx_stock_quantity: Speeds up low stock and out of stock queries

-- Monitoring query performance:
-- EXPLAIN ANALYZE SELECT ... to verify index usage
-- Check pg_stat_user_indexes for index usage statistics
