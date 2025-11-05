import { db } from '../db';
import { syncQueue, localSales, localSaleItems, products, stock, syncMetadata } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { apiClient } from '../../lib/api-client';
import { useOfflineStore } from '../../store/offline-store';

export class SyncService {
  private static instance: SyncService;
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Start automatic sync
   */
  startAutoSync(intervalMs: number = 60000) {
    this.stopAutoSync();

    this.syncInterval = setInterval(() => {
      const { needsSync } = useOfflineStore.getState();
      if (needsSync()) {
        this.syncAll();
      }
    }, intervalMs);

    // Initial sync
    this.syncAll();
  }

  /**
   * Stop automatic sync
   */
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Sync all pending data
   */
  async syncAll() {
    const { isOnline, isSyncing } = useOfflineStore.getState();

    if (!isOnline || isSyncing) {
      return;
    }

    try {
      useOfflineStore.getState().setSyncing(true);
      useOfflineStore.getState().setSyncError(null);

      // 1. Sync pending sales to server
      await this.syncPendingSales();

      // 2. Pull latest data from server
      await this.pullLatestData();

      // 3. Update sync metadata
      await this.updateSyncMetadata();

      useOfflineStore.getState().setLastSyncAt(new Date());
      useOfflineStore.getState().setPendingSyncCount(0);
    } catch (error: any) {
      console.error('Sync failed:', error);
      useOfflineStore.getState().setSyncError(error.message);
    } finally {
      useOfflineStore.getState().setSyncing(false);
    }
  }

  /**
   * Sync pending sales to server
   */
  private async syncPendingSales() {
    // Get pending sales
    const pendingSales = await db.query.localSales.findMany({
      where: eq(localSales.syncStatus, 'pending'),
    });

    for (const sale of pendingSales) {
      try {
        // Mark as syncing
        await db
          .update(localSales)
          .set({ syncStatus: 'syncing' })
          .where(eq(localSales.id, sale.id));

        // Get sale items
        const items = await db.query.localSaleItems.findMany({
          where: eq(localSaleItems.localSaleId, sale.id),
        });

        // Send to server
        const response = await apiClient.post('/sales', {
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            discountPercent: item.discountPercent,
          })),
          paymentMethod: sale.paymentMethod,
          customerName: sale.customerName,
          customerEmail: sale.customerEmail,
          customerCuit: sale.customerCuit,
          customerPhone: sale.customerPhone,
          notes: sale.notes,
          generateInvoice: sale.generateInvoice,
          invoiceType: sale.invoiceType,
          localSaleId: sale.id, // Send local ID for reference
        });

        const serverSale = response.data.data;

        // Update local sale with server data
        await db
          .update(localSales)
          .set({
            syncStatus: 'synced',
            syncedAt: new Date(),
            serverId: serverSale.id,
            saleNumber: serverSale.saleNumber,
            invoiceNumber: serverSale.invoiceNumber,
            cae: serverSale.cae,
          })
          .where(eq(localSales.id, sale.id));

        console.log(`Sale ${sale.id} synced successfully`);
      } catch (error: any) {
        console.error(`Failed to sync sale ${sale.id}:`, error);

        await db
          .update(localSales)
          .set({
            syncStatus: 'error',
            syncError: error.message,
          })
          .where(eq(localSales.id, sale.id));
      }
    }
  }

  /**
   * Pull latest data from server
   */
  private async pullLatestData() {
    try {
      // Get last sync timestamp
      const lastSync = await db.query.syncMetadata.findFirst({
        where: eq(syncMetadata.key, 'last_pull_sync'),
      });

      const since = lastSync?.value || null;

      // Pull products
      const productsResponse = await apiClient.get('/products', {
        params: {
          since,
          limit: 1000,
        },
      });

      const productsData = productsResponse.data.data;

      // Upsert products
      for (const product of productsData) {
        await db
          .insert(products)
          .values({
            id: product.id,
            tenantId: product.tenantId,
            sku: product.sku,
            name: product.name,
            barcode: product.barcode,
            priceCents: product.priceCents,
            costCents: product.costCents,
            taxRate: product.taxRate,
            categoryId: product.categoryId,
            imageUrl: product.imageUrl,
            isActive: product.isActive,
            syncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: products.id,
            set: {
              name: product.name,
              priceCents: product.priceCents,
              syncedAt: new Date(),
            },
          });
      }

      // Pull stock
      const stockResponse = await apiClient.get('/stock', {
        params: {
          since,
          limit: 1000,
        },
      });

      const stockData = stockResponse.data.data;

      // Upsert stock
      for (const stockItem of stockData) {
        await db
          .insert(stock)
          .values({
            id: stockItem.id,
            tenantId: stockItem.tenantId,
            productId: stockItem.productId,
            locationId: stockItem.locationId,
            quantity: stockItem.quantity,
            syncedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: stock.id,
            set: {
              quantity: stockItem.quantity,
              syncedAt: new Date(),
            },
          });
      }

      console.log(`Pulled ${productsData.length} products and ${stockData.length} stock items`);
    } catch (error) {
      console.error('Failed to pull data from server:', error);
      throw error;
    }
  }

  /**
   * Update sync metadata
   */
  private async updateSyncMetadata() {
    const now = new Date().toISOString();

    await db
      .insert(syncMetadata)
      .values({
        key: 'last_pull_sync',
        value: now,
      })
      .onConflictDoUpdate({
        target: syncMetadata.key,
        set: {
          value: now,
          updatedAt: new Date(),
        },
      });
  }

  /**
   * Count pending operations
   */
  async countPendingOperations(): Promise<number> {
    const pending = await db.query.localSales.findMany({
      where: eq(localSales.syncStatus, 'pending'),
    });

    return pending.length;
  }

  /**
   * Force sync now
   */
  async forceSyncNow() {
    await this.syncAll();
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance();
