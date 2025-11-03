import { test, expect } from '../../fixtures/auth.fixture';
import { TestDataHelper } from '../../helpers/test-data.helper';

test.describe('Inventario - Agregar Producto', () => {
  let testData: TestDataHelper;

  test.beforeEach(async () => {
    testData = new TestDataHelper();
  });

  test.afterEach(async () => {
    await testData.disconnect();
  });

  test('debe mostrar la página de inventario', async ({ page, authenticatedUser }) => {
    await page.goto('/inventory');

    // Check that we're on the inventory page
    await expect(page).toHaveURL(/.*inventory/);
    await expect(page.locator('h1, h2').filter({ hasText: /inventario|inventory/i })).toBeVisible();
  });

  test('debe abrir modal de agregar producto', async ({ page, authenticatedUser }) => {
    await page.goto('/inventory');

    // Click "Add Product" button
    await page.click('button:has-text("Agregar"), button:has-text("Add"), button:has-text("Nuevo")');

    // Modal should be visible
    await expect(page.locator('[role="dialog"], .modal, .sheet')).toBeVisible();
  });

  test('debe validar campos requeridos al crear producto', async ({ page, authenticatedUser }) => {
    await page.goto('/inventory');

    // Open add product modal
    await page.click('button:has-text("Agregar"), button:has-text("Add"), button:has-text("Nuevo")');

    // Try to submit without filling fields
    await page.click('button[type="submit"]:has-text("Guardar"), button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Crear")');

    // Should show validation errors
    await expect(
      page.locator('text=/sku.*requerido|name.*requerido|precio.*requerido/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test.skip('debe crear un nuevo producto exitosamente', async ({ page, authenticatedUser }) => {
    // This test requires the actual UI to be implemented
    await page.goto('/inventory');

    const timestamp = Date.now();
    const productName = `Test Product ${timestamp}`;
    const sku = `TEST-${timestamp}`;

    // Open add product modal
    await page.click('button:has-text("Agregar"), button:has-text("Add"), button:has-text("Nuevo")');

    // Fill form
    await page.fill('input[name="sku"]', sku);
    await page.fill('input[name="name"]', productName);
    await page.fill('input[name="costCents"], input[name="cost"]', '1000');
    await page.fill('input[name="priceCents"], input[name="price"]', '1500');

    // Submit form
    await page.click('button[type="submit"]:has-text("Guardar"), button[type="submit"]:has-text("Save")');

    // Should show success message
    await expect(
      page.locator('text=/producto.*creado|product.*created|éxito|success/i')
    ).toBeVisible({ timeout: 10000 });

    // Product should appear in list
    await expect(page.locator(`text="${productName}"`)).toBeVisible();

    // Verify in database
    const product = await testData.prisma.product.findFirst({
      where: {
        tenantId: authenticatedUser.tenantId,
        sku,
      },
    });

    expect(product).toBeTruthy();
    expect(product?.name).toBe(productName);
  });
});
