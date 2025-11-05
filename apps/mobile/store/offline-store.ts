import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import NetInfo from '@react-native-community/netinfo';

interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingSyncCount: number;
  syncError: string | null;

  // Actions
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncAt: (date: Date) => void;
  setPendingSyncCount: (count: number) => void;
  setSyncError: (error: string | null) => void;

  // Computed
  needsSync: () => boolean;
}

export const useOfflineStore = create<OfflineState>()(
  immer((set, get) => ({
    isOnline: true,
    isSyncing: false,
    lastSyncAt: null,
    pendingSyncCount: 0,
    syncError: null,

    setOnlineStatus: (isOnline) => {
      set((state) => {
        state.isOnline = isOnline;
      });
    },

    setSyncing: (isSyncing) => {
      set((state) => {
        state.isSyncing = isSyncing;
      });
    },

    setLastSyncAt: (date) => {
      set((state) => {
        state.lastSyncAt = date;
      });
    },

    setPendingSyncCount: (count) => {
      set((state) => {
        state.pendingSyncCount = count;
      });
    },

    setSyncError: (error) => {
      set((state) => {
        state.syncError = error;
      });
    },

    needsSync: () => {
      const state = get();
      return state.pendingSyncCount > 0 && state.isOnline && !state.isSyncing;
    },
  }))
);

// Monitor network status
NetInfo.addEventListener((state) => {
  useOfflineStore.getState().setOnlineStatus(state.isConnected ?? false);
});
