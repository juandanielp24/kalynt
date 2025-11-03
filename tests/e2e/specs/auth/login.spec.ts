import { test, expect } from '@playwright/test';

test.describe('Autenticación - Login', () => {
  test('debe redirigir a login cuando se accede sin autenticación', async ({ page }) => {
    await page.goto('/dashboard');

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });

  test('debe mostrar formulario de login', async ({ page }) => {
    await page.goto('/login');

    // Check form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('debe validar campos requeridos', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors (either HTML5 or custom)
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');

    // Check for HTML5 validation or custom error messages
    const emailInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    const passwordInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);

    expect(emailInvalid || await page.locator('text=/email.*requerido/i').isVisible()).toBeTruthy();
    expect(passwordInvalid || await page.locator('text=/contraseña.*requerido/i').isVisible()).toBeTruthy();
  });

  test('debe validar formato de email', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'not-an-email');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Check for email format validation
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);

    expect(isInvalid || await page.locator('text=/email.*inválido/i').isVisible()).toBeTruthy();
  });

  test('debe mostrar error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(
      page.locator('text=/credenciales.*inválidas|incorrect.*credentials|invalid.*login/i')
    ).toBeVisible({ timeout: 10000 });
  });

  test.skip('debe permitir login exitoso con credenciales válidas', async ({ page }) => {
    // This test is skipped because it requires a pre-existing user
    // In a real scenario, you would use test fixtures to create a user first

    await page.goto('/login');

    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'Test123456!');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
  });
});
