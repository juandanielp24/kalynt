'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subscriptionsApi } from '@/lib/api/subscriptions';
import { customersApi } from '@/lib/api/customers';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@retail/ui';
import { Loader2, Check } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  onClose: () => void;
}

export function SubscriptionForm({ onClose }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1); // 1: Plan, 2: Customer, 3: Confirm
  const [formData, setFormData] = useState({
    planId: '',
    customerId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    trialDays: '',
  });

  const { data: plansData } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => subscriptionsApi.getPlans({ isActive: true }),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getCustomers(),
  });

  const createMutation = useMutation({
    mutationFn: subscriptionsApi.createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      toast({ title: 'Suscripción creada correctamente' });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo crear la suscripción',
        variant: 'destructive',
      });
    },
  });

  const plans = plansData?.data || [];
  const customers = customersData?.data || [];

  const selectedPlan = plans.find((p: any) => p.id === formData.planId);

  const handleNext = () => {
    if (step === 1 && !formData.planId) {
      toast({ title: 'Selecciona un plan', variant: 'destructive' });
      return;
    }
    if (step === 2 && !formData.customerId) {
      toast({ title: 'Selecciona un cliente', variant: 'destructive' });
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      planId: formData.planId,
      customerId: formData.customerId,
      startDate: new Date(formData.startDate),
      trialDays: formData.trialDays ? parseInt(formData.trialDays) : undefined,
    };

    createMutation.mutate(data);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva Suscripción</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Plan Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-4">Selecciona un Plan</h3>

                <div className="grid grid-cols-1 gap-3">
                  {plans.map((plan: any) => (
                    <div
                      key={plan.id}
                      onClick={() => setFormData({ ...formData, planId: plan.id })}
                      className={`
                        p-4 border rounded-lg cursor-pointer transition-all
                        ${
                          formData.planId === plan.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold">{plan.name}</h4>
                          {plan.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {plan.description}
                            </p>
                          )}
                          <div className="mt-2">
                            <span className="text-2xl font-bold text-purple-600">
                              ${plan.price}
                            </span>
                            <span className="text-sm text-gray-600 ml-1">
                              / {plan.interval.toLowerCase()}
                            </span>
                          </div>

                          {plan.trialDays && (
                            <p className="text-sm text-green-600 mt-2">
                              ✓ {plan.trialDays} días de prueba gratis
                            </p>
                          )}
                        </div>

                        {formData.planId === plan.id && (
                          <div className="ml-4">
                            <div className="bg-purple-600 text-white rounded-full p-1">
                              <Check className="h-5 w-5" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Customer Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-4">Selecciona un Cliente</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Cliente *</Label>
                    <Select
                      value={formData.customerId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, customerId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer: any) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name} - {customer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Fecha de Inicio</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trialDays">
                      Días de Prueba (opcional, override)
                    </Label>
                    <Input
                      id="trialDays"
                      type="number"
                      value={formData.trialDays}
                      onChange={(e) =>
                        setFormData({ ...formData, trialDays: e.target.value })
                      }
                      placeholder={
                        selectedPlan?.trialDays
                          ? `Por defecto: ${selectedPlan.trialDays} días`
                          : 'Sin prueba'
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-4">Confirmar Suscripción</h3>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-semibold">{selectedPlan?.name}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Cliente:</span>
                    <span className="font-semibold">
                      {customers.find((c: any) => c.id === formData.customerId)?.name}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio:</span>
                    <span className="font-semibold text-purple-600">
                      ${selectedPlan?.price} / {selectedPlan?.interval.toLowerCase()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha de inicio:</span>
                    <span className="font-semibold">
                      {format(new Date(formData.startDate), 'dd/MM/yyyy')}
                    </span>
                  </div>

                  {(formData.trialDays || selectedPlan?.trialDays) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Período de prueba:</span>
                      <span className="font-semibold text-green-600">
                        {formData.trialDays || selectedPlan?.trialDays} días gratis
                      </span>
                    </div>
                  )}

                  {selectedPlan?.setupFee && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Cargo inicial:</span>
                      <span className="font-semibold">${selectedPlan.setupFee}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={handleBack}>
                Atrás
              </Button>
            )}

            {step < 3 ? (
              <Button type="button" onClick={handleNext}>
                Siguiente
              </Button>
            ) : (
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Suscripción'
                )}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
