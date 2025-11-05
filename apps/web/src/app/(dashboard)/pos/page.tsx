'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProductSearch } from '@/components/pos/ProductSearch';
import { Cart } from '@/components/pos/Cart';
import { CheckoutModal } from '@/components/pos/CheckoutModal';
import { usePOSStore } from '@/stores/pos-store';
import { Button } from '@retail/ui';
import { ShoppingCart } from 'lucide-react';

export default function POSPage() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { items, totalCents } = usePOSStore();

  const hasItems = items.length > 0;

  return (
    <ProtectedRoute>
      <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
        {/* Left Panel - Product Search */}
        <div className="flex-1 flex flex-col">
          <div className="bg-white border-b p-4">
            <h1 className="text-2xl font-bold">Punto de Venta</h1>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <ProductSearch />
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className="w-96 bg-white border-l flex flex-col">
          <div className="border-b p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Carrito</h2>
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-600">{items.length} items</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <Cart />
          </div>

          <div className="border-t p-4 space-y-2">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${(totalCents / 100).toFixed(2)}</span>
            </div>

            <Button
              onClick={() => setIsCheckoutOpen(true)}
              disabled={!hasItems}
              className="w-full"
              size="lg"
            >
              Procesar Venta
            </Button>
          </div>
        </div>

        {/* Checkout Modal */}
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
