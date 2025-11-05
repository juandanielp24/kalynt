'use client';

import { usePOSStore } from '@/stores/pos-store';
import { Button, Input } from '@retail/ui';
import { Minus, Plus, X, Percent } from 'lucide-react';
import { useState } from 'react';

export function Cart() {
  const {
    items,
    subtotalCents,
    taxCents,
    discountCents,
    totalCents,
    discountPercent,
    removeItem,
    updateQuantity,
    setGlobalDiscount,
    clearCart,
  } = usePOSStore();

  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [discountInput, setDiscountInput] = useState(discountPercent.toString());

  const handleApplyDiscount = () => {
    const discount = parseFloat(discountInput);
    if (!isNaN(discount) && discount >= 0 && discount <= 100) {
      setGlobalDiscount(discount);
      setShowDiscountInput(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <div className="text-6xl mb-4">🛒</div>
        <p className="text-lg">Carrito vacío</p>
        <p className="text-sm mt-2">Agrega productos para comenzar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Cart Items */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-gray-50 rounded-lg p-3 space-y-2"
          >
            {/* Item Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{item.name}</h4>
                <p className="text-sm text-gray-500">
                  ${(item.unitPriceCents / 100).toFixed(2)} c/u
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const qty = parseInt(e.target.value);
                    if (!isNaN(qty) && qty > 0) {
                      updateQuantity(item.id, qty);
                    }
                  }}
                  className="w-12 text-center border rounded px-1 py-1"
                  min="1"
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  disabled={item.stock !== undefined && item.quantity >= item.stock}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              <span className="font-semibold">
                ${(item.totalCents / 100).toFixed(2)}
              </span>
            </div>

            {/* Stock Warning */}
            {item.stock !== undefined && item.quantity >= item.stock && (
              <p className="text-xs text-amber-600">
                ⚠️ Stock disponible: {item.stock}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t p-4 space-y-2">
        {/* Discount Button */}
        {!showDiscountInput ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiscountInput(true)}
            className="w-full"
          >
            <Percent className="h-4 w-4 mr-2" />
            {discountPercent > 0
              ? `Descuento: ${discountPercent}%`
              : 'Aplicar Descuento'}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Input
              type="number"
              value={discountInput}
              onChange={(e) => setDiscountInput(e.target.value)}
              placeholder="Descuento %"
              min="0"
              max="100"
              className="flex-1"
            />
            <Button onClick={handleApplyDiscount} size="sm">
              Aplicar
            </Button>
            <Button
              onClick={() => {
                setShowDiscountInput(false);
                setDiscountInput(discountPercent.toString());
              }}
              variant="ghost"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal:</span>
          <span>${(subtotalCents / 100).toFixed(2)}</span>
        </div>

        {/* Discount */}
        {discountCents > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Descuento ({discountPercent}%):</span>
            <span>-${(discountCents / 100).toFixed(2)}</span>
          </div>
        )}

        {/* Tax */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">IVA:</span>
          <span>${(taxCents / 100).toFixed(2)}</span>
        </div>

        {/* Clear Cart */}
        <Button
          variant="ghost"
          size="sm"
          onClick={clearCart}
          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Vaciar Carrito
        </Button>
      </div>
    </div>
  );
}
