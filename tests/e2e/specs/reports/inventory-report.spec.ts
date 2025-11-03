import { test, expect } from '../../fixtures/auth.fixture';
import { TestDataHelper } from '../../helpers/test-data.helper';

test.describe('Reportes - Inventario', () => {
  let testData: TestDataHelper;

  test.beforeEach(async () => {
    testData = new TestDataHelper();
  });

  test.afterEach(async () => {
    await testData.disconnect();
  });

  test('debe mostrar página de reportes de inventario', async ({
    page,
    authenticatedUser,
  }) => {
    await page.goto('/reports/inventory');

    // Check that we're on the inventory report page
    await expect(page).toHaveURL(/.*reports.*inventory/);
    await expect(
      page.locator('h1, h2').filter({ hasText: /inventario|inventory|stock/i })
    ).toBeVisible();
  });

  test.skip('debe mostrar lista de productos con stock actual', async ({
    page,
    authenticatedUser,
  }) => {
    // Create products with stock
    const product1 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Product with Stock',
      sku: 'STOCK-001',
    });

    const product2 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Product Low Stock',
      sku: 'STOCK-002',
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product1.id,
      authenticatedUser.locationId,
      100
    );

    await testData.createStock(
      authenticatedUser.tenantId,
      product2.id,
      authenticatedUser.locationId,
      5
    );

    await page.goto('/reports/inventory');

    // Should show both products
    await expect(page.locator('text="Product with Stock"')).toBeVisible();
    await expect(page.locator('text="Product Low Stock"')).toBeVisible();

    // Should show quantities
    await expect(page.locator('text=/100.*unidades|100.*units/i')).toBeVisible();
    await expect(page.locator('text=/5.*unidades|5.*units/i')).toBeVisible();
  });

  test.skip('debe filtrar productos con stock bajo', async ({
    page,
    authenticatedUser,
  }) => {
    const product1 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Normal Stock Product',
    });

    const product2 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Low Stock Product',
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product1.id,
      authenticatedUser.locationId,
      100
    );

    // Create with low stock (below minimum)
    await testData.createStock(
      authenticatedUser.tenantId,
      product2.id,
      authenticatedUser.locationId,
      5 // Below minQuantity of 10
    );

    await page.goto('/reports/inventory');

    // Filter by low stock
    await page.click(
      'button:has-text("Stock Bajo"), input[type="checkbox"][name="lowStock"]'
    );

    // Should show only low stock product
    await expect(page.locator('text="Low Stock Product"')).toBeVisible();
    await expect(page.locator('text="Normal Stock Product"')).not.toBeVisible();
  });

  test.skip('debe mostrar productos sin stock', async ({ page, authenticatedUser }) => {
    const product1 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'In Stock Product',
    });

    const product2 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Out of Stock Product',
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product1.id,
      authenticatedUser.locationId,
      50
    );

    await testData.createStock(
      authenticatedUser.tenantId,
      product2.id,
      authenticatedUser.locationId,
      0 // Out of stock
    );

    await page.goto('/reports/inventory');

    // Filter by out of stock
    await page.click('button:has-text("Sin Stock"), input[name="outOfStock"]');

    // Should show only out of stock product
    await expect(page.locator('text="Out of Stock Product"')).toBeVisible();
    await expect(page.locator('text=/stock.*0|0.*unidades/i')).toBeVisible();
  });

  test.skip('debe mostrar valor total del inventario', async ({
    page,
    authenticatedUser,
  }) => {
    const product1 = await testData.createProduct(authenticatedUser.tenantId, {
      costCents: 100000, // $1000 cost
      priceCents: 150000, // $1500 price
    });

    const product2 = await testData.createProduct(authenticatedUser.tenantId, {
      costCents: 50000, // $500 cost
      priceCents: 75000, // $750 price
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product1.id,
      authenticatedUser.locationId,
      10 // 10 units
    );

    await testData.createStock(
      authenticatedUser.tenantId,
      product2.id,
      authenticatedUser.locationId,
      20 // 20 units
    );

    await page.goto('/reports/inventory');

    // Total cost value: (10 * $1000) + (20 * $500) = $20,000
    // Total retail value: (10 * $1500) + (20 * $750) = $30,000
    await expect(page.locator('text=/valor.*costo.*20.*000|cost.*value.*20.*000/i')).toBeVisible();
    await expect(
      page.locator('text=/valor.*venta.*30.*000|retail.*value.*30.*000/i')
    ).toBeVisible();
  });

  test.skip('debe filtrar productos por categoría', async ({
    page,
    authenticatedUser,
  }) => {
    // Create categories
    const category1 = await testData.createCategory(authenticatedUser.tenantId, 'Electronics');
    const category2 = await testData.createCategory(authenticatedUser.tenantId, 'Clothing');

    // Create products in different categories
    const product1 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Laptop',
      categoryId: category1.id,
    });

    const product2 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'T-Shirt',
      categoryId: category2.id,
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product1.id,
      authenticatedUser.locationId,
      50
    );

    await testData.createStock(
      authenticatedUser.tenantId,
      product2.id,
      authenticatedUser.locationId,
      100
    );

    await page.goto('/reports/inventory');

    // Filter by category
    await page.selectOption('select[name="categoryId"]', category1.id);
    await page.click('button:has-text("Aplicar"), button:has-text("Filter")');

    // Should show only electronics
    await expect(page.locator('text="Laptop"')).toBeVisible();
    await expect(page.locator('text="T-Shirt"')).not.toBeVisible();
  });

  test.skip('debe filtrar productos por ubicación', async ({
    page,
    authenticatedUser,
  }) => {
    // Create second location
    const location2 = await testData.createLocation(authenticatedUser.tenantId, {
      name: 'Warehouse',
      type: 'warehouse',
    });

    const product = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Multi-location Product',
    });

    // Stock in location 1
    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      50
    );

    // Stock in location 2
    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      location2.id,
      75
    );

    await page.goto('/reports/inventory');

    // Filter by location 2
    await page.selectOption('select[name="locationId"]', location2.id);

    // Should show stock from location 2
    await expect(page.locator('text=/75.*unidades|75.*units/i')).toBeVisible();
  });

  test.skip('debe exportar reporte de inventario a Excel', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId);
    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      100
    );

    await page.goto('/reports/inventory');

    // Click export to Excel
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click(
        'button:has-text("Exportar"), button:has-text("Excel"), button:has-text("XLSX")'
      ),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.(xlsx|xls)$/i);
  });

  test.skip('debe mostrar movimientos de stock recientes', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId);

    // Create stock movements
    await testData.prisma.stockMovement.create({
      data: {
        tenantId: authenticatedUser.tenantId,
        productId: product.id,
        locationId: authenticatedUser.locationId,
        type: 'adjustment',
        quantity: 100,
        reason: 'Initial stock',
        userId: authenticatedUser.userId,
      },
    });

    await testData.prisma.stockMovement.create({
      data: {
        tenantId: authenticatedUser.tenantId,
        productId: product.id,
        locationId: authenticatedUser.locationId,
        type: 'sale',
        quantity: -5,
        reason: 'Sale',
        userId: authenticatedUser.userId,
      },
    });

    await page.goto('/reports/inventory');

    // Should show stock movements section
    await expect(
      page.locator('text=/movimientos.*recientes|recent.*movements/i')
    ).toBeVisible();

    // Should show both movements
    await expect(page.locator('text=/inicial.*100|initial.*100/i')).toBeVisible();
    await expect(page.locator('text=/venta.*5|sale.*5/i')).toBeVisible();
  });

  test.skip('debe calcular rotación de inventario', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      costCents: 100000,
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      50
    );

    // Create sales to calculate turnover
    const sale = await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId
    );

    await testData.createSaleItem(sale.id, product.id, { quantity: 10 });

    await page.goto('/reports/inventory');

    // Should show inventory turnover metrics
    await expect(
      page.locator('text=/rotación|turnover|días.*inventario|days.*inventory/i')
    ).toBeVisible();
  });

  test.skip('debe mostrar productos más vendidos', async ({
    page,
    authenticatedUser,
  }) => {
    const product1 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Best Seller',
    });

    const product2 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Slow Mover',
    });

    const sale = await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId
    );

    await testData.createSaleItem(sale.id, product1.id, { quantity: 50 });
    await testData.createSaleItem(sale.id, product2.id, { quantity: 2 });

    await page.goto('/reports/inventory');

    // Should show top sellers
    await expect(page.locator('text=/más.*vendidos|best.*sellers/i')).toBeVisible();
    await expect(page.locator('text="Best Seller"')).toBeVisible();
  });

  test.skip('debe mostrar productos con bajo movimiento', async ({
    page,
    authenticatedUser,
  }) => {
    const slowProduct = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Slow Moving Product',
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      slowProduct.id,
      authenticatedUser.locationId,
      100
    );

    // No sales for this product in recent period

    await page.goto('/reports/inventory');

    // Filter for slow-moving products
    await page.click('button:has-text("Bajo Movimiento"), input[name="slowMoving"]');

    await expect(page.locator('text="Slow Moving Product"')).toBeVisible();
  });

  test.skip('debe proyectar necesidades de reabastecimiento', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Restock Needed',
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      8 // Below minimum of 10
    );

    await page.goto('/reports/inventory');

    // Should show restock recommendations
    await expect(
      page.locator('text=/reabastecer|restock|replenish/i')
    ).toBeVisible();

    await expect(page.locator('text="Restock Needed"')).toBeVisible();
  });

  test.skip('debe mostrar historial de ajustes de inventario', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId);

    // Create stock adjustments
    await testData.prisma.stockMovement.create({
      data: {
        tenantId: authenticatedUser.tenantId,
        productId: product.id,
        locationId: authenticatedUser.locationId,
        type: 'adjustment',
        quantity: 10,
        reason: 'Found extra inventory',
        userId: authenticatedUser.userId,
      },
    });

    await testData.prisma.stockMovement.create({
      data: {
        tenantId: authenticatedUser.tenantId,
        productId: product.id,
        locationId: authenticatedUser.locationId,
        type: 'adjustment',
        quantity: -3,
        reason: 'Damaged goods',
        userId: authenticatedUser.userId,
      },
    });

    await page.goto('/reports/inventory');

    // View adjustments
    await page.click('button:has-text("Ajustes"), a[href*="adjustments"]');

    await expect(page.locator('text="Found extra inventory"')).toBeVisible();
    await expect(page.locator('text="Damaged goods"')).toBeVisible();
  });

  test.skip('debe calcular margen de ganancia promedio', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      costCents: 100000, // $1000 cost
      priceCents: 150000, // $1500 price
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      50
    );

    await page.goto('/reports/inventory');

    // Should show profit margin
    // Margin = ((price - cost) / price) * 100 = ((1500 - 1000) / 1500) * 100 = 33.33%
    await expect(page.locator('text=/margen.*33|margin.*33|profit.*33/i')).toBeVisible();
  });
});
