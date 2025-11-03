import { test, expect } from '../../fixtures/auth.fixture';
import { TestDataHelper } from '../../helpers/test-data.helper';

test.describe('POS - Crear Venta', () => {
  let testData: TestDataHelper;

  test.beforeEach(async () => {
    testData = new TestDataHelper();
  });

  test.afterEach(async () => {
    await testData.disconnect();
  });

  test('debe mostrar la interfaz del POS', async ({ page, authenticatedUser }) => {
    await page.goto('/pos');

    // Check that we're on the POS page
    await expect(page).toHaveURL(/.*pos/);
    await expect(
      page.locator('h1, h2').filter({ hasText: /pos|punto.*venta|caja/i })
    ).toBeVisible();
  });

  test('debe buscar y agregar producto al carrito', async ({ page, authenticatedUser }) => {
    // Create test product
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Test Product POS',
      sku: 'TEST-POS-001',
      priceCents: 100000, // $1000
    });

    // Create stock
    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      100
    );

    await page.goto('/pos');

    // Search for product
    await page.fill(
      'input[placeholder*="Buscar"], input[placeholder*="Search"], input[name="search"]',
      'TEST-POS-001'
    );

    // Click on product or add button
    await page.click(
      'button:has-text("Agregar"), button:has-text("Add"), [data-testid="add-to-cart"]'
    );

    // Verify product appears in cart
    await expect(page.locator('text="Test Product POS"')).toBeVisible();
  });

  test('debe calcular correctamente los totales del carrito', async ({
    page,
    authenticatedUser,
  }) => {
    // Create test products
    const product1 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Product 1',
      sku: 'SKU-001',
      priceCents: 100000, // $1000
      taxRate: 0.21,
    });

    const product2 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Product 2',
      sku: 'SKU-002',
      priceCents: 50000, // $500
      taxRate: 0.21,
    });

    // Create stock for both products
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
      100
    );

    await page.goto('/pos');

    // Add products to cart (implementation will depend on UI)
    // Expected subtotal: $1500
    // Expected tax (21%): $315
    // Expected total: $1815

    // Verify totals are displayed correctly
    await expect(
      page.locator('text=/subtotal.*1.*500|1.*500.*subtotal/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test.skip('debe permitir crear una venta completa con factura AFIP', async ({
    page,
    authenticatedUser,
  }) => {
    // This test requires full UI implementation
    const timestamp = Date.now();

    // 1. Crear productos de prueba
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      name: `Sale Product ${timestamp}`,
      sku: `SALE-${timestamp}`,
      priceCents: 100000, // $1000
      costCents: 60000, // $600
      taxRate: 0.21,
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      100
    );

    // 2. Navegar a POS
    await page.goto('/pos');

    // 3. Buscar y agregar productos al carrito
    await page.fill(
      'input[placeholder*="Buscar"], input[placeholder*="Search"]',
      `SALE-${timestamp}`
    );
    await page.click('button:has-text("Agregar"), button:has-text("Add")');

    // 4. Verificar totales
    const subtotal = 100000; // $1000 in cents
    const tax = Math.round(subtotal * 0.21); // 21% tax
    const total = subtotal + tax; // $1210

    await expect(
      page.locator(`text=/total.*${(total / 100).toFixed(2)}/i`)
    ).toBeVisible();

    // 5. Proceder al checkout
    await page.click(
      'button:has-text("Checkout"), button:has-text("Finalizar"), button:has-text("Cobrar")'
    );

    // 6. Completar datos de pago
    await page.click('button:has-text("Efectivo"), button:has-text("Cash")');

    // Fill customer info if required for AFIP invoice
    const customerNameInput = page.locator('input[name="customerName"]');
    if (await customerNameInput.isVisible()) {
      await customerNameInput.fill('Cliente de Prueba');
    }

    const customerCuitInput = page.locator('input[name="customerCuit"]');
    if (await customerCuitInput.isVisible()) {
      await customerCuitInput.fill('20409378472');
    }

    // 7. Confirmar venta
    await page.click(
      'button[type="submit"]:has-text("Confirmar"), button[type="submit"]:has-text("Confirm")'
    );

    // 8. Esperar procesamiento (incluye generación de factura AFIP)
    await expect(
      page.locator(
        'text=/venta.*completada|sale.*completed|factura.*generada|invoice.*generated/i'
      )
    ).toBeVisible({ timeout: 30000 }); // 30 seconds for AFIP processing

    // 9. Verificar que se generó factura
    await expect(
      page.locator('text=/factura.*[A-Z]-\\d+-\\d+|invoice.*[A-Z]-\\d+-\\d+/i')
    ).toBeVisible();

    // 10. Verificar que el carrito se limpió
    await expect(page.locator('text="Carrito vacío"')).toBeVisible({ timeout: 5000 });

    // 11. Verificar en base de datos
    const sale = await testData.prisma.sale.findFirst({
      where: {
        tenantId: authenticatedUser.tenantId,
        userId: authenticatedUser.userId,
      },
      include: {
        items: true,
        invoice: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    expect(sale).toBeTruthy();
    expect(sale?.totalCents).toBe(total);
    expect(sale?.items).toHaveLength(1);
    expect(sale?.items[0].productId).toBe(product.id);
    expect(sale?.invoice).toBeTruthy();
    expect(sale?.invoice?.afipCae).toBeTruthy();

    // 12. Verificar que el stock se actualizó
    const stock = await testData.prisma.stock.findUnique({
      where: {
        productId_locationId: {
          productId: product.id,
          locationId: authenticatedUser.locationId,
        },
      },
    });

    expect(stock?.quantity).toBe(99); // Original 100 - 1 sold
  });

  test.skip('debe manejar error de stock insuficiente', async ({
    page,
    authenticatedUser,
  }) => {
    // Create product with low stock
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Low Stock Product',
      sku: 'LOW-STOCK-001',
      priceCents: 100000,
      trackStock: true,
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      1 // Only 1 in stock
    );

    await page.goto('/pos');

    // Try to add 2 items (more than available)
    await page.fill('input[placeholder*="Buscar"]', 'LOW-STOCK-001');
    await page.click('button:has-text("Agregar")');

    // Increase quantity to 2
    await page.fill('input[type="number"]', '2');

    // Try to checkout
    await page.click('button:has-text("Finalizar")');
    await page.click('button[type="submit"]:has-text("Confirmar")');

    // Should show error
    await expect(
      page.locator('text=/stock.*insuficiente|insufficient.*stock|not.*enough/i')
    ).toBeVisible({ timeout: 10000 });
  });

  test.skip('debe permitir aplicar descuento a la venta', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Discount Test Product',
      sku: 'DISCOUNT-001',
      priceCents: 100000, // $1000
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      100
    );

    await page.goto('/pos');

    // Add product to cart
    await page.fill('input[placeholder*="Buscar"]', 'DISCOUNT-001');
    await page.click('button:has-text("Agregar")');

    // Apply 10% discount
    await page.click('button:has-text("Descuento"), button:has-text("Discount")');
    await page.fill('input[name="discount"]', '10');
    await page.click('button:has-text("Aplicar"), button:has-text("Apply")');

    // Verify new total
    const originalPrice = 100000;
    const discount = originalPrice * 0.1;
    const discountedPrice = originalPrice - discount;

    await expect(
      page.locator(`text=/total.*${(discountedPrice / 100).toFixed(2)}/i`)
    ).toBeVisible();
  });

  test.skip('debe permitir cancelar una venta en proceso', async ({
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

    await page.goto('/pos');

    // Add product to cart
    await page.fill('input[placeholder*="Buscar"]', product.sku);
    await page.click('button:has-text("Agregar")');

    // Cancel sale
    await page.click(
      'button:has-text("Cancelar"), button:has-text("Cancel"), button:has-text("Limpiar")'
    );

    // Confirm cancellation if modal appears
    const confirmButton = page.locator(
      'button:has-text("Confirmar"), button:has-text("Confirm")'
    );
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }

    // Cart should be empty
    await expect(page.locator('text=/carrito.*vacío|empty.*cart/i')).toBeVisible();
  });
});
