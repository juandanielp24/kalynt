'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  promotionsApi,
  Promotion,
  PROMOTION_TYPE_LABELS,
  DISCOUNT_TYPE_LABELS,
} from '@/lib/api/promotions';
import {
  Card,
  CardContent,
  Badge,
  Button,
  useToast,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@retail/ui';
import {
  Edit,
  Trash2,
  Power,
  Eye,
  Calendar,
  Users,
  TrendingUp,
  Gift,
  Copy,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CouponsManager } from './CouponsManager';
import { PromotionStats } from './PromotionStats';

interface Props {
  promotions: Promotion[];
  onEdit: (promotion: Promotion) => void;
}

export function PromotionsList({ promotions, onEdit }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [viewingStats, setViewingStats] = useState<Promotion | null>(null);

  const toggleStatusMutation = useMutation({
    mutationFn: promotionsApi.togglePromotionStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast({
        title: 'Estado actualizado',
        description: 'El estado de la promoción se actualizó correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar el estado',
        variant: 'destructive',
      });
    },
  });

  const deletePromotionMutation = useMutation({
    mutationFn: promotionsApi.deletePromotion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast({
        title: 'Promoción eliminada',
        description: 'La promoción se eliminó correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo eliminar la promoción',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta promoción?')) {
      await deletePromotionMutation.mutateAsync(id);
    }
  };

  if (promotions.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay promociones</h3>
          <p className="text-gray-600">Crea tu primera promoción para comenzar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {promotions.map((promotion) => {
          const isExpired = new Date(promotion.endDate) < new Date();
          const daysLeft = Math.ceil(
            (new Date(promotion.endDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          );

          return (
            <Card
              key={promotion.id}
              className={`hover:shadow-lg transition-shadow ${
                !promotion.isActive ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{promotion.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={promotion.isActive ? 'default' : 'secondary'}>
                        {promotion.isActive ? 'Activa' : 'Inactiva'}
                      </Badge>
                      <Badge variant="outline">
                        {PROMOTION_TYPE_LABELS[promotion.type]}
                      </Badge>
                      {isExpired && <Badge variant="destructive">Expirada</Badge>}
                    </div>
                  </div>
                </div>

                {promotion.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {promotion.description}
                  </p>
                )}

                {/* Discount Info */}
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <div className="text-sm text-gray-600 mb-1">Descuento</div>
                  <div className="font-bold text-blue-600 text-xl">
                    {promotion.discountType === 'PERCENTAGE'
                      ? `${promotion.discountValue}% OFF`
                      : promotion.discountType === 'FIXED_AMOUNT'
                      ? `$${promotion.discountValue} OFF`
                      : DISCOUNT_TYPE_LABELS[promotion.discountType]}
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(promotion.startDate), 'dd/MM/yyyy', { locale: es })} -{' '}
                    {format(new Date(promotion.endDate), 'dd/MM/yyyy', { locale: es })}
                  </span>
                </div>

                {!isExpired && daysLeft <= 7 && (
                  <div className="text-sm text-orange-600 mb-3">
                    ⚠️ Expira en {daysLeft} {daysLeft === 1 ? 'día' : 'días'}
                  </div>
                )}

                {/* Code */}
                {promotion.code && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
                      {promotion.code}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(promotion.code!);
                        toast({ title: 'Código copiado' });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Usage Stats */}
                <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="text-gray-600">Usos</div>
                    <div className="font-semibold">
                      {promotion.currentUses}
                      {promotion.maxUses ? ` / ${promotion.maxUses}` : ''}
                    </div>
                  </div>
                  {promotion._count && (
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-gray-600">Cupones</div>
                      <div className="font-semibold">{promotion._count.coupons}</div>
                    </div>
                  )}
                </div>

                {/* Min Purchase */}
                {promotion.minPurchaseAmount && (
                  <div className="text-sm text-gray-600 mb-4">
                    💰 Compra mínima: ${promotion.minPurchaseAmount}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingStats(promotion)}
                    className="flex-1"
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Stats
                  </Button>

                  {promotion.type === 'COUPON' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedPromotion(promotion)}
                      className="flex-1"
                    >
                      <Gift className="h-4 w-4 mr-1" />
                      Cupones
                    </Button>
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleStatusMutation.mutate(promotion.id)}
                    disabled={toggleStatusMutation.isPending}
                  >
                    <Power className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(promotion)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(promotion.id)}
                    disabled={deletePromotionMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Coupons Manager Dialog */}
      <Dialog
        open={!!selectedPromotion}
        onOpenChange={() => setSelectedPromotion(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cupones - {selectedPromotion?.name}</DialogTitle>
          </DialogHeader>

          {selectedPromotion && <CouponsManager promotion={selectedPromotion} />}
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={!!viewingStats} onOpenChange={() => setViewingStats(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Estadísticas - {viewingStats?.name}</DialogTitle>
          </DialogHeader>

          {viewingStats && <PromotionStats promotionId={viewingStats.id} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
