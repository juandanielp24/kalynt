'use client';

import { Trash2, ShoppingCart, Plus, Minus } from 'lucide-react';
import { Button, Card } from '@retail/ui';
import { useCartStore } from '@/store/cart-store';
import { formatCurrencyARS } from '@retail/shared';

interface CartSidebarProps {
  onCheckout: () => void;
}

export function CartSidebar({ onCheckout }: CartSidebarProps) {
  const cart = useCartStore();
  const items = cart.items;
  const subtotalCents = cart.getSubtotalCents();
  const taxCents = cart.getTaxCents();
  const totalCents = cart.getTotalCents();
  const itemCount = cart.getItemCount();

  return (
    <Card className="w-96 flex flex-col h-full shadow-lg">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Carrito</h2>
          <span className="ml-auto text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground">Carrito vacío</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Selecciona productos para agregar
            </p>
          </div>
        ) : (
          items.map((item) => {
            const itemSubtotal = item.unitPriceCents * item.quantity;
            const itemTax = Math.round(itemSubtotal * item.taxRate);
            const itemTotal = itemSubtotal + itemTax - (item.discountCents || 0);

            return (
              <div
                key={item.productId}
                className="flex items-start gap-3 p-3 bg-card border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.productName}</p>
                  <p className="text-sm text-muted-foreground">{item.sku}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrencyARS(item.unitPriceCents)} × {item.quantity}
                  </p>
                  {item.discountCents && item.discountCents > 0 && (
                    <p className="text-sm text-green-600">
                      Descuento: -{formatCurrencyARS(item.discountCents)}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <p className="font-semibold whitespace-nowrap">
                    {formatCurrencyARS(itemTotal)}
                  </p>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        cart.updateQuantity(item.productId, item.quantity - 1)
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        cart.updateQuantity(item.productId, item.quantity + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Remove button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => cart.removeItem(item.productId)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Totals and checkout */}
      <div className="p-4 border-t space-y-4 bg-muted/10">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">
              {formatCurrencyARS(subtotalCents)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">IVA</span>
            <span className="font-medium">{formatCurrencyARS(taxCents)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t">
            <span>Total</span>
            <span>{formatCurrencyARS(totalCents)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            className="w-full"
            size="lg"
            disabled={items.length === 0}
            onClick={onCheckout}
          >
            Procesar Venta
          </Button>
          {items.length > 0 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => cart.clearCart()}
            >
              Limpiar Carrito
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
