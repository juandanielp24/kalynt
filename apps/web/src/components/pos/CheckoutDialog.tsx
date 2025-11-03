'use client';

import { useState } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from '@retail/ui';
import { useCartStore } from '@/store/cart-store';
import { formatCurrencyARS } from '@retail/shared';
import { salesApi, PaymentMethod } from '@/lib/api';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const paymentMethodLabels: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Efectivo',
  [PaymentMethod.DEBIT_CARD]: 'Tarjeta de Débito',
  [PaymentMethod.CREDIT_CARD]: 'Tarjeta de Crédito',
  [PaymentMethod.MERCADO_PAGO]: 'Mercado Pago',
  [PaymentMethod.MODO]: 'MODO',
  [PaymentMethod.BANK_TRANSFER]: 'Transferencia Bancaria',
};

export function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const cart = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [customerName, setCustomerName] = useState('');
  const [customerCuit, setCustomerCuit] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const subtotalCents = cart.getSubtotalCents();
  const taxCents = cart.getTaxCents();
  const totalCents = cart.getTotalCents();

  const resetForm = () => {
    setPaymentMethod(PaymentMethod.CASH);
    setCustomerName('');
    setCustomerCuit('');
    setCustomerEmail('');
    setCustomerPhone('');
    setNotes('');
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsProcessing(true);

    try {
      // Get location from cart or use default
      const locationId = cart.locationId;
      if (!locationId) {
        throw new Error('No se ha seleccionado una ubicación');
      }

      // 1. Create sale
      const sale = await salesApi.create({
        locationId,
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          discountCents: item.discountCents || 0,
        })),
        paymentMethod,
        customerName: customerName || undefined,
        customerCuit: customerCuit || undefined,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        notes: notes || undefined,
      });

      // 2. Complete sale (generate AFIP invoice)
      await salesApi.complete(sale.id);

      // 3. Success! Clear cart and show success message
      setSuccess(true);
      cart.clearCart();

      // Close dialog after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Error al procesar la venta');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Procesar Venta</DialogTitle>
          <DialogDescription>
            Completa los datos de la venta para generar la factura
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary */}
          <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-sm">Resumen del Pedido</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatCurrencyARS(subtotalCents)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA</span>
                <span className="font-medium">
                  {formatCurrencyARS(taxCents)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrencyARS(totalCents)}</span>
              </div>
              <div className="text-xs text-muted-foreground pt-1">
                {cart.getItemCount()} {cart.getItemCount() === 1 ? 'producto' : 'productos'}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Método de Pago *</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
              required
            >
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="Selecciona método de pago" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(paymentMethodLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Datos del Cliente (opcional)</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Nombre</Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nombre del cliente"
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-cuit">CUIT/CUIL</Label>
                <Input
                  id="customer-cuit"
                  value={customerCuit}
                  onChange={(e) => setCustomerCuit(e.target.value)}
                  placeholder="20-12345678-9"
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-email">Email</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="cliente@example.com"
                  disabled={isProcessing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-phone">Teléfono</Label>
                <Input
                  id="customer-phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+54 9 11 1234-5678"
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales sobre la venta"
              disabled={isProcessing}
            />
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {success && (
            <Alert className="border-green-600 bg-green-50 text-green-900">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription>
                ¡Venta procesada exitosamente! Factura AFIP generada.
              </AlertDescription>
            </Alert>
          )}

          {/* Footer */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isProcessing || success}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Procesar Venta'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
