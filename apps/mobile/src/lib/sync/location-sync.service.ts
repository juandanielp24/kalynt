import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { locationsApi } from '../api/locations';

// Storage keys
const STORAGE_KEYS = {
  LOCATIONS: '@locations',
  TRANSFERS: '@transfers',
  SYNC_QUEUE: '@sync_queue',
  LAST_SYNC: '@last_sync',
};

// Sync queue item interface
interface SyncQueueItem {
  id: string;
  type: 'CREATE_TRANSFER' | 'APPROVE_TRANSFER' | 'SEND_TRANSFER' | 'RECEIVE_TRANSFER' | 'REJECT_TRANSFER' | 'CANCEL_TRANSFER';
  data: any;
  timestamp: number;
  retries: number;
  error?: string;
}

// Transfer cache interface
interface TransferCache {
  id: string;
  data: any;
  timestamp: number;
  status: 'PENDING' | 'SYNCED' | 'ERROR';
}

class LocationSyncService {
  private isOnline: boolean = true;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing: boolean = false;

  constructor() {
    this.initializeNetworkListener();
  }

  /**
   * Initialize network connectivity listener
   */
  private initializeNetworkListener() {
    NetInfo.addEventListener((state) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Auto-sync when coming back online
      if (wasOffline && this.isOnline) {
        console.log('[LocationSync] Network restored, triggering sync...');
        this.processSyncQueue();
      }
    });
  }

  /**
   * Start auto-sync interval (every 5 minutes)
   */
  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        console.log('[LocationSync] Auto-sync triggered');
        this.syncAll();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop auto-sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync all data (locations and transfers)
   */
  async syncAll(): Promise<void> {
    if (!this.isOnline) {
      console.log('[LocationSync] Offline, skipping sync');
      return;
    }

    if (this.isSyncing) {
      console.log('[LocationSync] Sync already in progress');
      return;
    }

    this.isSyncing = true;

    try {
      console.log('[LocationSync] Starting full sync...');

      // Sync locations
      await this.syncLocations();

      // Sync transfers
      await this.syncTransfers();

      // Process pending operations in queue
      await this.processSyncQueue();

      // Update last sync timestamp
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

      console.log('[LocationSync] Full sync completed');
    } catch (error) {
      console.error('[LocationSync] Sync failed:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync locations from server
   */
  async syncLocations(): Promise<void> {
    try {
      const response = await locationsApi.getLocations();
      const locations = response.data;

      await AsyncStorage.setItem(STORAGE_KEYS.LOCATIONS, JSON.stringify(locations));
      console.log(`[LocationSync] Synced ${locations.length} locations`);
    } catch (error) {
      console.error('[LocationSync] Failed to sync locations:', error);
      throw error;
    }
  }

  /**
   * Sync transfers from server
   */
  async syncTransfers(): Promise<void> {
    try {
      const response = await locationsApi.getTransfers({});
      const transfers = response.data;

      await AsyncStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
      console.log(`[LocationSync] Synced ${transfers.length} transfers`);
    } catch (error) {
      console.error('[LocationSync] Failed to sync transfers:', error);
      throw error;
    }
  }

  /**
   * Get cached locations
   */
  async getCachedLocations(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.LOCATIONS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('[LocationSync] Failed to get cached locations:', error);
      return [];
    }
  }

  /**
   * Get cached transfers
   */
  async getCachedTransfers(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.TRANSFERS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('[LocationSync] Failed to get cached transfers:', error);
      return [];
    }
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('[LocationSync] Failed to get last sync time:', error);
      return null;
    }
  }

  /**
   * Add operation to sync queue
   */
  private async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      const queue: SyncQueueItem[] = queueJson ? JSON.parse(queueJson) : [];

      const queueItem: SyncQueueItem = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retries: 0,
      };

      queue.push(queueItem);
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));

      console.log(`[LocationSync] Added ${item.type} to sync queue`);

      // Try to process immediately if online
      if (this.isOnline) {
        this.processSyncQueue();
      }
    } catch (error) {
      console.error('[LocationSync] Failed to add to sync queue:', error);
      throw error;
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue(): Promise<void> {
    if (!this.isOnline) {
      console.log('[LocationSync] Offline, cannot process queue');
      return;
    }

    try {
      const queueJson = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      if (!queueJson) return;

      const queue: SyncQueueItem[] = JSON.parse(queueJson);
      if (queue.length === 0) return;

      console.log(`[LocationSync] Processing ${queue.length} items in queue...`);

      const remainingQueue: SyncQueueItem[] = [];

      for (const item of queue) {
        try {
          await this.processQueueItem(item);
          console.log(`[LocationSync] Successfully processed ${item.type}`);
        } catch (error: any) {
          console.error(`[LocationSync] Failed to process ${item.type}:`, error);

          // Retry logic (max 3 retries)
          if (item.retries < 3) {
            remainingQueue.push({
              ...item,
              retries: item.retries + 1,
              error: error.message,
            });
          } else {
            console.error(`[LocationSync] Max retries reached for ${item.type}, discarding`);
          }
        }
      }

      // Update queue with remaining items
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(remainingQueue));

      if (remainingQueue.length > 0) {
        console.log(`[LocationSync] ${remainingQueue.length} items remaining in queue`);
      } else {
        console.log('[LocationSync] Queue processed successfully');
      }
    } catch (error) {
      console.error('[LocationSync] Failed to process sync queue:', error);
      throw error;
    }
  }

  /**
   * Process individual queue item
   */
  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'CREATE_TRANSFER':
        await locationsApi.createTransfer(item.data);
        break;

      case 'APPROVE_TRANSFER':
        await locationsApi.approveTransfer(item.data.transferId, item.data.notes);
        break;

      case 'SEND_TRANSFER':
        await locationsApi.sendTransfer(item.data.transferId, item.data.shipping);
        break;

      case 'RECEIVE_TRANSFER':
        await locationsApi.receiveTransfer(item.data.transferId, item.data.received);
        break;

      case 'REJECT_TRANSFER':
        await locationsApi.rejectTransfer(item.data.transferId, item.data.reason);
        break;

      case 'CANCEL_TRANSFER':
        await locationsApi.cancelTransfer(item.data.transferId, item.data.reason);
        break;

      default:
        throw new Error(`Unknown queue item type: ${item.type}`);
    }
  }

  /**
   * Create transfer (offline-capable)
   */
  async createTransferOffline(data: any): Promise<{ success: boolean; offline: boolean; transferId?: string }> {
    if (this.isOnline) {
      try {
        const response = await locationsApi.createTransfer(data);
        return { success: true, offline: false, transferId: response.data.id };
      } catch (error) {
        console.error('[LocationSync] Failed to create transfer online, queuing for offline:', error);
      }
    }

    // Queue for offline processing
    await this.addToSyncQueue({
      type: 'CREATE_TRANSFER',
      data,
    });

    return { success: true, offline: true };
  }

  /**
   * Approve transfer (offline-capable)
   */
  async approveTransferOffline(transferId: string, notes?: string): Promise<{ success: boolean; offline: boolean }> {
    if (this.isOnline) {
      try {
        await locationsApi.approveTransfer(transferId, notes);
        return { success: true, offline: false };
      } catch (error) {
        console.error('[LocationSync] Failed to approve transfer online, queuing for offline:', error);
      }
    }

    // Queue for offline processing
    await this.addToSyncQueue({
      type: 'APPROVE_TRANSFER',
      data: { transferId, notes },
    });

    return { success: true, offline: true };
  }

  /**
   * Send transfer (offline-capable)
   */
  async sendTransferOffline(transferId: string, shipping: any): Promise<{ success: boolean; offline: boolean }> {
    if (this.isOnline) {
      try {
        await locationsApi.sendTransfer(transferId, shipping);
        return { success: true, offline: false };
      } catch (error) {
        console.error('[LocationSync] Failed to send transfer online, queuing for offline:', error);
      }
    }

    // Queue for offline processing
    await this.addToSyncQueue({
      type: 'SEND_TRANSFER',
      data: { transferId, shipping },
    });

    return { success: true, offline: true };
  }

  /**
   * Receive transfer (offline-capable)
   */
  async receiveTransferOffline(transferId: string, received: any): Promise<{ success: boolean; offline: boolean }> {
    if (this.isOnline) {
      try {
        await locationsApi.receiveTransfer(transferId, received);
        return { success: true, offline: false };
      } catch (error) {
        console.error('[LocationSync] Failed to receive transfer online, queuing for offline:', error);
      }
    }

    // Queue for offline processing
    await this.addToSyncQueue({
      type: 'RECEIVE_TRANSFER',
      data: { transferId, received },
    });

    return { success: true, offline: true };
  }

  /**
   * Reject transfer (offline-capable)
   */
  async rejectTransferOffline(transferId: string, reason: string): Promise<{ success: boolean; offline: boolean }> {
    if (this.isOnline) {
      try {
        await locationsApi.rejectTransfer(transferId, reason);
        return { success: true, offline: false };
      } catch (error) {
        console.error('[LocationSync] Failed to reject transfer online, queuing for offline:', error);
      }
    }

    // Queue for offline processing
    await this.addToSyncQueue({
      type: 'REJECT_TRANSFER',
      data: { transferId, reason },
    });

    return { success: true, offline: true };
  }

  /**
   * Cancel transfer (offline-capable)
   */
  async cancelTransferOffline(transferId: string, reason: string): Promise<{ success: boolean; offline: boolean }> {
    if (this.isOnline) {
      try {
        await locationsApi.cancelTransfer(transferId, reason);
        return { success: true, offline: false };
      } catch (error) {
        console.error('[LocationSync] Failed to cancel transfer online, queuing for offline:', error);
      }
    }

    // Queue for offline processing
    await this.addToSyncQueue({
      type: 'CANCEL_TRANSFER',
      data: { transferId, reason },
    });

    return { success: true, offline: true };
  }

  /**
   * Get sync queue status
   */
  async getSyncQueueStatus(): Promise<{ total: number; items: SyncQueueItem[] }> {
    try {
      const queueJson = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      const queue: SyncQueueItem[] = queueJson ? JSON.parse(queueJson) : [];

      return {
        total: queue.length,
        items: queue,
      };
    } catch (error) {
      console.error('[LocationSync] Failed to get sync queue status:', error);
      return { total: 0, items: [] };
    }
  }

  /**
   * Force sync now
   */
  async forceSync(): Promise<void> {
    console.log('[LocationSync] Force sync requested');
    await this.syncAll();
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.LOCATIONS,
        STORAGE_KEYS.TRANSFERS,
        STORAGE_KEYS.SYNC_QUEUE,
        STORAGE_KEYS.LAST_SYNC,
      ]);
      console.log('[LocationSync] Cache cleared');
    } catch (error) {
      console.error('[LocationSync] Failed to clear cache:', error);
      throw error;
    }
  }

  /**
   * Check if online
   */
  isConnected(): boolean {
    return this.isOnline;
  }
}

// Export singleton instance
export const locationSyncService = new LocationSyncService();
