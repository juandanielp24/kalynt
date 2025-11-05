'use client';

import { usePOSStore } from '@/stores/pos-store';
import { Input, Label, Button } from '@retail/ui';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function CustomerForm() {
  const { customer, setCustomer } = usePOSStore();

  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    cuit: customer?.cuit || '',
    phone: customer?.phone || '',
  });

  useEffect(() => {
    setCustomer(formData.name || formData.email || formData.cuit ? formData : null);
  }, [formData, setCustomer]);

  const handleClear = () => {
    setFormData({
      name: '',
      email: '',
      cuit: '',
      phone: '',
    });
  };

  const formatCUIT = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');

    // Format as XX-XXXXXXXX-X
    if (digits.length <= 2) return digits;
    if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10, 11)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Datos del Cliente</h3>
        {(formData.name || formData.email || formData.cuit) && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            <X className="h-4 w-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      <p className="text-sm text-gray-600">
        Opcional. Completa los datos si deseas enviar comprobante o generar Factura A.
      </p>

      <div className="space-y-3">
        <div>
          <Label htmlFor="customerName">Nombre</Label>
          <Input
            id="customerName"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Juan Pérez"
          />
        </div>

        <div>
          <Label htmlFor="customerEmail">Email</Label>
          <Input
            id="customerEmail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="cliente@ejemplo.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Se enviará el comprobante por email
          </p>
        </div>

        <div>
          <Label htmlFor="customerCuit">CUIT</Label>
          <Input
            id="customerCuit"
            value={formData.cuit}
            onChange={(e) => {
              const formatted = formatCUIT(e.target.value);
              setFormData({ ...formData, cuit: formatted });
            }}
            placeholder="20-12345678-9"
            maxLength={13}
          />
          <p className="text-xs text-gray-500 mt-1">
            Requerido para Factura A
          </p>
        </div>

        <div>
          <Label htmlFor="customerPhone">Teléfono</Label>
          <Input
            id="customerPhone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+54 9 11 1234-5678"
          />
        </div>
      </div>
    </div>
  );
}
