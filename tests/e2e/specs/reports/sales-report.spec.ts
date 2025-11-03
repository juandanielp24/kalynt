import { test, expect } from '../../fixtures/auth.fixture';
import { TestDataHelper } from '../../helpers/test-data.helper';

test.describe('Reportes - Ventas', () => {
  let testData: TestDataHelper;

  test.beforeEach(async () => {
    testData = new TestDataHelper();
  });

  test.afterEach(async () => {
    await testData.disconnect();
  });

  test('debe mostrar página de reportes de ventas', async ({ page, authenticatedUser }) => {
    await page.goto('/reports/sales');

    // Check that we're on the sales report page
    await expect(page).toHaveURL(/.*reports.*sales/);
    await expect(
      page.locator('h1, h2').filter({ hasText: /ventas|sales|reportes/i })
    ).toBeVisible();
  });

  test('debe tener filtros de fecha disponibles', async ({ page, authenticatedUser }) => {
    await page.goto('/reports/sales');

    // Should have date filters
    await expect(
      page.locator('input[type="date"], input[name*="date"], input[placeholder*="Fecha"]')
    ).toBeVisible();
  });

  test.skip('debe mostrar ventas del día actual por defecto', async ({
    page,
    authenticatedUser,
  }) => {
    // Create test sales for today
    const product = await testData.createProduct(authenticatedUser.tenantId);
    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      100
    );

    const sale1 = await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId,
      {
        totalCents: 100000,
        status: 'completed',
      }
    );

    const sale2 = await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId,
      {
        totalCents: 150000,
        status: 'completed',
      }
    );

    await page.goto('/reports/sales');

    // Should show both sales
    await expect(page.locator(`text="${sale1.saleNumber}"`)).toBeVisible();
    await expect(page.locator(`text="${sale2.saleNumber}"`)).toBeVisible();

    // Should show total
    const expectedTotal = (100000 + 150000) / 100; // $2500
    await expect(
      page.locator(`text=/total.*${expectedTotal.toFixed(2)}/i`)
    ).toBeVisible();
  });

  test.skip('debe filtrar ventas por rango de fechas', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId);

    // Create sales from different dates
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId,
      {
        totalCents: 100000,
        status: 'completed',
        // In reality, we'd need to manually set createdAt in a different way
      }
    );

    await page.goto('/reports/sales');

    // Set date range filter
    const startDate = lastWeek.toISOString().split('T')[0];
    const endDate = yesterday.toISOString().split('T')[0];

    await page.fill('input[name="startDate"]', startDate);
    await page.fill('input[name="endDate"]', endDate);
    await page.click('button:has-text("Aplicar"), button:has-text("Filter"), button[type="submit"]');

    // Should show filtered results
    await expect(page.locator('[data-testid="sale-row"]')).toHaveCount(1);
  });

  test.skip('debe mostrar resumen de ventas por método de pago', async ({
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

    // Create sales with different payment methods
    await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId,
      {
        totalCents: 100000,
        paymentMethod: 'cash',
      }
    );

    await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId,
      {
        totalCents: 150000,
        paymentMethod: 'debit_card',
      }
    );

    await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId,
      {
        totalCents: 200000,
        paymentMethod: 'credit_card',
      }
    );

    await page.goto('/reports/sales');

    // Should show breakdown by payment method
    await expect(page.locator('text=/efectivo.*1.*000/i')).toBeVisible();
    await expect(page.locator('text=/débito.*1.*500/i')).toBeVisible();
    await expect(page.locator('text=/crédito.*2.*000/i')).toBeVisible();
  });

  test.skip('debe mostrar ventas por ubicación', async ({ page, authenticatedUser }) => {
    // Create second location
    const location2 = await testData.createLocation(authenticatedUser.tenantId, {
      name: 'Sucursal 2',
      type: 'store',
    });

    const product = await testData.createProduct(authenticatedUser.tenantId);

    // Create sales in different locations
    await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId,
      {
        totalCents: 100000,
      }
    );

    await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      location2.id,
      {
        totalCents: 200000,
      }
    );

    await page.goto('/reports/sales');

    // Filter by location
    await page.selectOption('select[name="locationId"]', location2.id);
    await page.click('button:has-text("Aplicar"), button:has-text("Filter")');

    // Should show only sales from location 2
    await expect(page.locator('text=/total.*2.*000/i')).toBeVisible();
  });

  test.skip('debe exportar reporte a CSV', async ({ page, authenticatedUser }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId);
    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      100
    );

    await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId,
      {
        totalCents: 100000,
      }
    );

    await page.goto('/reports/sales');

    // Click export button
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("Exportar"), button:has-text("Export"), button:has-text("CSV")'),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.csv$/i);

    // Verify CSV content
    const path = await download.path();
    expect(path).toBeTruthy();
  });

  test.skip('debe exportar reporte a PDF', async ({ page, authenticatedUser }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId);
    await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId,
      {
        totalCents: 100000,
      }
    );

    await page.goto('/reports/sales');

    // Click PDF export
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("PDF")'),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test.skip('debe mostrar gráfico de ventas por día', async ({
    page,
    authenticatedUser,
  }) => {
    await page.goto('/reports/sales');

    // Should have chart/graph element
    await expect(
      page.locator('canvas, svg, [data-testid="sales-chart"]')
    ).toBeVisible();
  });

  test.skip('debe mostrar top productos vendidos', async ({ page, authenticatedUser }) => {
    const product1 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Top Product 1',
    });
    const product2 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Top Product 2',
    });
    const product3 = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Top Product 3',
    });

    const sale = await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId
    );

    // Create sale items with different quantities
    await testData.createSaleItem(sale.id, product1.id, { quantity: 10 });
    await testData.createSaleItem(sale.id, product2.id, { quantity: 5 });
    await testData.createSaleItem(sale.id, product3.id, { quantity: 2 });

    await page.goto('/reports/sales');

    // Should show top products section
    await expect(page.locator('text=/productos.*más.*vendidos|top.*products/i')).toBeVisible();

    // Top Product 1 should appear first
    const topProductsList = page.locator('[data-testid="top-products-list"], table');
    await expect(topProductsList.locator('text="Top Product 1"')).toBeVisible();
  });

  test.skip('debe calcular correctamente impuestos en el reporte', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      priceCents: 100000,
      taxRate: 0.21,
    });

    const sale = await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId,
      {
        subtotalCents: 100000,
        taxCents: 21000,
        totalCents: 121000,
      }
    );

    await page.goto('/reports/sales');

    // Should show tax breakdown
    await expect(page.locator('text=/impuestos.*210|tax.*210/i')).toBeVisible();
    await expect(page.locator('text=/subtotal.*1.*000/i')).toBeVisible();
    await expect(page.locator('text=/total.*1.*210/i')).toBeVisible();
  });

  test.skip('debe mostrar ventas canceladas separadamente', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId);

    // Create completed sale
    await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId,
      {
        totalCents: 100000,
        status: 'completed',
      }
    );

    // Create cancelled sale
    await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId,
      {
        totalCents: 50000,
        status: 'cancelled',
      }
    );

    await page.goto('/reports/sales');

    // Filter to show cancelled sales
    await page.click('button:has-text("Canceladas"), input[type="checkbox"][value="cancelled"]');

    // Should show cancelled sales
    await expect(page.locator('text=/cancelad|cancelled/i')).toBeVisible();
  });

  test.skip('debe comparar ventas con periodo anterior', async ({
    page,
    authenticatedUser,
  }) => {
    await page.goto('/reports/sales');

    // Enable comparison mode
    await page.click('button:has-text("Comparar"), input[type="checkbox"][name="compare"]');

    // Should show comparison metrics
    await expect(
      page.locator('text=/vs.*periodo.*anterior|compared.*to.*previous/i')
    ).toBeVisible();

    // Should show percentage change
    await expect(page.locator('text=/%|percent/')).toBeVisible();
  });
});
