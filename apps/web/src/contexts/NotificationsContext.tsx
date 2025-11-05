'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useNotificationsSocket } from '@/hooks/use-notifications-socket';
import { useToast } from '@retail/ui';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  actionUrl?: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refetch: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isConnected, notifications: socketNotifications } = useNotificationsSocket();

  // Fetch notifications
  const { data: notificationsData, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications', {
        params: { limit: 50 },
      });
      return response.data.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch unread count
  const { data: unreadData } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: async () => {
      const response = await apiClient.get('/notifications/unread-count');
      return response.data.data.count;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast({
        title: 'Notificaciones marcadas como leídas',
      });
    },
  });

  // Delete mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    },
  });

  // Merge socket notifications with fetched notifications
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetched = notificationsData || [];
    const merged = [...socketNotifications, ...fetched].reduce((acc, notification) => {
      if (!acc.find((n) => n.id === notification.id)) {
        acc.push(notification);
      }
      return acc;
    }, [] as Notification[]);

    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setAllNotifications(merged);
  }, [notificationsData, socketNotifications]);

  // Show toast for new socket notifications
  useEffect(() => {
    if (socketNotifications.length > 0) {
      const latest = socketNotifications[0];
      toast({
        title: latest.title,
        description: latest.message,
      });

      // Invalidate queries to update counts
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
    }
  }, [socketNotifications, toast, queryClient]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications: allNotifications,
        unreadCount: unreadData || 0,
        isLoading,
        isConnected,
        markAsRead: markAsReadMutation.mutateAsync,
        markAllAsRead: markAllAsReadMutation.mutateAsync,
        deleteNotification: deleteNotificationMutation.mutateAsync,
        refetch,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}
