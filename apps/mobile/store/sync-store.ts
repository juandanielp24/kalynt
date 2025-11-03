import { create } from 'zustand';

interface SyncStore {
  isSyncing: boolean;
  lastSyncAt: number | null;
  pendingChanges: number;

  setSyncing: (syncing: boolean) => void;
  setLastSyncAt: (timestamp: number) => void;
  setPendingChanges: (count: number) => void;
  incrementPendingChanges: () => void;
  decrementPendingChanges: () => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  isSyncing: false,
  lastSyncAt: null,
  pendingChanges: 0,

  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSyncAt: (timestamp) => set({ lastSyncAt: timestamp }),
  setPendingChanges: (count) => set({ pendingChanges: count }),
  incrementPendingChanges: () =>
    set((state) => ({ pendingChanges: state.pendingChanges + 1 })),
  decrementPendingChanges: () =>
    set((state) => ({ pendingChanges: Math.max(0, state.pendingChanges - 1) })),
}));
