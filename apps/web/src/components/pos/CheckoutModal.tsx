'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { usePOSStore } from '@/stores/pos-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@retail/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@retail/ui';
import { Button } from '@retail/ui';
import { Loader2 } from 'lucide-react';
import { useToast } from '@retail/ui';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import { CustomerForm } from './CustomerForm';
import { InvoiceOptions } from './InvoiceOptions';
import { SaleSuccessModal } from './SaleSuccessModal';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { toast } = useToast();
  const {
    items,
    customer,
    totalCents,
    subtotalCents,
    taxCents,
    discountCents,
    notes,
    clearCart,
  } = usePOSStore();

  const [activeTab, setActiveTab] = useState('payment');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [generateInvoice, setGenerateInvoice] = useState(false);
  const [invoiceType, setInvoiceType] = useState<'A' | 'B' | 'C'>('B');
  const [saleResult, setSaleResult] = useState<any>(null);

  // Mutation para crear venta
  const createSaleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/sales', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: '¡Venta procesada!',
        description: 'La venta se ha registrado exitosamente',
      });

      setSaleResult(data.data);
      clearCart();
    },
    onError: (error: any) => {
      toast({
        title: 'Error al procesar venta',
        description: error.response?.data?.message || 'Intenta nuevamente',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async () => {
    // Validaciones
    if (items.length === 0) {
      toast({
        title: 'Carrito vacío',
        description: 'Agrega productos antes de procesar la venta',
        variant: 'destructive',
      });
      return;
    }

    // Validar cliente si es factura A
    if (generateInvoice && invoiceType === 'A' && !customer?.cuit) {
      toast({
        title: 'CUIT requerido',
        description: 'Para Factura A debes ingresar el CUIT del cliente',
        variant: 'destructive',
      });
      setActiveTab('customer');
      return;
    }

    // Preparar datos de venta
    const saleData = {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        discountPercent: item.discountPercent || 0,
      })),
      paymentMethod,
      customerName: customer?.name,
      customerEmail: customer?.email,
      customerCuit: customer?.cuit,
      customerPhone: customer?.phone,
      notes,
      generateInvoice,
      invoiceType: generateInvoice ? invoiceType : undefined,
    };

    createSaleMutation.mutate(saleData);
  };

  const handleClose = () => {
    if (saleResult) {
      setSaleResult(null);
    }
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen && !saleResult} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Procesar Venta</DialogTitle>
            <DialogDescription>
              Total a pagar: ${(totalCents / 100).toFixed(2)}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="payment">Pago</TabsTrigger>
              <TabsTrigger value="customer">Cliente</TabsTrigger>
              <TabsTrigger value="invoice">Factura</TabsTrigger>
            </TabsList>

            {/* Payment Tab */}
            <TabsContent value="payment" className="space-y-4">
              <PaymentMethodSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                totalCents={totalCents}
              />

              {/* Payment method specific info */}
              {paymentMethod === 'cash' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💵 El pago en efectivo se aprobará inmediatamente
                  </p>
                </div>
              )}

              {paymentMethod === 'mercado_pago' && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800">
                    💳 Se generará un QR para que el cliente pague con Mercado Pago
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Customer Tab */}
            <TabsContent value="customer" className="space-y-4">
              <CustomerForm />
            </TabsContent>

            {/* Invoice Tab */}
            <TabsContent value="invoice" className="space-y-4">
              <InvoiceOptions
                generateInvoice={generateInvoice}
                invoiceType={invoiceType}
                onGenerateInvoiceChange={setGenerateInvoice}
                onInvoiceTypeChange={setInvoiceType}
                hasCustomerCuit={!!customer?.cuit}
              />
            </TabsContent>
          </Tabs>

          {/* Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span>${(subtotalCents / 100).toFixed(2)}</span>
            </div>

            {discountCents > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento:</span>
                <span>-${(discountCents / 100).toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">IVA:</span>
              <span>${(taxCents / 100).toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>${(totalCents / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createSaleMutation.isPending}
            >
              {createSaleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Confirmar Venta'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modal */}
      {saleResult && (
        <SaleSuccessModal
          sale={saleResult}
          isOpen={!!saleResult}
          onClose={() => {
            setSaleResult(null);
            onClose();
          }}
        />
      )}
    </>
  );
}
