import { renderHook, act } from '@testing-library/react';
import { usePOSStore } from '../pos-store';

describe('POS Store', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => usePOSStore());
    act(() => {
      result.current.clearCart();
    });
  });

  describe('addItem', () => {
    it('should add a new item to the cart', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 10000, // $100.00
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toMatchObject({
        productId: 'prod-1',
        productName: 'Test Product',
        quantity: 1,
        unitPriceCents: 10000,
        taxRate: 0.21,
      });
    });

    it('should increment quantity when adding the same product', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 10000,
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
        result.current.addItem(mockProduct);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].quantity).toBe(2);
    });

    it('should calculate totals correctly after adding item', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 12100, // $121.00 (incluye IVA 21%)
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      expect(result.current.subtotalCents).toBe(12100);
      expect(result.current.totalCents).toBe(12100);
      expect(result.current.taxCents).toBeGreaterThan(0);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 10000,
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.removeItem(itemId);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('should recalculate totals after removing item', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 10000,
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.removeItem(itemId);
      });

      expect(result.current.subtotalCents).toBe(0);
      expect(result.current.totalCents).toBe(0);
      expect(result.current.taxCents).toBe(0);
    });
  });

  describe('updateQuantity', () => {
    it('should update item quantity', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 10000,
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.updateQuantity(itemId, 5);
      });

      expect(result.current.items[0].quantity).toBe(5);
    });

    it('should remove item when quantity is set to 0', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 10000,
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.updateQuantity(itemId, 0);
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('should recalculate totals when quantity changes', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 10000,
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      const initialTotal = result.current.totalCents;
      const itemId = result.current.items[0].id;

      act(() => {
        result.current.updateQuantity(itemId, 3);
      });

      expect(result.current.totalCents).toBe(initialTotal * 3);
    });
  });

  describe('updateItemDiscount', () => {
    it('should apply discount to item', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 10000,
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;
      const initialTotal = result.current.totalCents;

      act(() => {
        result.current.updateItemDiscount(itemId, 10); // 10% discount
      });

      expect(result.current.items[0].discountPercent).toBe(10);
      expect(result.current.totalCents).toBeLessThan(initialTotal);
    });

    it('should handle 0% discount', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 10000,
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;
      const initialTotal = result.current.totalCents;

      act(() => {
        result.current.updateItemDiscount(itemId, 10);
        result.current.updateItemDiscount(itemId, 0);
      });

      expect(result.current.items[0].discountPercent).toBe(0);
      expect(result.current.totalCents).toBe(initialTotal);
    });
  });

  describe('setGlobalDiscount', () => {
    it('should apply global discount to all items', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 10000,
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      const initialSubtotal = result.current.subtotalCents;

      act(() => {
        result.current.setGlobalDiscount(20); // 20% discount
      });

      expect(result.current.discountPercent).toBe(20);
      expect(result.current.discountCents).toBeGreaterThan(0);
      expect(result.current.totalCents).toBeLessThan(initialSubtotal);
    });

    it('should calculate discount amount correctly', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 10000,
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      act(() => {
        result.current.setGlobalDiscount(50); // 50% discount
      });

      // With 50% discount, total should be approximately half of subtotal
      const expectedDiscount = Math.round(result.current.subtotalCents * 0.5);
      expect(result.current.discountCents).toBeCloseTo(expectedDiscount, -1);
    });
  });

  describe('setCustomer', () => {
    it('should set customer information', () => {
      const { result } = renderHook(() => usePOSStore());

      const customerData = {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        cuit: '20-12345678-9',
        phone: '1123456789',
      };

      act(() => {
        result.current.setCustomer(customerData);
      });

      expect(result.current.customer).toEqual(customerData);
    });

    it('should update partial customer data', () => {
      const { result } = renderHook(() => usePOSStore());

      act(() => {
        result.current.setCustomer({ name: 'Juan Pérez' });
        result.current.setCustomer({ email: 'juan@example.com' });
      });

      expect(result.current.customer).toEqual({
        name: 'Juan Pérez',
        email: 'juan@example.com',
      });
    });
  });

  describe('clearCart', () => {
    it('should clear all items and reset state', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 10000,
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
        result.current.setCustomer({ name: 'Test Customer' });
        result.current.setGlobalDiscount(10);
      });

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.customer).toBeNull();
      expect(result.current.discountPercent).toBe(0);
      expect(result.current.subtotalCents).toBe(0);
      expect(result.current.totalCents).toBe(0);
      expect(result.current.taxCents).toBe(0);
      expect(result.current.discountCents).toBe(0);
    });
  });

  describe('Tax Calculation', () => {
    it('should calculate IVA correctly (price includes tax)', () => {
      const { result } = renderHook(() => usePOSStore());

      // Producto con precio $121 (incluye IVA 21%)
      // Neto: $100, IVA: $21
      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 12100,
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      // IVA = 12100 - (12100 / 1.21) = 12100 - 10000 = 2100
      expect(result.current.taxCents).toBeCloseTo(2100, -2);
    });

    it('should handle multiple items with different tax rates', () => {
      const { result } = renderHook(() => usePOSStore());

      const product1 = {
        id: 'prod-1',
        name: 'Product 21% IVA',
        priceCents: 12100,
        stock: 50,
        barcode: '123456789',
        taxRate: 0.21,
      };

      const product2 = {
        id: 'prod-2',
        name: 'Product 10.5% IVA',
        priceCents: 11050,
        stock: 50,
        barcode: '987654321',
        taxRate: 0.105,
      };

      act(() => {
        result.current.addItem(product1);
        result.current.addItem(product2);
      });

      expect(result.current.taxCents).toBeGreaterThan(0);
      expect(result.current.subtotalCents).toBe(12100 + 11050);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple items with quantities and discounts', () => {
      const { result } = renderHook(() => usePOSStore());

      const product1 = {
        id: 'prod-1',
        name: 'Product 1',
        priceCents: 10000,
        stock: 50,
        barcode: '123',
        taxRate: 0.21,
      };

      const product2 = {
        id: 'prod-2',
        name: 'Product 2',
        priceCents: 20000,
        stock: 50,
        barcode: '456',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(product1);
        result.current.addItem(product2);
      });

      const item1Id = result.current.items[0].id;
      const item2Id = result.current.items[1].id;

      act(() => {
        result.current.updateQuantity(item1Id, 3);
        result.current.updateQuantity(item2Id, 2);
        result.current.updateItemDiscount(item1Id, 10);
        result.current.setGlobalDiscount(5);
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].quantity).toBe(3);
      expect(result.current.items[1].quantity).toBe(2);
      expect(result.current.discountPercent).toBe(5);
      expect(result.current.totalCents).toBeGreaterThan(0);
    });

    it('should maintain correct totals through multiple operations', () => {
      const { result } = renderHook(() => usePOSStore());

      const product = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 10000,
        stock: 50,
        barcode: '123',
        taxRate: 0.21,
      };

      act(() => {
        // Add item
        result.current.addItem(product);
      });

      const itemId = result.current.items[0].id;
      const total1 = result.current.totalCents;

      act(() => {
        // Increase quantity
        result.current.updateQuantity(itemId, 2);
      });

      const total2 = result.current.totalCents;
      expect(total2).toBe(total1 * 2);

      act(() => {
        // Apply item discount
        result.current.updateItemDiscount(itemId, 10);
      });

      const total3 = result.current.totalCents;
      expect(total3).toBeLessThan(total2);

      act(() => {
        // Apply global discount
        result.current.setGlobalDiscount(5);
      });

      const total4 = result.current.totalCents;
      expect(total4).toBeLessThan(total3);

      act(() => {
        // Remove discount
        result.current.setGlobalDiscount(0);
      });

      const total5 = result.current.totalCents;
      expect(total5).toBe(total3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero price items', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Free Product',
        priceCents: 0,
        stock: 50,
        barcode: '123',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.totalCents).toBe(0);
    });

    it('should handle 100% discount', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 10000,
        stock: 50,
        barcode: '123',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
        result.current.setGlobalDiscount(100);
      });

      expect(result.current.totalCents).toBe(0);
    });

    it('should handle very large quantities', () => {
      const { result } = renderHook(() => usePOSStore());

      const mockProduct = {
        id: 'prod-1',
        name: 'Test Product',
        priceCents: 100,
        stock: 10000,
        barcode: '123',
        taxRate: 0.21,
      };

      act(() => {
        result.current.addItem(mockProduct);
      });

      const itemId = result.current.items[0].id;

      act(() => {
        result.current.updateQuantity(itemId, 1000);
      });

      expect(result.current.items[0].quantity).toBe(1000);
      expect(result.current.totalCents).toBe(100000);
    });
  });
});
