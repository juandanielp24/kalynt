import { useEffect } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';
import { useSyncStore } from '@/store/sync-store';
import { getPendingSales, deletePendingSale } from '@/lib/database';
import { apiClient } from '@/lib/api-client';

export function useOfflineSync() {
  const netInfo = useNetInfo();
  const { setSyncing, setLastSyncAt, decrementPendingChanges } = useSyncStore();

  useEffect(() => {
    if (netInfo.isConnected) {
      syncPendingSales();
    }
  }, [netInfo.isConnected]);

  const syncPendingSales = async () => {
    setSyncing(true);

    try {
      const pendingSales = await getPendingSales();

      for (const sale of pendingSales) {
        try {
          await apiClient.post('/api/sales', sale.data);
          deletePendingSale(sale.id);
          decrementPendingChanges();
        } catch (error) {
          console.error('Failed to sync sale:', sale.id, error);
        }
      }

      setLastSyncAt(Date.now());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  return {
    isOnline: netInfo.isConnected,
    syncPendingSales,
  };
}
