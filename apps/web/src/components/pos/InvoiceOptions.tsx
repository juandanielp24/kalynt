'use client';

import { Switch, Label, RadioGroup, RadioGroupItem } from '@retail/ui';
import { AlertCircle } from 'lucide-react';

interface InvoiceOptionsProps {
  generateInvoice: boolean;
  invoiceType: 'A' | 'B' | 'C';
  onGenerateInvoiceChange: (value: boolean) => void;
  onInvoiceTypeChange: (value: 'A' | 'B' | 'C') => void;
  hasCustomerCuit: boolean;
}

export function InvoiceOptions({
  generateInvoice,
  invoiceType,
  onGenerateInvoiceChange,
  onInvoiceTypeChange,
  hasCustomerCuit,
}: InvoiceOptionsProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">Facturación Electrónica</h3>
        <p className="text-sm text-gray-600">
          Genera comprobante fiscal con AFIP
        </p>
      </div>

      {/* Toggle Generate Invoice */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="space-y-1">
          <Label htmlFor="generate-invoice" className="font-medium">
            Generar Factura Electrónica
          </Label>
          <p className="text-sm text-gray-600">
            Se solicitará CAE a AFIP
          </p>
        </div>
        <Switch
          id="generate-invoice"
          checked={generateInvoice}
          onCheckedChange={onGenerateInvoiceChange}
        />
      </div>

      {/* Invoice Type Selection */}
      {generateInvoice && (
        <div className="space-y-3">
          <Label>Tipo de Comprobante</Label>
          <RadioGroup
            value={invoiceType}
            onValueChange={(value) => onInvoiceTypeChange(value as 'A' | 'B' | 'C')}
          >
            <div className="space-y-2">
              {/* Factura A */}
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="A" id="invoice-a" disabled={!hasCustomerCuit} />
                <div className="flex-1">
                  <Label htmlFor="invoice-a" className="font-medium cursor-pointer">
                    Factura A
                  </Label>
                  <p className="text-xs text-gray-500">
                    Para Responsables Inscriptos (requiere CUIT)
                  </p>
                </div>
              </div>

              {/* Factura B */}
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="B" id="invoice-b" />
                <div className="flex-1">
                  <Label htmlFor="invoice-b" className="font-medium cursor-pointer">
                    Factura B
                  </Label>
                  <p className="text-xs text-gray-500">
                    Para consumidores finales, monotributistas y exentos
                  </p>
                </div>
              </div>

              {/* Factura C */}
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="C" id="invoice-c" />
                <div className="flex-1">
                  <Label htmlFor="invoice-c" className="font-medium cursor-pointer">
                    Factura C
                  </Label>
                  <p className="text-xs text-gray-500">
                    Para operaciones exentas o no gravadas
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>

          {/* Warning for Factura A without CUIT */}
          {invoiceType === 'A' && !hasCustomerCuit && (
            <div className="flex gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">CUIT requerido</p>
                <p>
                  Para emitir Factura A debes ingresar el CUIT del cliente en la
                  pestaña &quot;Cliente&quot;
                </p>
              </div>
            </div>
          )}

          {/* Info about AFIP */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              ℹ️ La factura se generará automáticamente en AFIP y se enviará por
              email al cliente (si proporcionó un email)
            </p>
          </div>
        </div>
      )}

      {/* No Invoice Info */}
      {!generateInvoice && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-sm text-gray-700">
            📄 Se generará un comprobante interno sin validación AFIP
          </p>
        </div>
      )}
    </div>
  );
}
