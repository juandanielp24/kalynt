'use client';

import { useNotifications } from '@/contexts/NotificationsContext';
import { Button, Card, CardContent } from '@retail/ui';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { NotificationsSettings } from '@/components/notifications/NotificationsSettings';
import { CheckCheck, Bell } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAllAsRead, isLoading } = useNotifications();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notificaciones</h1>
          {unreadCount > 0 && (
            <p className="text-gray-600 mt-1">
              Tienes {unreadCount} notificación{unreadCount > 1 ? 'es' : ''} sin leer
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar todas como leídas
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Cargando notificaciones...</div>
              ) : notifications.length === 0 ? (
                <div className="p-12 text-center">
                  <Bell className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No tienes notificaciones
                  </h3>
                  <p className="text-gray-500">
                    Cuando tengas nuevas notificaciones, aparecerán aquí
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <div>
          <NotificationsSettings />
        </div>
      </div>
    </div>
  );
}
