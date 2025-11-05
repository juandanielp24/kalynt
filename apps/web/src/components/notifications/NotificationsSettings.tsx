'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Card, CardHeader, CardTitle, CardContent, Switch, Label, useToast } from '@retail/ui';

export function NotificationsSettings() {
  const { toast } = useToast();

  const { data: prefsData } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications/preferences');
      return response.data.data;
    },
  });

  const [preferences, setPreferences] = useState({
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    inAppEnabled: true,
  });

  useEffect(() => {
    if (prefsData) {
      setPreferences(prefsData);
    }
  }, [prefsData]);

  const updateMutation = useMutation({
    mutationFn: async (prefs: typeof preferences) => {
      await apiClient.patch('/notifications/preferences', prefs);
    },
    onSuccess: () => {
      toast({
        title: 'Preferencias actualizadas',
        description: 'Tus preferencias de notificaciones han sido guardadas',
      });
    },
  });

  const handleToggle = (key: keyof typeof preferences) => {
    const newPrefs = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPrefs);
    updateMutation.mutate(newPrefs);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferencias de Notificaciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email">Email</Label>
            <p className="text-sm text-gray-500">Recibe notificaciones por correo electrónico</p>
          </div>
          <Switch
            id="email"
            checked={preferences.emailEnabled}
            onCheckedChange={() => handleToggle('emailEnabled')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sms">SMS</Label>
            <p className="text-sm text-gray-500">Recibe alertas importantes por SMS</p>
          </div>
          <Switch
            id="sms"
            checked={preferences.smsEnabled}
            onCheckedChange={() => handleToggle('smsEnabled')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push">Push Notifications</Label>
            <p className="text-sm text-gray-500">Notificaciones push en dispositivos móviles</p>
          </div>
          <Switch
            id="push"
            checked={preferences.pushEnabled}
            onCheckedChange={() => handleToggle('pushEnabled')}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="inapp">En la App</Label>
            <p className="text-sm text-gray-500">
              Notificaciones en tiempo real dentro de la aplicación
            </p>
          </div>
          <Switch
            id="inapp"
            checked={preferences.inAppEnabled}
            onCheckedChange={() => handleToggle('inAppEnabled')}
          />
        </div>
      </CardContent>
    </Card>
  );
}
