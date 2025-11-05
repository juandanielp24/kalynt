'use client';

import { useNotifications } from '@/contexts/NotificationsContext';
import { Button } from '@retail/ui';
import { X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    read: boolean;
    createdAt: Date;
  };
  onClose?: () => void;
}

const NOTIFICATION_ICONS: Record<string, string> = {
  low_stock: '📦',
  sale: '💰',
  invoice: '🧾',
  alert: '⚠️',
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '❌',
};

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotifications();
  const router = useRouter();

  const handleClick = async () => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      onClose?.();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notification.id);
  };

  const icon = NOTIFICATION_ICONS[notification.type] || '🔔';

  return (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer relative ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full" />
      )}

      <div className="flex gap-3 pl-4">
        {/* Icon */}
        <div className="text-2xl flex-shrink-0">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm line-clamp-1">{notification.title}</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={handleDelete}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{notification.message}</p>

          <p className="text-xs text-gray-400 mt-2">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
