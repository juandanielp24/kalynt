# E2E Testing Guide - Retail POS Application

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Structure](#test-structure)
6. [Best Practices](#best-practices)
7. [CI/CD Integration](#cicd-integration)
8. [Troubleshooting](#troubleshooting)

## Overview

This project uses [Playwright](https://playwright.dev/) for End-to-End (E2E) testing. Playwright enables cross-browser testing with a modern, reliable API that works across Chromium, Firefox, and WebKit.

### Key Features

- **Multi-browser support**: Test on Chromium, Firefox, and WebKit
- **Auto-wait**: Automatically waits for elements to be ready
- **Network interception**: Mock and modify network requests
- **Visual testing**: Screenshots and videos on failure
- **Parallel execution**: Fast test execution with worker threads
- **Fixtures**: Reusable test setup with authentication and database helpers

### Coverage Goals

We aim for **80% coverage** of critical user flows:

- ✅ Authentication (login, register, password reset)
- ✅ Point of Sale (create sale, checkout, invoice generation)
- ✅ Inventory management (products, stock, categories)
- ✅ Reports (sales reports, inventory reports)

## Setup

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL 15+ (running locally or via Docker)
- Redis 7+ (running locally or via Docker)

### Installation

1. **Install dependencies**:

   ```bash
   pnpm install
   ```

2. **Install Playwright browsers**:

   ```bash
   pnpm exec playwright install chromium --with-deps
   ```

3. **Setup test database**:

   ```bash
   pnpm test:e2e:setup
   ```

   This script will:
   - Create a separate test database (`retail_app_test`)
   - Run Prisma migrations
   - Prepare the database for testing

4. **Configure environment variables**:

   The `.env.test` file contains test-specific configuration:

   ```env
   NODE_ENV=test
   DATABASE_URL="postgresql://retail_user:retail_password_dev@localhost:5432/retail_app_test?schema=public"
   API_URL=http://localhost:3001
   BASE_URL=http://localhost:3000
   BETTER_AUTH_SECRET=test-secret-key-min-32-chars-long-for-testing
   AFIP_PRODUCTION=false  # Use AFIP test environment
   MERCADO_PAGO_ACCESS_TOKEN=TEST-token  # Sandbox token
   ```

## Running Tests

### Basic Commands

```bash
# Run all tests (headless)
pnpm test:e2e

# Run with UI mode (interactive)
pnpm test:e2e:ui

# Run in debug mode
pnpm test:e2e:debug

# Run in headed mode (see browser)
pnpm test:e2e:headed

# View test report
pnpm test:e2e:report
```

### Filtering Tests

```bash
# Run specific test file
pnpm test:e2e tests/e2e/specs/auth/login.spec.ts

# Run tests matching pattern
pnpm test:e2e --grep "login"

# Run specific test by line number
pnpm test:e2e tests/e2e/specs/auth/login.spec.ts:15

# Run tests in specific folder
pnpm test:e2e tests/e2e/specs/pos/
```

### Debugging

```bash
# Debug specific test
pnpm test:e2e:debug tests/e2e/specs/pos/create-sale.spec.ts

# Run with verbose logging
DEBUG=pw:api pnpm test:e2e

# Generate trace for debugging
pnpm test:e2e --trace on
```

## Writing Tests

### Basic Test Structure

```typescript
import { test, expect } from '../../fixtures/auth.fixture';
import { TestDataHelper } from '../../helpers/test-data.helper';

test.describe('Feature Name', () => {
  let testData: TestDataHelper;

  test.beforeEach(async () => {
    testData = new TestDataHelper();
  });

  test.afterEach(async () => {
    await testData.disconnect();
  });

  test('should do something', async ({ page, authenticatedUser }) => {
    // Test implementation
  });
});
```

### Using Fixtures

The `authenticatedUser` fixture provides:

```typescript
{
  email: string;           // User email
  password: string;        // User password
  tenantId: string;        // Tenant ID
  userId: string;          // User ID
  token: string;           // Auth token
  locationId: string;      // Default location ID
}
```

Example usage:

```typescript
test('should create product', async ({ page, authenticatedUser }) => {
  const product = await testData.createProduct(authenticatedUser.tenantId, {
    name: 'Test Product',
    sku: 'TEST-001',
    priceCents: 100000,
  });

  await page.goto('/inventory');
  await expect(page.locator(`text="${product.name}"`)).toBeVisible();
});
```

### Test Data Helpers

The `TestDataHelper` class provides methods for creating test data:

```typescript
// Create product
await testData.createProduct(tenantId, {
  name: 'Product Name',
  sku: 'SKU-001',
  priceCents: 100000,
  costCents: 60000,
});

// Create stock
await testData.createStock(tenantId, productId, locationId, 100);

// Create category
await testData.createCategory(tenantId, 'Electronics');

// Create location
await testData.createLocation(tenantId, {
  name: 'Store 1',
  type: 'store',
});

// Create sale
await testData.createSale(tenantId, userId, locationId, {
  totalCents: 100000,
  paymentMethod: 'cash',
});

// Create sale item
await testData.createSaleItem(saleId, productId, {
  quantity: 5,
  unitPriceCents: 10000,
});
```

### API Testing

Use the `APIHelper` for API calls:

```typescript
import { APIHelper } from '../../helpers/api.helper';

test('should create via API', async ({ request, authenticatedUser }) => {
  const api = new APIHelper(request, authenticatedUser.token);

  const response = await api.post(
    '/api/products',
    {
      name: 'Test Product',
      sku: 'TEST-001',
      priceCents: 100000,
    },
    authenticatedUser.tenantId,
    authenticatedUser.userId
  );

  expect(response.status()).toBe(201);
});
```

## Test Structure

```
tests/e2e/
├── fixtures/
│   └── auth.fixture.ts         # Authentication fixture
├── helpers/
│   ├── test-data.helper.ts     # Database helpers
│   └── api.helper.ts           # API request helpers
└── specs/
    ├── auth/
    │   ├── login.spec.ts
    │   └── register.spec.ts
    ├── pos/
    │   ├── create-sale.spec.ts
    │   ├── checkout.spec.ts
    │   └── invoice-generation.spec.ts
    ├── inventory/
    │   └── add-product.spec.ts
    └── reports/
        ├── sales-report.spec.ts
        └── inventory-report.spec.ts
```

## Best Practices

### 1. Test Isolation

Each test should be independent and not rely on other tests:

```typescript
test('should be isolated', async ({ page, authenticatedUser }) => {
  // Create test data in the test
  const product = await testData.createProduct(authenticatedUser.tenantId);

  // Use unique identifiers
  const timestamp = Date.now();
  const uniqueSku = `TEST-${timestamp}`;

  // Clean up is automatic via fixture
});
```

### 2. Use Flexible Selectors

Make selectors resilient to UI changes:

```typescript
// ❌ Bad - Too specific, breaks easily
await page.click('.button-class-abc-123');

// ✅ Good - Semantic, flexible
await page.click('button:has-text("Save")');

// ✅ Better - Data attributes
await page.click('[data-testid="save-button"]');

// ✅ Best - Multiple fallbacks
await page.click(
  'button:has-text("Guardar"), button:has-text("Save"), [data-testid="save"]'
);
```

### 3. Wait for Stability

Use auto-waiting and explicit waits:

```typescript
// Auto-wait (preferred)
await expect(page.locator('text="Success"')).toBeVisible();

// Explicit wait with timeout
await expect(page.locator('text="Processing"')).toBeVisible({ timeout: 30000 });

// Wait for network
await page.waitForResponse((response) => response.url().includes('/api/sales'));
```

### 4. Database Verification

Verify critical data in the database:

```typescript
test('should save to database', async ({ page, authenticatedUser }) => {
  // Perform UI action
  await page.click('button:has-text("Create")');
  await expect(page.locator('text="Success"')).toBeVisible();

  // Verify in database
  const product = await testData.prisma.product.findFirst({
    where: {
      tenantId: authenticatedUser.tenantId,
      sku: 'TEST-001',
    },
  });

  expect(product).toBeTruthy();
  expect(product?.name).toBe('Test Product');
});
```

### 5. Skip Tests Wisely

Use `test.skip` for tests requiring incomplete UI:

```typescript
test.skip('should complete full flow', async ({ page }) => {
  // This test is skipped because the UI is not fully implemented
  // TODO: Unskip when checkout flow is complete
});
```

### 6. Error Handling

Test both success and error scenarios:

```typescript
test('should show error on invalid input', async ({ page }) => {
  await page.fill('input[type="email"]', 'invalid-email');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=/email.*inválido|invalid.*email/i')).toBeVisible();
});
```

## CI/CD Integration

Tests run automatically on:

- **Push to main/develop**: Full test suite
- **Pull requests**: Full test suite with report comments
- **Manual trigger**: Via GitHub Actions UI

### GitHub Actions Workflow

Location: `.github/workflows/e2e.yml`

The workflow:

1. Sets up PostgreSQL and Redis services
2. Installs dependencies and Playwright browsers
3. Runs database migrations
4. Executes tests in parallel (with sharding on main branch)
5. Uploads test reports and artifacts
6. Comments on PRs with test results

### Viewing Results

- **Playwright HTML Report**: Available as artifact on GitHub Actions
- **Test Screenshots/Videos**: Available as artifacts on failure
- **PR Comments**: Automated comments with test summary

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
Error: P1001: Can't reach database server at localhost:5432
```

**Solution**:

- Ensure PostgreSQL is running: `docker-compose up -d postgres`
- Verify DATABASE_URL in `.env.test`
- Run setup script: `pnpm test:e2e:setup`

#### 2. Port Already in Use

```bash
Error: Port 3001 is already in use
```

**Solution**:

```bash
# Find and kill process using port
lsof -ti:3001 | xargs kill -9

# Or use different port in config
```

#### 3. Timeout Errors

```bash
Error: Test timeout of 60000ms exceeded
```

**Solution**:

- Increase timeout in test:
  ```typescript
  test('slow test', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes
  });
  ```
- Or in config (`playwright.config.ts`):
  ```typescript
  timeout: 120 * 1000;
  ```

#### 4. Flaky Tests

**Solutions**:

- Use auto-waiting instead of manual waits
- Increase timeouts for slow operations (AFIP, payments)
- Add retry logic in config
- Use `test.fixme()` to mark for fixing

#### 5. AFIP Integration Errors

```bash
Error: AFIP CAE generation failed
```

**Solution**:

- Ensure `AFIP_PRODUCTION=false` in `.env.test`
- Use valid test CUIT: `20409378472`
- Check AFIP homologation service status

### Debugging Tips

1. **Run with UI mode**:

   ```bash
   pnpm test:e2e:ui
   ```

2. **Enable verbose logging**:

   ```bash
   DEBUG=pw:api pnpm test:e2e
   ```

3. **Inspect element selectors**:

   ```bash
   pnpm exec playwright codegen http://localhost:3000
   ```

4. **View trace files**:
   ```bash
   pnpm exec playwright show-trace trace.zip
   ```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [CI/CD Guide](https://playwright.dev/docs/ci)

## Support

For issues or questions:

1. Check this guide and Playwright docs
2. Review existing test examples
3. Create an issue on GitHub
4. Contact the development team

---

**Last Updated**: 2025-11-02
**Version**: 1.0.0
