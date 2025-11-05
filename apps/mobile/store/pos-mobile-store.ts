import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { db } from '../src/db';
import { localSales, localSaleItems } from '../src/db/schema';

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

interface Customer {
  name?: string;
  email?: string;
  cuit?: string;
  phone?: string;
}

interface POSMobileState {
  items: CartItem[];
  customer: Customer | null;
  discountPercent: number;
  notes: string;

  subtotalCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;

  addItem: (product: any) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateItemDiscount: (itemId: string, discountPercent: number) => void;
  clearCart: () => void;
  setCustomer: (customer: Customer) => void;
  setGlobalDiscount: (percent: number) => void;
  setNotes: (notes: string) => void;
  recalculate: () => void;

  // Save sale locally
  saveSaleLocally: (paymentMethod: string, invoiceData?: any) => Promise<string>;
}

export const usePOSMobileStore = create<POSMobileState>()(
  immer((set, get) => ({
    items: [],
    customer: null,
    discountPercent: 0,
    notes: '',
    subtotalCents: 0,
    taxCents: 0,
    discountCents: 0,
    totalCents: 0,

    addItem: (product) => {
      set((state) => {
        const existingItem = state.items.find((item) => item.productId === product.id);

        if (existingItem) {
          existingItem.quantity += 1;
          existingItem.totalCents = existingItem.quantity * existingItem.unitPriceCents;
        } else {
          const newItem: CartItem = {
            id: `${Date.now()}-${Math.random()}`,
            productId: product.id,
            name: product.name,
            sku: product.sku,
            quantity: 1,
            unitPriceCents: product.priceCents,
            taxRate: product.taxRate || 0.21,
            totalCents: product.priceCents,
            stock: product.stock?.quantity,
          };
          state.items.push(newItem);
        }
      });
      get().recalculate();
    },

    removeItem: (itemId) => {
      set((state) => {
        state.items = state.items.filter((item) => item.id !== itemId);
      });
      get().recalculate();
    },

    updateQuantity: (itemId, quantity) => {
      set((state) => {
        const item = state.items.find((i) => i.id === itemId);
        if (item) {
          if (quantity <= 0) {
            state.items = state.items.filter((i) => i.id !== itemId);
          } else {
            item.quantity = quantity;
            const discountAmount = item.discountPercent
              ? (item.unitPriceCents * item.discountPercent) / 100
              : 0;
            const discountedPrice = item.unitPriceCents - discountAmount;
            item.totalCents = item.quantity * discountedPrice;
          }
        }
      });
      get().recalculate();
    },

    updateItemDiscount: (itemId, discountPercent) => {
      set((state) => {
        const item = state.items.find((i) => i.id === itemId);
        if (item) {
          item.discountPercent = discountPercent;
          const discountAmount = (item.unitPriceCents * discountPercent) / 100;
          const discountedPrice = item.unitPriceCents - discountAmount;
          item.totalCents = item.quantity * discountedPrice;
        }
      });
      get().recalculate();
    },

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

    setCustomer: (customer) => {
      set((state) => {
        state.customer = { ...state.customer, ...customer };
      });
    },

    setGlobalDiscount: (percent) => {
      set((state) => {
        state.discountPercent = percent;
      });
      get().recalculate();
    },

    setNotes: (notes) => {
      set((state) => {
        state.notes = notes;
      });
    },

    recalculate: () => {
      set((state) => {
        let subtotal = 0;
        let tax = 0;

        state.items.forEach((item) => {
          // Apply item discount
          const itemDiscountAmount = item.discountPercent
            ? (item.unitPriceCents * item.discountPercent) / 100
            : 0;
          const itemDiscountedPrice = item.unitPriceCents - itemDiscountAmount;
          const itemSubtotal = item.quantity * itemDiscountedPrice;

          subtotal += itemSubtotal;

          // Calculate tax (IVA included in price)
          const itemTax = itemSubtotal - itemSubtotal / (1 + item.taxRate);
          tax += itemTax;
        });

        // Apply global discount
        const globalDiscountAmount = (subtotal * state.discountPercent) / 100;
        const total = subtotal - globalDiscountAmount;

        // Recalculate tax proportionally if global discount applied
        if (globalDiscountAmount > 0 && subtotal > 0) {
          const discountRatio = total / subtotal;
          tax = tax * discountRatio;
        }

        state.subtotalCents = Math.round(subtotal);
        state.taxCents = Math.round(tax);
        state.discountCents = Math.round(globalDiscountAmount);
        state.totalCents = Math.round(total);
      });
    },

    // Save sale to local database
    saveSaleLocally: async (paymentMethod, invoiceData) => {
      const state = get();
      const saleId = `sale-${Date.now()}-${Math.random()}`;

      try {
        // Insert sale
        await db.insert(localSales).values({
          id: saleId,
          tenantId: 'current-tenant-id', // TODO: Get from auth context
          locationId: 'current-location-id', // TODO: Get from settings
          subtotalCents: state.subtotalCents,
          taxCents: state.taxCents,
          discountCents: state.discountCents,
          totalCents: state.totalCents,
          customerName: state.customer?.name,
          customerEmail: state.customer?.email,
          customerCuit: state.customer?.cuit,
          customerPhone: state.customer?.phone,
          paymentMethod,
          generateInvoice: invoiceData?.generateInvoice || false,
          invoiceType: invoiceData?.invoiceType,
          notes: state.notes,
          syncStatus: 'pending',
        });

        // Insert sale items
        for (const item of state.items) {
          await db.insert(localSaleItems).values({
            id: `item-${Date.now()}-${Math.random()}`,
            localSaleId: saleId,
            productId: item.productId,
            productName: item.name,
            productSku: item.sku,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            taxRate: item.taxRate,
            discountPercent: item.discountPercent || 0,
            totalCents: item.totalCents,
          });
        }

        // Clear cart after save
        get().clearCart();

        return saleId;
      } catch (error) {
        console.error('Failed to save sale locally:', error);
        throw error;
      }
    },
  }))
);
