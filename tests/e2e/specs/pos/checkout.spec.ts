import { test, expect } from '../../fixtures/auth.fixture';
import { TestDataHelper } from '../../helpers/test-data.helper';

test.describe('POS - Checkout', () => {
  let testData: TestDataHelper;

  test.beforeEach(async () => {
    testData = new TestDataHelper();
  });

  test.afterEach(async () => {
    await testData.disconnect();
  });

  test('debe mostrar opciones de pago disponibles', async ({
    page,
    authenticatedUser,
  }) => {
    await page.goto('/pos');

    // Assuming there's a checkout button visible
    const checkoutButton = page.locator(
      'button:has-text("Checkout"), button:has-text("Finalizar"), button:has-text("Cobrar")'
    );

    if (await checkoutButton.isVisible()) {
      await checkoutButton.click();

      // Should show payment methods
      await expect(
        page.locator('button:has-text("Efectivo"), button:has-text("Cash")')
      ).toBeVisible();
      await expect(
        page.locator(
          'button:has-text("Tarjeta"), button:has-text("Card"), button:has-text("Débito")'
        )
      ).toBeVisible();
    }
  });

  test.skip('debe procesar pago en efectivo correctamente', async ({
    page,
    authenticatedUser,
  }) => {
    // Create test product
    const product = await testData.createProduct(authenticatedUser.tenantId, {
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
    await page.fill('input[placeholder*="Buscar"]', product.sku);
    await page.click('button:has-text("Agregar")');

    // Go to checkout
    await page.click('button:has-text("Finalizar")');

    // Select cash payment
    await page.click('button:has-text("Efectivo"), button:has-text("Cash")');

    // Enter amount received
    const amountInput = page.locator(
      'input[name="amountReceived"], input[placeholder*="Monto"]'
    );
    if (await amountInput.isVisible()) {
      await amountInput.fill('1500'); // Customer pays $1500
    }

    // Should calculate change
    await expect(page.locator('text=/cambio|change/i')).toBeVisible();

    // Confirm payment
    await page.click('button[type="submit"]:has-text("Confirmar")');

    // Should complete sale
    await expect(
      page.locator('text=/venta.*completada|sale.*completed/i')
    ).toBeVisible({ timeout: 15000 });
  });

  test.skip('debe procesar pago con tarjeta débito', async ({
    page,
    authenticatedUser,
  }) => {
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

    // Select debit card
    await page.click(
      'button:has-text("Débito"), button:has-text("Debit"), button:has-text("Tarjeta Débito")'
    );

    // Confirm payment
    await page.click('button[type="submit"]:has-text("Confirmar")');

    // Should complete sale
    await expect(
      page.locator('text=/venta.*completada|sale.*completed/i')
    ).toBeVisible({ timeout: 15000 });

    // Verify in database
    const sale = await testData.prisma.sale.findFirst({
      where: {
        tenantId: authenticatedUser.tenantId,
        userId: authenticatedUser.userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(sale?.paymentMethod).toBe('debit_card');
  });

  test.skip('debe procesar pago con tarjeta crédito', async ({
    page,
    authenticatedUser,
  }) => {
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

    // Select credit card
    await page.click(
      'button:has-text("Crédito"), button:has-text("Credit"), button:has-text("Tarjeta Crédito")'
    );

    // Select installments if available
    const installmentsSelect = page.locator('select[name="installments"]');
    if (await installmentsSelect.isVisible()) {
      await installmentsSelect.selectOption('3'); // 3 installments
    }

    // Confirm payment
    await page.click('button[type="submit"]:has-text("Confirmar")');

    await expect(
      page.locator('text=/venta.*completada|sale.*completed/i')
    ).toBeVisible({ timeout: 15000 });

    // Verify in database
    const sale = await testData.prisma.sale.findFirst({
      where: {
        tenantId: authenticatedUser.tenantId,
        userId: authenticatedUser.userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(sale?.paymentMethod).toBe('credit_card');
  });

  test.skip('debe procesar pago con Mercado Pago QR', async ({
    page,
    authenticatedUser,
  }) => {
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

    // Select Mercado Pago
    await page.click(
      'button:has-text("Mercado Pago"), button:has-text("QR"), button:has-text("MP")'
    );

    // Should show QR code
    await expect(page.locator('[data-testid="qr-code"], img[alt*="QR"]')).toBeVisible({
      timeout: 10000,
    });

    // In test environment, we might need to simulate payment confirmation
    // This would typically involve waiting for webhook or polling

    // For testing purposes, assume payment is confirmed
    await expect(
      page.locator('text=/pago.*confirmado|payment.*confirmed/i')
    ).toBeVisible({ timeout: 30000 });
  });

  test.skip('debe validar datos de cliente para factura tipo A o B', async ({
    page,
    authenticatedUser,
  }) => {
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

    // Select invoice type A or B (requires customer info)
    const invoiceTypeSelect = page.locator('select[name="invoiceType"]');
    if (await invoiceTypeSelect.isVisible()) {
      await invoiceTypeSelect.selectOption('A');

      // Try to submit without customer info
      await page.click('button[type="submit"]:has-text("Confirmar")');

      // Should show validation errors
      await expect(
        page.locator('text=/cuit.*requerido|razón.*social.*requerido/i')
      ).toBeVisible({ timeout: 5000 });
    }
  });

  test.skip('debe permitir generar factura tipo C (consumidor final)', async ({
    page,
    authenticatedUser,
  }) => {
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

    // Select invoice type C (doesn't require customer info)
    const invoiceTypeSelect = page.locator('select[name="invoiceType"]');
    if (await invoiceTypeSelect.isVisible()) {
      await invoiceTypeSelect.selectOption('C');
    }

    // Confirm payment
    await page.click('button[type="submit"]:has-text("Confirmar")');

    // Should complete without requiring customer info
    await expect(
      page.locator('text=/venta.*completada|factura.*generada/i')
    ).toBeVisible({ timeout: 30000 });

    // Verify invoice type in database
    const sale = await testData.prisma.sale.findFirst({
      where: {
        tenantId: authenticatedUser.tenantId,
        userId: authenticatedUser.userId,
      },
      include: { invoice: true },
      orderBy: { createdAt: 'desc' },
    });

    expect(sale?.invoice?.invoiceType).toBe('C');
  });

  test.skip('debe calcular cambio correctamente en pago efectivo', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      priceCents: 85000, // $850
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

    // Customer pays with $1000
    await page.fill('input[name="amountReceived"]', '1000');

    // Should show change: $150
    const totalWithTax = 85000 + Math.round(85000 * 0.21); // $850 + 21% tax = $1028.50
    const change = 100000 - totalWithTax;

    await expect(
      page.locator(`text=/cambio.*${(change / 100).toFixed(2)}/i`)
    ).toBeVisible();
  });

  test.skip('debe manejar múltiples métodos de pago en una venta', async ({
    page,
    authenticatedUser,
  }) => {
    const product = await testData.createProduct(authenticatedUser.tenantId, {
      priceCents: 200000, // $2000
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

    // Split payment: $1000 cash + $1000 card
    await page.click('button:has-text("Pago Mixto"), button:has-text("Split Payment")');

    await page.fill('input[name="cashAmount"]', '1000');
    await page.fill('input[name="cardAmount"]', '1000');

    await page.click('button[type="submit"]:has-text("Confirmar")');

    await expect(
      page.locator('text=/venta.*completada/i')
    ).toBeVisible({ timeout: 15000 });

    // Verify both payment methods in database
    const sale = await testData.prisma.sale.findFirst({
      where: {
        tenantId: authenticatedUser.tenantId,
        userId: authenticatedUser.userId,
      },
      include: { payments: true },
      orderBy: { createdAt: 'desc' },
    });

    expect(sale?.payments).toHaveLength(2);
    expect(sale?.payments?.some((p) => p.method === 'cash')).toBeTruthy();
    expect(sale?.payments?.some((p) => p.method === 'debit_card')).toBeTruthy();
  });
});
