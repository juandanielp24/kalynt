'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { promotionsApi, Promotion, Coupon } from '@/lib/api/promotions';
import {
  Button,
  Input,
  Label,
  Badge,
  useToast,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@retail/ui';
import {
  Plus,
  Download,
  Search,
  Copy,
  Power,
  UserPlus,
  Loader2,
  Gift,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  promotion: Promotion;
}

export function CouponsManager({ promotion }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState('10');
  const [bulkPrefix, setBulkPrefix] = useState('');

  const { data: couponsData, isLoading } = useQuery({
    queryKey: ['coupons', promotion.id],
    queryFn: () => promotionsApi.getCoupons(promotion.id),
  });

  const createCouponMutation = useMutation({
    mutationFn: () => promotionsApi.createCoupon(promotion.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons', promotion.id] });
      toast({
        title: 'Cupón creado',
        description: 'El cupón se generó correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear el cupón',
        variant: 'destructive',
      });
    },
  });

  const generateBulkMutation = useMutation({
    mutationFn: (data: { quantity: number; prefix?: string }) =>
      promotionsApi.generateBulkCoupons(promotion.id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['coupons', promotion.id] });
      toast({
        title: 'Cupones generados',
        description: `Se generaron ${response.data.count} cupones correctamente`,
      });
      setBulkDialogOpen(false);
      setBulkQuantity('10');
      setBulkPrefix('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudieron generar los cupones',
        variant: 'destructive',
      });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: promotionsApi.deactivateCoupon,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons', promotion.id] });
      toast({
        title: 'Cupón desactivado',
        description: 'El cupón se desactivó correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo desactivar el cupón',
        variant: 'destructive',
      });
    },
  });

  const coupons = couponsData?.data || [];

  const filteredCoupons = coupons.filter((coupon: Coupon) =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCoupons = coupons.filter((c: Coupon) => c.isActive).length;
  const usedCoupons = coupons.filter((c: Coupon) => c.isUsed).length;
  const availableCoupons = coupons.filter((c: Coupon) => c.isActive && !c.isUsed).length;

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Código copiado al portapapeles' });
  };

  const handleExportCoupons = () => {
    const csv = [
      ['Código', 'Estado', 'Usado', 'Usado Por', 'Fecha Uso'].join(','),
      ...coupons.map((coupon: Coupon) =>
        [
          coupon.code,
          coupon.isActive ? 'Activo' : 'Inactivo',
          coupon.isUsed ? 'Sí' : 'No',
          coupon.customer?.name || '-',
          coupon.usedAt ? format(new Date(coupon.usedAt), 'dd/MM/yyyy HH:mm') : '-',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cupones-${promotion.name}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast({ title: 'Cupones exportados' });
  };

  const handleGenerateBulk = () => {
    generateBulkMutation.mutate({
      quantity: parseInt(bulkQuantity),
      prefix: bulkPrefix || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 mb-1">Total Cupones</div>
          <div className="text-2xl font-bold">{coupons.length}</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 mb-1">Disponibles</div>
          <div className="text-2xl font-bold">{availableCoupons}</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600 mb-1">Usados</div>
          <div className="text-2xl font-bold">{usedCoupons}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar cupones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportCoupons}
            disabled={coupons.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>

          <Button variant="outline" onClick={() => setBulkDialogOpen(true)}>
            <Gift className="h-4 w-4 mr-2" />
            Generar Múltiples
          </Button>

          <Button
            onClick={() => createCouponMutation.mutate()}
            disabled={createCouponMutation.isPending}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cupón
          </Button>
        </div>
      </div>

      {/* Coupons List */}
      {isLoading ? (
        <div className="text-center py-12">Cargando cupones...</div>
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-12">
          <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay cupones</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'No se encontraron cupones' : 'Genera cupones para comenzar'}
          </p>
          {!searchTerm && (
            <Button onClick={() => createCouponMutation.mutate()}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Cupón
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Código</th>
                  <th className="text-left py-3 px-4 font-medium">Estado</th>
                  <th className="text-left py-3 px-4 font-medium">Usado</th>
                  <th className="text-left py-3 px-4 font-medium">Usado Por</th>
                  <th className="text-left py-3 px-4 font-medium">Fecha Uso</th>
                  <th className="text-left py-3 px-4 font-medium">Usos</th>
                  <th className="text-right py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCoupons.map((coupon: Coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono">
                          {coupon.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCoupon(coupon.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={coupon.isActive ? 'default' : 'secondary'}>
                        {coupon.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={coupon.isUsed ? 'secondary' : 'outline'}>
                        {coupon.isUsed ? 'Usado' : 'Disponible'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {coupon.customer ? (
                        <div>
                          <div className="font-medium">{coupon.customer.name}</div>
                          <div className="text-xs text-gray-600">
                            {coupon.customer.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {coupon.usedAt ? (
                        <div>
                          <div>
                            {format(new Date(coupon.usedAt), 'dd/MM/yyyy', { locale: es })}
                          </div>
                          <div className="text-xs text-gray-600">
                            {format(new Date(coupon.usedAt), 'HH:mm', { locale: es })}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {coupon.currentUses}
                      {coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        {coupon.isActive && !coupon.isUsed && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deactivateMutation.mutate(coupon.id)}
                            disabled={deactivateMutation.isPending}
                          >
                            <Power className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bulk Generation Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Cupones Múltiples</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Cantidad *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="1000"
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(e.target.value)}
                placeholder="10"
              />
              <p className="text-xs text-gray-600">Máximo: 1000 cupones</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prefix">Prefijo (opcional)</Label>
              <Input
                id="prefix"
                value={bulkPrefix}
                onChange={(e) => setBulkPrefix(e.target.value.toUpperCase())}
                placeholder="Ej: PROMO"
                maxLength={10}
              />
              <p className="text-xs text-gray-600">
                Se agregará al inicio de cada código
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-1">
                Vista Previa del Código
              </div>
              <code className="text-sm">
                {bulkPrefix || ''}XXXXXXXX
              </code>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleGenerateBulk}
              disabled={
                generateBulkMutation.isPending ||
                !bulkQuantity ||
                parseInt(bulkQuantity) < 1 ||
                parseInt(bulkQuantity) > 1000
              }
            >
              {generateBulkMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                `Generar ${bulkQuantity} Cupones`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
