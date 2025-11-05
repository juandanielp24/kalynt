'use client';

import { Card } from '@retail/ui';
import { Banknote, CreditCard, QrCode, Smartphone, Building2, Link2 } from 'lucide-react';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  disabled?: boolean;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'Efectivo',
    icon: Banknote,
    description: 'Pago inmediato',
  },
  {
    id: 'debit_card',
    name: 'Débito',
    icon: CreditCard,
    description: 'Tarjeta de débito',
  },
  {
    id: 'credit_card',
    name: 'Crédito',
    icon: CreditCard,
    description: 'Tarjeta de crédito',
  },
  {
    id: 'mercado_pago',
    name: 'Mercado Pago',
    icon: QrCode,
    description: 'QR o link de pago',
  },
  {
    id: 'modo',
    name: 'MODO',
    icon: Smartphone,
    description: 'Transferencia CVU',
    disabled: true,
  },
  {
    id: 'bank_transfer',
    name: 'Transferencia',
    icon: Building2,
    description: 'Transferencia bancaria',
    disabled: true,
  },
];

interface PaymentMethodSelectorProps {
  value: string;
  onChange: (value: string) => void;
  totalCents: number;
}

export function PaymentMethodSelector({
  value,
  onChange,
  totalCents,
}: PaymentMethodSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-2">Método de Pago</h3>
        <p className="text-sm text-gray-600">
          Total a cobrar: ${(totalCents / 100).toFixed(2)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {paymentMethods.map((method) => {
          const Icon = method.icon;
          const isSelected = value === method.id;

          return (
            <Card
              key={method.id}
              className={`p-4 cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary'
                  : 'hover:border-gray-400'
              } ${method.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => !method.disabled && onChange(method.id)}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div
                  className={`p-3 rounded-full ${
                    isSelected ? 'bg-primary text-white' : 'bg-gray-100'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-medium">{method.name}</p>
                  <p className="text-xs text-gray-500">{method.description}</p>
                  {method.disabled && (
                    <p className="text-xs text-amber-600 mt-1">Próximamente</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Additional info based on method */}
      {value === 'mercado_pago' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-purple-900">Opciones de Mercado Pago</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• QR para escanear con la app</li>
            <li>• Link de pago para compartir</li>
            <li>• Pago con tarjeta sin terminal</li>
          </ul>
        </div>
      )}
    </div>
  );
}
