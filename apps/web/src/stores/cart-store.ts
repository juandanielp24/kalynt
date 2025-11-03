import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  priceCents: number;
  quantity: number;
  taxRate: number;
}

interface CartStore {
  items: CartItem[];

  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Computed
  getTotalItems: () => number;
  getSubtotalCents: () => number;
  getTaxCents: () => number;
  getTotalCents: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const items = get().items;
        const existingItem = items.find((i) => i.productId === item.productId);

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + (item.quantity || 1) }
                : i
            ),
          });
        } else {
          set({
            items: [...items, { ...item, quantity: item.quantity || 1 }],
          });
        }
      },

      removeItem: (productId) => {
        set({
          items: get().items.filter((item) => item.productId !== productId),
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set({
          items: get().items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getSubtotalCents: () => {
        return get().items.reduce(
          (total, item) => total + item.priceCents * item.quantity,
          0
        );
      },

      getTaxCents: () => {
        return get().items.reduce(
          (total, item) => {
            const itemTotal = item.priceCents * item.quantity;
            const tax = Math.round(itemTotal * item.taxRate);
            return total + tax;
          },
          0
        );
      },

      getTotalCents: () => {
        const subtotal = get().getSubtotalCents();
        const tax = get().getTaxCents();
        return subtotal + tax;
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
