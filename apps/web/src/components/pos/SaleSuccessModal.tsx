'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@retail/ui';
import { Button } from '@retail/ui';
import { CheckCircle2, Printer, Download, Mail, QrCode as QrCodeIcon } from 'lucide-react';
import { ReceiptPrintable } from './ReceiptPrintable';

interface SaleSuccessModalProps {
  sale: any;
  isOpen: boolean;
  onClose: () => void;
}

export function SaleSuccessModal({ sale, isOpen, onClose }: SaleSuccessModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
  });

  const hasInvoice = !!sale.invoiceNumber;
  const hasQR = !!sale.payment?.qrCode;
  const hasEmail = !!sale.customerEmail;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            ¡Venta Procesada!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sale Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Número de Venta:</span>
              <span className="font-semibold">{sale.saleNumber}</span>
            </div>

            {hasInvoice && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">Factura:</span>
                  <span className="font-semibold">
                    {sale.invoiceType} {sale.invoiceNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CAE:</span>
                  <span className="font-mono text-sm">{sale.cae}</span>
                </div>
              </>
            )}

            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold text-lg">
                ${(sale.totalCents / 100).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Método de Pago:</span>
              <span className="capitalize">{sale.paymentMethod?.replace('_', ' ')}</span>
            </div>
          </div>

          {/* QR Code for Mercado Pago */}
          {hasQR && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
              <QrCodeIcon className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-sm text-purple-800 font-medium mb-3">
                QR de Pago Generado
              </p>
              <img
                src={sale.payment.qrCode}
                alt="QR Code Mercado Pago"
                className="mx-auto w-48 h-48"
              />
              <p className="text-xs text-purple-700 mt-2">
                El cliente puede escanear este QR para pagar
              </p>
            </div>
          )}

          {/* Email notification */}
          {hasEmail && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <Mail className="h-4 w-4 text-blue-600" />
              <span>
                Comprobante enviado a <strong>{sale.customerEmail}</strong>
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="w-full"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // TODO: Implement download PDF
                alert('Descarga de PDF próximamente');
              }}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar
            </Button>
          </div>

          <Button onClick={onClose} className="w-full" size="lg">
            Nueva Venta
          </Button>
        </div>

        {/* Hidden Printable Receipt */}
        <div style={{ display: 'none' }}>
          <ReceiptPrintable ref={printRef} sale={sale} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
