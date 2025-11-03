import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './tests/e2e/specs',

  // Timeout per test
  timeout: 60 * 1000,

  // Retries on failure
  retries: process.env.CI ? 2 : 0,

  // Workers (parallelization)
  workers: process.env.CI ? 1 : undefined,

  // Reporters
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // API URL
    extraHTTPHeaders: {
      'Accept': 'application/json',
    },

    // Trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Test projects (different browsers)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // Mobile viewports
    // {
    //   name: 'mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'mobile-safari',
    //   use: { ...devices['iPhone 13'] },
    // },
  ],

  // Web servers (start apps before tests)
  webServer: [
    {
      command: 'pnpm dev:api',
      url: 'http://localhost:3001/health',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm dev:web',
      url: 'http://localhost:3000',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
