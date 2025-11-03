import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
  productId: string;
  productName: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  taxRate: number;
  discountCents?: number;
}

interface CartStore {
  items: CartItem[];
  locationId: string | null;

  // Actions
  setLocationId: (locationId: string) => void;
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discountCents: number) => void;
  clearCart: () => void;

  // Computed
  getSubtotalCents: () => number;
  getTaxCents: () => number;
  getTotalCents: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      locationId: null,

      setLocationId: (locationId) => set({ locationId }),

      addItem: (item) => set((state) => {
        const existingItem = state.items.find(
          (i) => i.productId === item.productId
        );

        if (existingItem) {
          return {
            items: state.items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          };
        }

        return {
          items: [...state.items, { ...item, quantity: 1 }],
        };
      }),

      removeItem: (productId) => set((state) => ({
        items: state.items.filter((i) => i.productId !== productId),
      })),

      updateQuantity: (productId, quantity) => set((state) => {
        if (quantity <= 0) {
          return {
            items: state.items.filter((i) => i.productId !== productId),
          };
        }

        return {
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        };
      }),

      updateDiscount: (productId, discountCents) => set((state) => ({
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, discountCents } : i
        ),
      })),

      clearCart: () => set({ items: [] }),

      getSubtotalCents: () => {
        const items = get().items;
        return items.reduce(
          (sum, item) => sum + item.unitPriceCents * item.quantity,
          0
        );
      },

      getTaxCents: () => {
        const items = get().items;
        return items.reduce(
          (sum, item) =>
            sum + Math.round(item.unitPriceCents * item.quantity * item.taxRate),
          0
        );
      },

      getTotalCents: () => {
        const subtotal = get().getSubtotalCents();
        const tax = get().getTaxCents();
        const discount = get().items.reduce(
          (sum, item) => sum + (item.discountCents || 0),
          0
        );
        return subtotal + tax - discount;
      },

      getItemCount: () => {
        const items = get().items;
        return items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
