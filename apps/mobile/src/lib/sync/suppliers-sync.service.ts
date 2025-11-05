import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { suppliersApi } from '../api/suppliers';

// Storage keys
const STORAGE_KEYS = {
  SUPPLIERS: '@suppliers',
  PURCHASE_ORDERS: '@purchase_orders',
  SYNC_QUEUE: '@suppliers_sync_queue',
  LAST_SYNC: '@suppliers_last_sync',
};

// Sync queue item interface
interface SyncQueueItem {
  id: string;
  type:
    | 'CREATE_SUPPLIER'
    | 'UPDATE_SUPPLIER'
    | 'CREATE_PURCHASE_ORDER'
    | 'SEND_PURCHASE_ORDER'
    | 'CONFIRM_PURCHASE_ORDER'
    | 'RECEIVE_PURCHASE_ORDER'
    | 'CANCEL_PURCHASE_ORDER'
    | 'CREATE_PAYMENT';
  data: any;
  timestamp: number;
  retries: number;
  error?: string;
}

class SuppliersSyncService {
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
        console.log('[SupplersSync] Network restored, triggering sync...');
        this.processSyncQueue();
      }
    });
  }

  /**
   * Start auto-sync interval (every 10 minutes)
   */
  startAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        console.log('[SuppliersSync] Auto-sync triggered');
        this.syncAll();
      }
    }, 10 * 60 * 1000); // 10 minutes
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
   * Sync all data (suppliers and purchase orders)
   */
  async syncAll(): Promise<void> {
    if (!this.isOnline) {
      console.log('[SuppliersSync] Offline, skipping sync');
      return;
    }

    if (this.isSyncing) {
      console.log('[SuppliersSync] Sync already in progress');
      return;
    }

    this.isSyncing = true;

    try {
      console.log('[SuppliersSync] Starting full sync...');

      // Sync suppliers
      await this.syncSuppliers();

      // Sync purchase orders
      await this.syncPurchaseOrders();

      // Process pending operations in queue
      await this.processSyncQueue();

      // Update last sync timestamp
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());

      console.log('[SuppliersSync] Full sync completed');
    } catch (error) {
      console.error('[SuppliersSync] Sync failed:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync suppliers from server
   */
  async syncSuppliers(): Promise<void> {
    try {
      const response = await suppliersApi.getSuppliers();
      const suppliers = response.data;

      await AsyncStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
      console.log(`[SuppliersSync] Synced ${suppliers.length} suppliers`);
    } catch (error) {
      console.error('[SuppliersSync] Failed to sync suppliers:', error);
      throw error;
    }
  }

  /**
   * Sync purchase orders from server
   */
  async syncPurchaseOrders(): Promise<void> {
    try {
      const response = await suppliersApi.getPurchaseOrders({});
      const orders = response.data?.orders || [];

      await AsyncStorage.setItem(STORAGE_KEYS.PURCHASE_ORDERS, JSON.stringify(orders));
      console.log(`[SuppliersSync] Synced ${orders.length} purchase orders`);
    } catch (error) {
      console.error('[SuppliersSync] Failed to sync purchase orders:', error);
      throw error;
    }
  }

  /**
   * Get cached suppliers
   */
  async getCachedSuppliers(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.SUPPLIERS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('[SuppliersSync] Failed to get cached suppliers:', error);
      return [];
    }
  }

  /**
   * Get cached purchase orders
   */
  async getCachedPurchaseOrders(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.PURCHASE_ORDERS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('[SuppliersSync] Failed to get cached purchase orders:', error);
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
      console.error('[SuppliersSync] Failed to get last sync time:', error);
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

      console.log(`[SuppliersSync] Added ${item.type} to sync queue`);

      // Try to process immediately if online
      if (this.isOnline) {
        this.processSyncQueue();
      }
    } catch (error) {
      console.error('[SuppliersSync] Failed to add to sync queue:', error);
      throw error;
    }
  }

  /**
   * Process sync queue
   */
  async processSyncQueue(): Promise<void> {
    if (!this.isOnline) {
      console.log('[SuppliersSync] Offline, cannot process queue');
      return;
    }

    try {
      const queueJson = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      if (!queueJson) return;

      const queue: SyncQueueItem[] = JSON.parse(queueJson);
      if (queue.length === 0) return;

      console.log(`[SuppliersSync] Processing ${queue.length} items in queue...`);

      const remainingQueue: SyncQueueItem[] = [];

      for (const item of queue) {
        try {
          await this.processQueueItem(item);
          console.log(`[SuppliersSync] Successfully processed ${item.type}`);
        } catch (error: any) {
          console.error(`[SuppliersSync] Failed to process ${item.type}:`, error);

          // Retry logic (max 3 retries)
          if (item.retries < 3) {
            remainingQueue.push({
              ...item,
              retries: item.retries + 1,
              error: error.message,
            });
          } else {
            console.error(`[SuppliersSync] Max retries reached for ${item.type}, discarding`);
          }
        }
      }

      // Update queue with remaining items
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(remainingQueue));

      if (remainingQueue.length > 0) {
        console.log(`[SuppliersSync] ${remainingQueue.length} items remaining in queue`);
      } else {
        console.log('[SuppliersSync] Queue processed successfully');
      }
    } catch (error) {
      console.error('[SuppliersSync] Failed to process sync queue:', error);
      throw error;
    }
  }

  /**
   * Process individual queue item
   */
  private async processQueueItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'CREATE_SUPPLIER':
        await suppliersApi.createSupplier(item.data);
        break;

      case 'UPDATE_SUPPLIER':
        await suppliersApi.updateSupplier(item.data.id, item.data);
        break;

      case 'CREATE_PURCHASE_ORDER':
        await suppliersApi.createPurchaseOrder(item.data);
        break;

      case 'SEND_PURCHASE_ORDER':
        await suppliersApi.sendPurchaseOrder(item.data.orderId);
        break;

      case 'CONFIRM_PURCHASE_ORDER':
        await suppliersApi.confirmPurchaseOrder(item.data.orderId);
        break;

      case 'RECEIVE_PURCHASE_ORDER':
        await suppliersApi.receivePurchaseOrder(item.data.orderId, item.data.receiveData);
        break;

      case 'CANCEL_PURCHASE_ORDER':
        await suppliersApi.cancelPurchaseOrder(item.data.orderId, item.data.reason);
        break;

      case 'CREATE_PAYMENT':
        await suppliersApi.createPayment(item.data);
        break;

      default:
        throw new Error(`Unknown queue item type: ${(item as any).type}`);
    }
  }

  /**
   * Create purchase order (offline-capable)
   */
  async createPurchaseOrderOffline(data: any): Promise<{ success: boolean; offline: boolean; orderId?: string }> {
    if (this.isOnline) {
      try {
        const response = await suppliersApi.createPurchaseOrder(data);
        return { success: true, offline: false, orderId: response.data.id };
      } catch (error) {
        console.error('[SuppliersSync] Failed to create purchase order online, queuing for offline:', error);
      }
    }

    // Queue for offline processing
    await this.addToSyncQueue({
      type: 'CREATE_PURCHASE_ORDER',
      data,
    });

    return { success: true, offline: true };
  }

  /**
   * Receive purchase order (offline-capable)
   */
  async receivePurchaseOrderOffline(
    orderId: string,
    receiveData: any
  ): Promise<{ success: boolean; offline: boolean }> {
    if (this.isOnline) {
      try {
        await suppliersApi.receivePurchaseOrder(orderId, receiveData);
        return { success: true, offline: false };
      } catch (error) {
        console.error('[SuppliersSync] Failed to receive order online, queuing for offline:', error);
      }
    }

    // Queue for offline processing
    await this.addToSyncQueue({
      type: 'RECEIVE_PURCHASE_ORDER',
      data: { orderId, receiveData },
    });

    return { success: true, offline: true };
  }

  /**
   * Create payment (offline-capable)
   */
  async createPaymentOffline(data: any): Promise<{ success: boolean; offline: boolean }> {
    if (this.isOnline) {
      try {
        await suppliersApi.createPayment(data);
        return { success: true, offline: false };
      } catch (error) {
        console.error('[SuppliersSync] Failed to create payment online, queuing for offline:', error);
      }
    }

    // Queue for offline processing
    await this.addToSyncQueue({
      type: 'CREATE_PAYMENT',
      data,
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
      console.error('[SuppliersSync] Failed to get sync queue status:', error);
      return { total: 0, items: [] };
    }
  }

  /**
   * Force sync now
   */
  async forceSync(): Promise<void> {
    console.log('[SuppliersSync] Force sync requested');
    await this.syncAll();
  }

  /**
   * Clear all cached data
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SUPPLIERS,
        STORAGE_KEYS.PURCHASE_ORDERS,
        STORAGE_KEYS.SYNC_QUEUE,
        STORAGE_KEYS.LAST_SYNC,
      ]);
      console.log('[SuppliersSync] Cache cleared');
    } catch (error) {
      console.error('[SuppliersSync] Failed to clear cache:', error);
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
export const suppliersSyncService = new SuppliersSyncService();
