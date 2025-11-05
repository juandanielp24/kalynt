import React, { createContext, useContext, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { syncService } from '../services/sync-service';
import { useOfflineStore } from '../../store/offline-store';

interface SyncContextType {
  syncNow: () => Promise<void>;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingCount: number;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { isSyncing, lastSyncAt, pendingSyncCount } = useOfflineStore();

  useEffect(() => {
    // Start auto-sync
    syncService.startAutoSync(60000); // Every minute

    // Update pending count
    const updatePendingCount = async () => {
      const count = await syncService.countPendingOperations();
      useOfflineStore.getState().setPendingSyncCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 10000); // Every 10 seconds

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground, sync
        syncService.forceSyncNow();
      }
    });

    return () => {
      syncService.stopAutoSync();
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const syncNow = async () => {
    await syncService.forceSyncNow();
  };

  return (
    <SyncContext.Provider
      value={{
        syncNow,
        isSyncing,
        lastSyncAt,
        pendingCount: pendingSyncCount,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within SyncProvider');
  }
  return context;
}
