import { test, expect } from '@playwright/test';
import { PrismaClient } from '@retail/database';

test.describe('Autenticación - Registro', () => {
  let prisma: PrismaClient;

  test.beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL },
      },
    });
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('debe mostrar formulario de registro', async ({ page }) => {
    await page.goto('/register');

    // Check form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('debe validar campos requeridos', async ({ page }) => {
    await page.goto('/register');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(
      page.locator('text=/email.*requerido|name.*requerido|password.*requerido/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('debe validar fortaleza de contraseña', async ({ page }) => {
    await page.goto('/register');

    const timestamp = Date.now();
    await page.fill('input[type="email"]', `test-${timestamp}@example.com`);
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[type="password"]', '123'); // Weak password
    await page.click('button[type="submit"]');

    // Should show password strength error
    await expect(
      page.locator('text=/contraseña.*débil|password.*weak|password.*short/i')
    ).toBeVisible({ timeout: 5000 });
  });

  test('debe registrar nuevo usuario exitosamente', async ({ page }) => {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;

    await page.goto('/register');

    await page.fill('input[type="email"]', email);
    await page.fill('input[name="name"]', 'Test User E2E');
    await page.fill('input[type="password"]', 'Test123456!');

    // Fill tenant name if required
    const tenantNameInput = page.locator('input[name="tenantName"]');
    if (await tenantNameInput.isVisible()) {
      await tenantNameInput.fill(`Test Store ${timestamp}`);
    }

    await page.click('button[type="submit"]');

    // Should redirect to dashboard or show success message
    await page.waitForURL(/.*dashboard|.*login/, { timeout: 15000 });

    // Verify user was created in database
    const user = await prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    });

    expect(user).toBeTruthy();
    expect(user?.email).toBe(email);
    expect(user?.name).toBe('Test User E2E');
    expect(user?.tenant).toBeTruthy();

    // Cleanup
    if (user) {
      await prisma.tenant.delete({
        where: { id: user.tenantId },
      });
    }
  });

  test('debe mostrar error al registrar email duplicado', async ({ page }) => {
    const timestamp = Date.now();
    const email = `duplicate-${timestamp}@example.com`;

    // First registration
    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[name="name"]', 'First User');
    await page.fill('input[type="password"]', 'Test123456!');

    const tenantNameInput = page.locator('input[name="tenantName"]');
    if (await tenantNameInput.isVisible()) {
      await tenantNameInput.fill(`Test Store ${timestamp}`);
    }

    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard|.*login/, { timeout: 15000 });

    // Try to register again with same email
    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[name="name"]', 'Second User');
    await page.fill('input[type="password"]', 'Test123456!');

    if (await tenantNameInput.isVisible()) {
      await tenantNameInput.fill(`Another Store ${timestamp}`);
    }

    await page.click('button[type="submit"]');

    // Should show error about duplicate email
    await expect(
      page.locator('text=/email.*ya.*existe|email.*already.*exists|email.*taken/i')
    ).toBeVisible({ timeout: 10000 });

    // Cleanup
    const user = await prisma.user.findFirst({ where: { email } });
    if (user) {
      await prisma.tenant.delete({ where: { id: user.tenantId } });
    }
  });
});
