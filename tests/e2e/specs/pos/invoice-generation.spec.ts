import { test, expect } from '../../fixtures/auth.fixture';
import { TestDataHelper } from '../../helpers/test-data.helper';

test.describe('POS - Generación de Facturas AFIP', () => {
  let testData: TestDataHelper;

  test.beforeEach(async () => {
    testData = new TestDataHelper();
  });

  test.afterEach(async () => {
    await testData.disconnect();
  });

  test.skip('debe generar factura tipo A correctamente', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      priceCents: 100000, // $1000
      taxRate: 0.21,
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      100
    );

    await page.goto('/pos');
    await page.fill('input[placeholder*="Buscar"]', product.sku);
    await page.click('button:has-text("Agregar")');
    await page.click('button:has-text("Finalizar")');
    await page.click('button:has-text("Efectivo")');

    // Select invoice type A
    await page.selectOption('select[name="invoiceType"]', 'A');

    // Fill customer info (required for type A)
    await page.fill('input[name="customerName"]', 'Empresa Test SA');
    await page.fill('input[name="customerCuit"]', '30123456789');
    await page.fill('input[name="customerAddress"]', 'Av. Test 123');

    // Confirm sale
    await page.click('button[type="submit"]:has-text("Confirmar")');

    // Wait for AFIP processing
    await expect(
      page.locator('text=/factura.*generada|invoice.*generated/i')
    ).toBeVisible({ timeout: 30000 });

    // Should display invoice number
    await expect(page.locator('text=/A-\\d+-\\d+/i')).toBeVisible();

    // Verify in database
    const sale = await testData.prisma.sale.findFirst({
      where: {
        tenantId: authenticatedUser.tenantId,
        userId: authenticatedUser.userId,
      },
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
    });

    expect(sale?.invoice).toBeTruthy();
    expect(sale?.invoice?.invoiceType).toBe('A');
    expect(sale?.invoice?.afipCae).toBeTruthy();
    expect(sale?.invoice?.afipCaeExpiresAt).toBeTruthy();
    expect(sale?.invoice?.invoiceNumber).toBeTruthy();
    expect(sale?.invoice?.customerCuit).toBe('30123456789');
  });

  test.skip('debe generar factura tipo B correctamente', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      priceCents: 100000,
      taxRate: 0.21,
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      100
    );

    await page.goto('/pos');
    await page.fill('input[placeholder*="Buscar"]', product.sku);
    await page.click('button:has-text("Agregar")');
    await page.click('button:has-text("Finalizar")');
    await page.click('button:has-text("Efectivo")');

    // Select invoice type B
    await page.selectOption('select[name="invoiceType"]', 'B');

    // Fill customer info
    await page.fill('input[name="customerName"]', 'Monotributista Test');
    await page.fill('input[name="customerCuit"]', '20409378472');

    await page.click('button[type="submit"]:has-text("Confirmar")');

    await expect(
      page.locator('text=/factura.*generada/i')
    ).toBeVisible({ timeout: 30000 });

    await expect(page.locator('text=/B-\\d+-\\d+/i')).toBeVisible();

    // Verify in database
    const sale = await testData.prisma.sale.findFirst({
      where: {
        tenantId: authenticatedUser.tenantId,
        userId: authenticatedUser.userId,
      },
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
    });

    expect(sale?.invoice?.invoiceType).toBe('B');
    expect(sale?.invoice?.afipCae).toBeTruthy();
  });

  test.skip('debe generar factura tipo C para consumidor final', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      priceCents: 50000,
      taxRate: 0.21,
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      100
    );

    await page.goto('/pos');
    await page.fill('input[placeholder*="Buscar"]', product.sku);
    await page.click('button:has-text("Agregar")');
    await page.click('button:has-text("Finalizar")');
    await page.click('button:has-text("Efectivo")');

    // Select invoice type C (consumidor final)
    const invoiceTypeSelect = page.locator('select[name="invoiceType"]');
    if (await invoiceTypeSelect.isVisible()) {
      await invoiceTypeSelect.selectOption('C');
    }

    // Type C doesn't require customer info
    await page.click('button[type="submit"]:has-text("Confirmar")');

    await expect(
      page.locator('text=/factura.*generada/i')
    ).toBeVisible({ timeout: 30000 });

    await expect(page.locator('text=/C-\\d+-\\d+/i')).toBeVisible();

    const sale = await testData.prisma.sale.findFirst({
      where: {
        tenantId: authenticatedUser.tenantId,
        userId: authenticatedUser.userId,
      },
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
    });

    expect(sale?.invoice?.invoiceType).toBe('C');
    expect(sale?.invoice?.afipCae).toBeTruthy();
    expect(sale?.invoice?.customerCuit).toBeNull();
  });

  test.skip('debe manejar error de AFIP correctamente', async ({
    page,
    authenticatedUser,
  }) => {
    // This test simulates AFIP service errors
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      priceCents: 100000,
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      100
    );

    await page.goto('/pos');
    await page.fill('input[placeholder*="Buscar"]', product.sku);
    await page.click('button:has-text("Agregar")');
    await page.click('button:has-text("Finalizar")');
    await page.click('button:has-text("Efectivo")');

    // Use invalid CUIT to trigger AFIP error
    await page.fill('input[name="customerCuit"]', '12345678901');

    await page.click('button[type="submit"]:has-text("Confirmar")');

    // Should show AFIP error
    await expect(
      page.locator('text=/error.*afip|afip.*error|cuit.*inválido/i')
    ).toBeVisible({ timeout: 15000 });

    // Sale should be marked as pending or failed
    const sale = await testData.prisma.sale.findFirst({
      where: {
        tenantId: authenticatedUser.tenantId,
        userId: authenticatedUser.userId,
      },
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
    });

    expect(sale?.status).toMatch(/pending|failed/);
  });

  test.skip('debe permitir reintentar generación de factura fallida', async ({
    page,
    authenticatedUser,
  }) => {
    // Create a sale with failed invoice
    const sale = await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId,
      {
        status: 'pending',
        paymentStatus: 'completed',
      }
    );

    // Navigate to sales history or invoices
    await page.goto('/sales');

    // Find the failed sale
    await page.click(`text="${sale.saleNumber}"`);

    // Click retry invoice generation
    await page.click('button:has-text("Reintentar"), button:has-text("Retry Invoice")');

    // Should show success
    await expect(
      page.locator('text=/factura.*generada|invoice.*generated/i')
    ).toBeVisible({ timeout: 30000 });

    // Verify in database
    const updatedSale = await testData.prisma.sale.findUnique({
      where: { id: sale.id },
      include: { invoice: true },
    });

    expect(updatedSale?.invoice).toBeTruthy();
    expect(updatedSale?.invoice?.afipCae).toBeTruthy();
    expect(updatedSale?.status).toBe('completed');
  });

  test.skip('debe incluir información correcta en factura electrónica', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      name: 'Producto Factura Test',
      sku: 'FACT-001',
      priceCents: 100000,
      taxRate: 0.21,
    });

    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      100
    );

    await page.goto('/pos');
    await page.fill('input[placeholder*="Buscar"]', 'FACT-001');
    await page.click('button:has-text("Agregar")');
    await page.click('button:has-text("Finalizar")');
    await page.click('button:has-text("Efectivo")');

    await page.selectOption('select[name="invoiceType"]', 'B');
    await page.fill('input[name="customerName"]', 'Cliente Test');
    await page.fill('input[name="customerCuit"]', '20409378472');

    await page.click('button[type="submit"]:has-text("Confirmar")');

    await expect(
      page.locator('text=/factura.*generada/i')
    ).toBeVisible({ timeout: 30000 });

    // Verify invoice details in database
    const sale = await testData.prisma.sale.findFirst({
      where: {
        tenantId: authenticatedUser.tenantId,
        userId: authenticatedUser.userId,
      },
      include: {
        invoice: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const invoice = sale?.invoice;
    expect(invoice).toBeTruthy();
    expect(invoice?.invoiceType).toBe('B');
    expect(invoice?.customerCuit).toBe('20409378472');
    expect(invoice?.customerName).toBe('Cliente Test');
    expect(invoice?.subtotalCents).toBe(sale?.subtotalCents);
    expect(invoice?.taxCents).toBe(sale?.taxCents);
    expect(invoice?.totalCents).toBe(sale?.totalCents);
    expect(invoice?.afipCae).toBeTruthy();
    expect(invoice?.afipCaeExpiresAt).toBeTruthy();

    // Verify CAE expiration date is 10 days from now
    const caeExpiration = new Date(invoice!.afipCaeExpiresAt);
    const now = new Date();
    const daysDiff = Math.floor(
      (caeExpiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysDiff).toBeGreaterThanOrEqual(9);
    expect(daysDiff).toBeLessThanOrEqual(11);
  });

  test.skip('debe generar PDF de factura descargable', async ({
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
    await page.fill('input[placeholder*="Buscar"]', product.sku);
    await page.click('button:has-text("Agregar")');
    await page.click('button:has-text("Finalizar")');
    await page.click('button:has-text("Efectivo")');

    await page.click('button[type="submit"]:has-text("Confirmar")');

    await expect(
      page.locator('text=/factura.*generada/i')
    ).toBeVisible({ timeout: 30000 });

    // Should have download/print button
    const downloadButton = page.locator(
      'button:has-text("Descargar"), button:has-text("Download"), a[href*=".pdf"]'
    );
    await expect(downloadButton).toBeVisible();

    // Click download and verify file is generated
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      downloadButton.click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/factura.*\.pdf|invoice.*\.pdf/i);
  });

  test.skip('debe permitir anular factura', async ({ page, authenticatedUser }) => {
    // Create a completed sale with invoice
    const product = await testData.createProduct(authenticatedUser.tenantId);
    await testData.createStock(
      authenticatedUser.tenantId,
      product.id,
      authenticatedUser.locationId,
      100
    );

    const sale = await testData.createSale(
      authenticatedUser.tenantId,
      authenticatedUser.userId,
      authenticatedUser.locationId,
      {
        status: 'completed',
      }
    );

    await testData.createSaleItem(sale.id, product.id);

    // Create invoice record (in real scenario this would be created by AFIP service)
    const invoice = await testData.prisma.invoice.create({
      data: {
        tenantId: authenticatedUser.tenantId,
        saleId: sale.id,
        invoiceType: 'B',
        invoiceNumber: 'B-0001-00000001',
        afipCae: '12345678901234',
        afipCaeExpiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        subtotalCents: sale.subtotalCents,
        taxCents: sale.taxCents,
        totalCents: sale.totalCents,
        status: 'issued',
      },
    });

    // Navigate to invoice
    await page.goto(`/invoices/${invoice.id}`);

    // Click cancel/void invoice
    await page.click('button:has-text("Anular"), button:has-text("Void"), button:has-text("Cancelar Factura")');

    // Confirm cancellation
    await page.fill('textarea[name="reason"]', 'Error en factura - test');
    await page.click('button[type="submit"]:has-text("Confirmar")');

    // Should show success
    await expect(
      page.locator('text=/factura.*anulada|invoice.*voided/i')
    ).toBeVisible({ timeout: 30000 });

    // Verify in database
    const updatedInvoice = await testData.prisma.invoice.findUnique({
      where: { id: invoice.id },
    });

    expect(updatedInvoice?.status).toBe('voided');
    expect(updatedInvoice?.voidedAt).toBeTruthy();
  });
});
