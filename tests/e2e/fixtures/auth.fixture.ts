import { test as base, expect } from '@playwright/test';
import { PrismaClient } from '@retail/database';

type AuthFixtures = {
  authenticatedUser: {
    email: string;
    password: string;
    tenantId: string;
    userId: string;
    token: string;
    locationId: string;
  };
  prisma: PrismaClient;
};

export const test = base.extend<AuthFixtures>({
  prisma: async ({}, use) => {
    const prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.DATABASE_URL },
      },
    });

    await use(prisma);

    await prisma.$disconnect();
  },

  authenticatedUser: async ({ page, prisma }, use) => {
    // Generate unique identifiers for this test run
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = 'Test123456!';

    // 1. Register via API to create tenant and user
    const registerResponse = await page.request.post(
      `${process.env.API_URL}/auth/register`,
      {
        data: {
          email,
          password,
          name: 'Test User',
          tenantName: `Test Store ${timestamp}`,
        },
      }
    );

    if (!registerResponse.ok()) {
      throw new Error(
        `Failed to register user: ${registerResponse.status()} ${await registerResponse.text()}`
      );
    }

    const registerData = await registerResponse.json();

    // 2. Login via API to get auth token
    const loginResponse = await page.request.post(
      `${process.env.API_URL}/auth/login`,
      {
        data: {
          email,
          password,
        },
      }
    );

    if (!loginResponse.ok()) {
      throw new Error(
        `Failed to login: ${loginResponse.status()} ${await loginResponse.text()}`
      );
    }

    const loginData = await loginResponse.json();

    // 3. Get user and tenant data from database
    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        tenant: {
          include: {
            locations: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found after registration');
    }

    const location =
      user.tenant.locations[0] ||
      (await prisma.location.create({
        data: {
          tenantId: user.tenantId,
          name: 'Sucursal Test',
          type: 'store',
          isActive: true,
        },
      }));

    // 4. Set up authenticated context in browser
    await page.goto('/');

    // Store token in localStorage (adjust based on your auth implementation)
    await page.evaluate((token) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('session', JSON.stringify({ token }));
    }, loginData.token || loginData.access_token);

    // If using cookies, set the auth cookie
    if (loginData.token) {
      await page.context().addCookies([
        {
          name: 'auth_token',
          value: loginData.token,
          domain: 'localhost',
          path: '/',
          httpOnly: false,
          secure: false,
          sameSite: 'Lax',
        },
      ]);
    }

    const fixture = {
      email,
      password,
      tenantId: user.tenantId,
      userId: user.id,
      token: loginData.token || loginData.access_token,
      locationId: location.id,
    };

    await use(fixture);

    // Cleanup: Delete tenant and all related data (cascade)
    try {
      await prisma.tenant.delete({
        where: { id: user.tenantId },
      });
    } catch (error) {
      console.warn('Failed to cleanup test tenant:', error);
    }
  },
});

export { expect };
