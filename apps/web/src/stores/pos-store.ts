import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
  taxRate: number;
  discountPercent?: number;
  totalCents: number;
  stock?: number;
}

export interface Customer {
  name?: string;
  email?: string;
  cuit?: string;
  phone?: string;
}

interface POSState {
  // Cart
  items: CartItem[];
  customer: Customer | null;
  discountPercent: number;
  notes: string;

  // Computed
  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;

  // Actions - Cart
  addItem: (product: any) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemDiscount: (itemId: string, discountPercent: number) => void;
  clearCart: () => void;

  // Actions - Customer
  setCustomer: (customer: Customer | null) => void;

  // Actions - Global
  setGlobalDiscount: (discountPercent: number) => void;
  setNotes: (notes: string) => void;

  // Computed methods
  recalculate: () => void;
}

export const usePOSStore = create<POSState>()(
  immer((set, get) => ({
    // Initial state
    items: [],
    customer: null,
    discountPercent: 0,
    notes: '',
    subtotalCents: 0,
    taxCents: 0,
    discountCents: 0,
    totalCents: 0,

    // Add item to cart
    addItem: (product) => {
      set((state) => {
        const existingItem = state.items.find(
          (item) => item.productId === product.id
        );

        if (existingItem) {
          // Increment quantity
          existingItem.quantity += 1;
          existingItem.totalCents =
            existingItem.quantity * existingItem.unitPriceCents;
        } else {
          // Add new item
          const newItem: CartItem = {
            id: crypto.randomUUID(),
            productId: product.id,
            name: product.name,
            sku: product.sku,
            quantity: 1,
            unitPriceCents: product.priceCents,
            taxRate: product.taxRate || 0.21,
            totalCents: product.priceCents,
            stock: product.stock?.[0]?.quantity,
          };
          state.items.push(newItem);
        }
      });
      get().recalculate();
    },

    // Remove item from cart
    removeItem: (itemId) => {
      set((state) => {
        state.items = state.items.filter((item) => item.id !== itemId);
      });
      get().recalculate();
    },

    // Update item quantity
    updateQuantity: (itemId, quantity) => {
      set((state) => {
        const item = state.items.find((i) => i.id === itemId);
        if (item) {
          if (quantity <= 0) {
            state.items = state.items.filter((i) => i.id !== itemId);
          } else {
            item.quantity = quantity;
            item.totalCents = item.quantity * item.unitPriceCents;
          }
        }
      });
      get().recalculate();
    },

    // Update item discount
    updateItemDiscount: (itemId, discountPercent) => {
      set((state) => {
        const item = state.items.find((i) => i.id === itemId);
        if (item) {
          item.discountPercent = discountPercent;
        }
      });
      get().recalculate();
    },

    // Clear cart
    clearCart: () => {
      set((state) => {
        state.items = [];
        state.customer = null;
        state.discountPercent = 0;
        state.notes = '';
        state.subtotalCents = 0;
        state.taxCents = 0;
        state.discountCents = 0;
        state.totalCents = 0;
      });
    },

    // Set customer
    setCustomer: (customer) => {
      set((state) => {
        state.customer = customer;
      });
    },

    // Set global discount
    setGlobalDiscount: (discountPercent) => {
      set((state) => {
        state.discountPercent = discountPercent;
      });
      get().recalculate();
    },

    // Set notes
    setNotes: (notes) => {
      set((state) => {
        state.notes = notes;
      });
    },

    // Recalculate totals
    recalculate: () => {
      set((state) => {
        let subtotal = 0;
        let tax = 0;

        state.items.forEach((item) => {
          const itemSubtotal = item.quantity * item.unitPriceCents;

          // Apply item discount
          const itemDiscountAmount = item.discountPercent
            ? (itemSubtotal * item.discountPercent) / 100
            : 0;

          const itemSubtotalAfterDiscount = itemSubtotal - itemDiscountAmount;

          subtotal += itemSubtotalAfterDiscount;

          // Calculate tax (IVA incluido en el precio)
          // Precio con IVA = Precio sin IVA * (1 + taxRate)
          // Precio sin IVA = Precio con IVA / (1 + taxRate)
          // IVA = Precio con IVA - Precio sin IVA
          const itemTax = itemSubtotalAfterDiscount - (itemSubtotalAfterDiscount / (1 + item.taxRate));
          tax += itemTax;
        });

        // Apply global discount
        const globalDiscountAmount = (subtotal * state.discountPercent) / 100;

        const total = subtotal - globalDiscountAmount;

        state.subtotalCents = Math.round(subtotal);
        state.taxCents = Math.round(tax);
        state.discountCents = Math.round(globalDiscountAmount);
        state.totalCents = Math.round(total);
      });
    },
  }))
);
