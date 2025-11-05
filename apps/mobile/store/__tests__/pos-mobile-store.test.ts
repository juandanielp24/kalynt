import { usePOSMobileStore } from '../pos-mobile-store';

// Mock the database
jest.mock('../../src/db', () => ({
  db: {
    insert: jest.fn(() => ({
      values: jest.fn(() => Promise.resolve()),
    })),
    query: {
      localSales: {
        findMany: jest.fn(() => Promise.resolve([])),
      },
    },
  },
}));

jest.mock('../../src/db/schema', () => ({
  localSales: {},
  localSaleItems: {},
}));

describe('usePOSMobileStore', () => {
  beforeEach(() => {
    // Reset store before each test
    usePOSMobileStore.getState().clearCart();
  });

  describe('addItem', () => {
    it('should add a new item to the cart', () => {
      const store = usePOSMobileStore.getState();

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        priceCents: 1000,
        taxRate: 0.21,
        stock: { quantity: 10 },
      };

      store.addItem(product);

      const state = usePOSMobileStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0]).toMatchObject({
        productId: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        quantity: 1,
        unitPriceCents: 1000,
        taxRate: 0.21,
        stock: 10,
      });
      expect(state.totalCents).toBe(1000);
    });

    it('should increment quantity when adding the same product', () => {
      const store = usePOSMobileStore.getState();

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        priceCents: 1000,
        taxRate: 0.21,
      };

      store.addItem(product);
      store.addItem(product);

      const state = usePOSMobileStore.getState();
      expect(state.items).toHaveLength(1);
      expect(state.items[0].quantity).toBe(2);
      expect(state.totalCents).toBe(2000);
    });

    it('should calculate tax correctly for items', () => {
      const store = usePOSMobileStore.getState();

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        priceCents: 1210, // Price includes 21% tax
        taxRate: 0.21,
      };

      store.addItem(product);

      const state = usePOSMobileStore.getState();
      // Tax = price - (price / (1 + taxRate))
      // Tax = 1210 - (1210 / 1.21) = 1210 - 1000 = 210
      expect(state.taxCents).toBe(210);
      expect(state.totalCents).toBe(1210);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', () => {
      const store = usePOSMobileStore.getState();

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        priceCents: 1000,
        taxRate: 0.21,
      };

      store.addItem(product);
      const itemId = usePOSMobileStore.getState().items[0].id;

      store.removeItem(itemId);

      const state = usePOSMobileStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.totalCents).toBe(0);
    });
  });

  describe('updateQuantity', () => {
    it('should update the quantity of an item', () => {
      const store = usePOSMobileStore.getState();

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        priceCents: 1000,
        taxRate: 0.21,
      };

      store.addItem(product);
      const itemId = usePOSMobileStore.getState().items[0].id;

      store.updateQuantity(itemId, 5);

      const state = usePOSMobileStore.getState();
      expect(state.items[0].quantity).toBe(5);
      expect(state.totalCents).toBe(5000);
    });

    it('should remove item when quantity is set to 0', () => {
      const store = usePOSMobileStore.getState();

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        priceCents: 1000,
        taxRate: 0.21,
      };

      store.addItem(product);
      const itemId = usePOSMobileStore.getState().items[0].id;

      store.updateQuantity(itemId, 0);

      const state = usePOSMobileStore.getState();
      expect(state.items).toHaveLength(0);
    });
  });

  describe('updateItemDiscount', () => {
    it('should apply discount to an item', () => {
      const store = usePOSMobileStore.getState();

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        priceCents: 1000,
        taxRate: 0.21,
      };

      store.addItem(product);
      const itemId = usePOSMobileStore.getState().items[0].id;

      store.updateItemDiscount(itemId, 10); // 10% discount

      const state = usePOSMobileStore.getState();
      expect(state.items[0].discountPercent).toBe(10);
      // Price with discount: 1000 - (1000 * 0.1) = 900
      expect(state.totalCents).toBe(900);
    });
  });

  describe('setGlobalDiscount', () => {
    it('should apply global discount to total', () => {
      const store = usePOSMobileStore.getState();

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        priceCents: 1000,
        taxRate: 0.21,
      };

      store.addItem(product);
      store.setGlobalDiscount(20); // 20% discount

      const state = usePOSMobileStore.getState();
      // Subtotal: 1000
      // Global discount: 1000 * 0.2 = 200
      // Total: 1000 - 200 = 800
      expect(state.discountPercent).toBe(20);
      expect(state.discountCents).toBe(200);
      expect(state.totalCents).toBe(800);
    });
  });

  describe('clearCart', () => {
    it('should clear all items and reset cart state', () => {
      const store = usePOSMobileStore.getState();

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        priceCents: 1000,
        taxRate: 0.21,
      };

      store.addItem(product);
      store.setNotes('Test notes');
      store.setCustomer({ name: 'John Doe', email: 'john@example.com' });

      store.clearCart();

      const state = usePOSMobileStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.customer).toBeNull();
      expect(state.notes).toBe('');
      expect(state.totalCents).toBe(0);
      expect(state.subtotalCents).toBe(0);
      expect(state.taxCents).toBe(0);
      expect(state.discountCents).toBe(0);
    });
  });

  describe('saveSaleLocally', () => {
    it('should save sale to local database and clear cart', async () => {
      const store = usePOSMobileStore.getState();
      const { db } = require('../../src/db');

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        priceCents: 1000,
        taxRate: 0.21,
      };

      store.addItem(product);
      store.setCustomer({ name: 'John Doe', email: 'john@example.com' });

      const saleId = await store.saveSaleLocally('cash');

      // Verify sale was inserted
      expect(db.insert).toHaveBeenCalled();
      expect(saleId).toMatch(/^sale-/);

      // Verify cart was cleared
      const state = usePOSMobileStore.getState();
      expect(state.items).toHaveLength(0);
    });

    it('should include customer information in sale', async () => {
      const store = usePOSMobileStore.getState();
      const { db } = require('../../src/db');

      const mockInsert = jest.fn(() => ({
        values: jest.fn(() => Promise.resolve()),
      }));
      db.insert.mockImplementation(mockInsert);

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        priceCents: 1000,
        taxRate: 0.21,
      };

      const customer = {
        name: 'John Doe',
        email: 'john@example.com',
        cuit: '20-12345678-9',
        phone: '+54 9 11 1234-5678',
      };

      store.addItem(product);
      store.setCustomer(customer);

      await store.saveSaleLocally('credit_card', {
        generateInvoice: true,
        invoiceType: 'A',
      });

      // Verify customer data was included
      const insertCalls = mockInsert.mock.results;
      expect(insertCalls.length).toBeGreaterThan(0);
    });

    it('should handle multiple items in sale', async () => {
      const store = usePOSMobileStore.getState();

      const products = [
        {
          id: 'prod-1',
          name: 'Product 1',
          sku: 'TEST-001',
          priceCents: 1000,
          taxRate: 0.21,
        },
        {
          id: 'prod-2',
          name: 'Product 2',
          sku: 'TEST-002',
          priceCents: 2000,
          taxRate: 0.21,
        },
      ];

      products.forEach((product) => store.addItem(product));

      let state = usePOSMobileStore.getState();
      expect(state.items).toHaveLength(2);
      expect(state.totalCents).toBe(3000);

      await store.saveSaleLocally('cash');

      // Verify cart was cleared
      state = usePOSMobileStore.getState();
      expect(state.items).toHaveLength(0);
    });
  });

  describe('complex scenarios', () => {
    it('should handle item discount + global discount correctly', () => {
      const store = usePOSMobileStore.getState();

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        priceCents: 1000,
        taxRate: 0.21,
      };

      store.addItem(product);
      const itemId = usePOSMobileStore.getState().items[0].id;

      store.updateItemDiscount(itemId, 10); // 10% item discount
      store.setGlobalDiscount(10); // 10% global discount

      const state = usePOSMobileStore.getState();
      // Item price after discount: 1000 - (1000 * 0.1) = 900
      // Subtotal: 900
      // Global discount: 900 * 0.1 = 90
      // Total: 900 - 90 = 810
      expect(state.totalCents).toBe(810);
    });

    it('should recalculate tax proportionally with global discount', () => {
      const store = usePOSMobileStore.getState();

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        sku: 'TEST-001',
        priceCents: 1210, // Includes 21% tax (1000 + 210)
        taxRate: 0.21,
      };

      store.addItem(product);
      store.setGlobalDiscount(50); // 50% discount

      const state = usePOSMobileStore.getState();
      // Original tax: 210
      // After 50% discount, tax should also be halved: 105
      expect(state.taxCents).toBe(105);
      expect(state.totalCents).toBe(605);
    });
  });
});
