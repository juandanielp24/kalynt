'use client';

import { useNotifications } from '@/contexts/NotificationsContext';
import { Button, ScrollArea } from '@retail/ui';
import { NotificationItem } from './NotificationItem';
import { CheckCheck, Bell } from 'lucide-react';

interface NotificationsListProps {
  onClose?: () => void;
}

export function NotificationsList({ onClose }: NotificationsListProps) {
  const { notifications, unreadCount, markAllAsRead, isLoading } = useNotifications();

  if (isLoading) {
    return (
      <div className="p-4 text-center text-sm text-gray-500">Cargando notificaciones...</div>
    );
  }

  return (
    <div className="flex flex-col h-full max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && <p className="text-xs text-gray-500">{unreadCount} sin leer</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="h-4 w-4 mr-2" />
            Marcar todas
          </Button>
        )}
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-sm text-gray-500">No tienes notificaciones</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              window.location.href = '/notifications';
              onClose?.();
            }}
          >
            Ver todas las notificaciones
          </Button>
        </div>
      )}
    </div>
  );
}
