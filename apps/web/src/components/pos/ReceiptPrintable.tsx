import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReceiptPrintableProps {
  sale: any;
}

export const ReceiptPrintable = React.forwardRef<HTMLDivElement, ReceiptPrintableProps>(
  ({ sale }, ref) => {
    return (
      <div ref={ref} className="p-8 max-w-[80mm] mx-auto font-mono text-sm">
        <style>
          {`
            @media print {
              @page {
                size: 80mm auto;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
          `}
        </style>

        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">RETAIL SUPER APP</h2>
          <p className="text-xs mt-1">{sale.tenant?.name}</p>
          {sale.tenant?.cuit && (
            <p className="text-xs">CUIT: {sale.tenant.cuit}</p>
          )}
          {sale.tenant?.address && (
            <p className="text-xs">{sale.tenant.address}</p>
          )}
        </div>

        <div className="border-t border-b border-dashed border-gray-400 py-2 my-4">
          <p className="text-center font-bold">COMPROBANTE DE VENTA</p>
        </div>

        {/* Sale Info */}
        <div className="mb-4 space-y-1">
          <div className="flex justify-between">
            <span>Nº Venta:</span>
            <span className="font-bold">{sale.saleNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Fecha:</span>
            <span>
              {format(new Date(sale.saleDate), "dd/MM/yyyy HH:mm", { locale: es })}
            </span>
          </div>
          {sale.invoiceNumber && (
            <>
              <div className="flex justify-between">
                <span>Factura:</span>
                <span className="font-bold">
                  {sale.invoiceType} {sale.invoiceNumber}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span>CAE:</span>
                <span>{sale.cae}</span>
              </div>
            </>
          )}
        </div>

        {/* Customer */}
        {sale.customerName && (
          <div className="mb-4 space-y-1">
            <div className="flex justify-between">
              <span>Cliente:</span>
              <span>{sale.customerName}</span>
            </div>
            {sale.customerCuit && (
              <div className="flex justify-between">
                <span>CUIT:</span>
                <span>{sale.customerCuit}</span>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-dashed border-gray-400 my-4" />

        {/* Items */}
        <table className="w-full mb-4">
          <thead>
            <tr className="border-b border-gray-400">
              <th className="text-left py-1">Producto</th>
              <th className="text-center py-1">Cant.</th>
              <th className="text-right py-1">Precio</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {sale.items?.map((item: any, index: number) => (
              <tr key={index} className="border-b border-dotted border-gray-300">
                <td className="py-2 pr-2">{item.productName}</td>
                <td className="text-center py-2">{item.quantity}</td>
                <td className="text-right py-2">
                  ${(item.unitPriceCents / 100).toFixed(2)}
                </td>
                <td className="text-right py-2">
                  ${(item.totalCents / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-gray-400 my-4" />

        {/* Totals */}
        <div className="space-y-1 mb-4">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>${(sale.subtotalCents / 100).toFixed(2)}</span>
          </div>

          {sale.discountCents > 0 && (
            <div className="flex justify-between">
              <span>Descuento:</span>
              <span>-${(sale.discountCents / 100).toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span>IVA (21%):</span>
            <span>${(sale.taxCents / 100).toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-lg font-bold border-t border-gray-400 pt-2 mt-2">
            <span>TOTAL:</span>
            <span>${(sale.totalCents / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mb-4">
          <div className="flex justify-between">
            <span>Método de Pago:</span>
            <span className="capitalize">
              {sale.paymentMethod?.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-dashed border-gray-400 pt-4 mt-4 text-center text-xs">
          <p>¡Gracias por su compra!</p>
          {sale.tenant?.website && (
            <p className="mt-1">{sale.tenant.website}</p>
          )}
          {sale.tenant?.phone && (
            <p>Tel: {sale.tenant.phone}</p>
          )}
        </div>

        {/* Barcode (optional) */}
        {sale.saleNumber && (
          <div className="text-center mt-4">
            <svg
              className="mx-auto"
              width="200"
              height="50"
              dangerouslySetInnerHTML={{
                __html: `<text x="50%" y="50%" text-anchor="middle" font-family="monospace">${sale.saleNumber}</text>`,
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

ReceiptPrintable.displayName = 'ReceiptPrintable';
