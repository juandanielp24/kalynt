import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Package,
  ArrowLeftRight,
  Phone,
  Mail,
  User,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Warehouse,
} from 'lucide-react-native';
import { apiClient } from '../../src/lib/api/client';

type Tab = 'info' | 'stock' | 'transfers';

const LOCATION_TYPE_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  WAREHOUSE: { label: 'Almacén', color: '#3b82f6', icon: Warehouse },
  STORE: { label: 'Tienda', color: '#10b981', icon: MapPin },
  SUPPLIER: { label: 'Proveedor', color: '#8b5cf6', icon: Package },
  CUSTOMER: { label: 'Cliente', color: '#f59e0b', icon: User },
};

export default function LocationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('info');

  // Fetch location details
  const { data: location, isLoading, error } = useQuery({
    queryKey: ['location', id],
    queryFn: async () => {
      const response = await apiClient.get(`/locations/${id}`);
      return response.data;
    },
  });

  // Fetch stock for this location
  const { data: stockData } = useQuery({
    queryKey: ['location-stock', id],
    queryFn: async () => {
      const response = await apiClient.get(`/locations/${id}/stock`);
      return response.data;
    },
    enabled: activeTab === 'stock',
  });

  // Fetch transfers for this location
  const { data: transfersData } = useQuery({
    queryKey: ['location-transfers', id],
    queryFn: async () => {
      const response = await apiClient.get(`/transfers`, {
        params: { locationId: id },
      });
      return response.data;
    },
    enabled: activeTab === 'transfers',
  });

  // Delete mutation
  const deleteLocationMutation = useMutation({
    mutationFn: () => apiClient.delete(`/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      Alert.alert('Éxito', 'Ubicación eliminada');
      router.back();
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo eliminar la ubicación');
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando ubicación...</Text>
      </View>
    );
  }

  if (error || !location) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error al cargar ubicación</Text>
      </View>
    );
  }

  const locationTypeConfig = LOCATION_TYPE_CONFIG[location.type] || LOCATION_TYPE_CONFIG.WAREHOUSE;
  const LocationTypeIcon = locationTypeConfig.icon;

  const handleEdit = () => {
    Alert.alert('Editar', 'Funcionalidad próximamente');
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Ubicación',
      '¿Estás seguro de que deseas eliminar esta ubicación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteLocationMutation.mutate(),
        },
      ]
    );
  };

  // Calculate stock stats
  const totalProducts = stockData?.length || location._count?.products || 0;
  const totalValue = stockData?.reduce(
    (sum: number, item: any) => sum + (item.quantity * (item.product?.price || 0)),
    0
  ) || 0;
  const lowStockCount = stockData?.filter(
    (item: any) => item.quantity <= (item.product?.minStock || 0)
  ).length || 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={[styles.iconContainer, { backgroundColor: `${locationTypeConfig.color}20` }]}>
            <LocationTypeIcon size={32} color={locationTypeConfig.color} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.locationName}>{location.name}</Text>
            <View style={[styles.typeBadge, { backgroundColor: locationTypeConfig.color }]}>
              <Text style={styles.typeBadgeText}>{locationTypeConfig.label}</Text>
            </View>
            {!location.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactiva</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Edit size={20} color="#3b82f6" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Trash2 size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Package size={20} color="#6b7280" />
          <Text style={styles.statValue}>{totalProducts}</Text>
          <Text style={styles.statLabel}>Productos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <TrendingUp size={20} color="#10b981" />
          <Text style={styles.statValue}>${totalValue.toFixed(0)}</Text>
          <Text style={styles.statLabel}>Valor Total</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <AlertCircle size={20} color="#ef4444" />
          <Text style={[styles.statValue, lowStockCount > 0 && { color: '#ef4444' }]}>
            {lowStockCount}
          </Text>
          <Text style={styles.statLabel}>Bajo Stock</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
            Información
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stock' && styles.tabActive]}
          onPress={() => setActiveTab('stock')}
        >
          <Text style={[styles.tabText, activeTab === 'stock' && styles.tabTextActive]}>
            Stock ({totalProducts})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'transfers' && styles.tabActive]}
          onPress={() => setActiveTab('transfers')}
        >
          <Text style={[styles.tabText, activeTab === 'transfers' && styles.tabTextActive]}>
            Transferencias
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'info' && (
          <View style={styles.tabContent}>
            {/* Location Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detalles</Text>

              {location.address && (
                <View style={styles.infoRow}>
                  <MapPin size={20} color="#6b7280" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Dirección</Text>
                    <Text style={styles.infoText}>{location.address}</Text>
                    {(location.city || location.state || location.zipCode) && (
                      <Text style={styles.infoSubtext}>
                        {[location.city, location.state, location.zipCode]
                          .filter(Boolean)
                          .join(', ')}
                      </Text>
                    )}
                    {location.country && (
                      <Text style={styles.infoSubtext}>{location.country}</Text>
                    )}
                  </View>
                </View>
              )}

              {location.phone && (
                <View style={styles.infoRow}>
                  <Phone size={20} color="#6b7280" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Teléfono</Text>
                    <Text style={styles.infoText}>{location.phone}</Text>
                  </View>
                </View>
              )}

              {location.email && (
                <View style={styles.infoRow}>
                  <Mail size={20} color="#6b7280" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoText}>{location.email}</Text>
                  </View>
                </View>
              )}

              {location.manager && (
                <View style={styles.infoRow}>
                  <User size={20} color="#6b7280" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Responsable</Text>
                    <Text style={styles.infoText}>{location.manager}</Text>
                  </View>
                </View>
              )}

              {location.code && (
                <View style={styles.infoRow}>
                  <Package size={20} color="#6b7280" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Código</Text>
                    <Text style={styles.infoText}>{location.code}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Notes */}
            {location.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notas</Text>
                <Text style={styles.notesText}>{location.notes}</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'stock' && (
          <View style={styles.tabContent}>
            {!stockData || stockData.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No hay productos en stock</Text>
              </View>
            ) : (
              stockData.map((stockItem: any) => {
                const product = stockItem.product;
                const isLowStock = stockItem.quantity <= (product?.minStock || 0);
                const isOutOfStock = stockItem.quantity === 0;

                return (
                  <TouchableOpacity
                    key={stockItem.id}
                    style={styles.stockCard}
                    onPress={() => router.push(`/products/${product?.id}` as any)}
                  >
                    <View style={styles.stockHeader}>
                      <View style={styles.stockInfo}>
                        <Text style={styles.stockName}>{product?.name || 'N/A'}</Text>
                        <Text style={styles.stockSku}>SKU: {product?.sku || 'N/A'}</Text>
                      </View>

                      <View style={styles.stockQuantity}>
                        <Text
                          style={[
                            styles.quantityValue,
                            isOutOfStock && { color: '#ef4444' },
                            isLowStock && !isOutOfStock && { color: '#f59e0b' },
                          ]}
                        >
                          {stockItem.quantity}
                        </Text>
                        <Text style={styles.quantityLabel}>unidades</Text>
                      </View>
                    </View>

                    {(isLowStock || isOutOfStock) && (
                      <View
                        style={[
                          styles.stockAlert,
                          { backgroundColor: isOutOfStock ? '#fee2e2' : '#fef3c7' },
                        ]}
                      >
                        <AlertCircle
                          size={16}
                          color={isOutOfStock ? '#ef4444' : '#f59e0b'}
                        />
                        <Text
                          style={[
                            styles.stockAlertText,
                            { color: isOutOfStock ? '#991b1b' : '#92400e' },
                          ]}
                        >
                          {isOutOfStock
                            ? 'Sin stock'
                            : `Bajo stock (mín: ${product?.minStock || 0})`}
                        </Text>
                      </View>
                    )}

                    <View style={styles.stockDetails}>
                      <View style={styles.stockDetail}>
                        <Text style={styles.stockDetailLabel}>Precio</Text>
                        <Text style={styles.stockDetailValue}>
                          ${product?.price?.toFixed(2) || '0.00'}
                        </Text>
                      </View>

                      <View style={styles.stockDetail}>
                        <Text style={styles.stockDetailLabel}>Valor</Text>
                        <Text style={styles.stockDetailValue}>
                          ${((stockItem.quantity * (product?.price || 0))).toFixed(2)}
                        </Text>
                      </View>

                      {product?.minStock && (
                        <View style={styles.stockDetail}>
                          <Text style={styles.stockDetailLabel}>Stock Mín</Text>
                          <Text style={styles.stockDetailValue}>{product.minStock}</Text>
                        </View>
                      )}

                      {product?.maxStock && (
                        <View style={styles.stockDetail}>
                          <Text style={styles.stockDetailLabel}>Stock Máx</Text>
                          <Text style={styles.stockDetailValue}>{product.maxStock}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {activeTab === 'transfers' && (
          <View style={styles.tabContent}>
            {!transfersData || transfersData.length === 0 ? (
              <View style={styles.emptyState}>
                <ArrowLeftRight size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No hay transferencias</Text>
              </View>
            ) : (
              transfersData.map((transfer: any) => {
                const isIncoming = transfer.destinationLocationId === id;
                const isOutgoing = transfer.originLocationId === id;

                return (
                  <TouchableOpacity
                    key={transfer.id}
                    style={styles.transferCard}
                    onPress={() => router.push(`/transfers/${transfer.id}` as any)}
                  >
                    <View style={styles.transferHeader}>
                      <View style={styles.transferInfo}>
                        <Text style={styles.transferNumber}>{transfer.transferNumber}</Text>
                        <Text style={styles.transferDate}>
                          {new Date(transfer.createdAt).toLocaleDateString('es-AR')}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.transferDirection,
                          {
                            backgroundColor: isIncoming ? '#dcfce7' : '#fee2e2',
                          },
                        ]}
                      >
                        {isIncoming ? (
                          <TrendingDown size={16} color="#10b981" />
                        ) : (
                          <TrendingUp size={16} color="#ef4444" />
                        )}
                        <Text
                          style={[
                            styles.transferDirectionText,
                            { color: isIncoming ? '#166534' : '#991b1b' },
                          ]}
                        >
                          {isIncoming ? 'Entrada' : 'Salida'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.transferRoute}>
                      <View style={styles.transferLocation}>
                        <Text style={styles.transferLocationLabel}>Origen</Text>
                        <Text style={styles.transferLocationName}>
                          {transfer.originLocation?.name || 'N/A'}
                        </Text>
                      </View>

                      <ArrowLeftRight size={20} color="#9ca3af" />

                      <View style={styles.transferLocation}>
                        <Text style={styles.transferLocationLabel}>Destino</Text>
                        <Text style={styles.transferLocationName}>
                          {transfer.destinationLocation?.name || 'N/A'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.transferFooter}>
                      <View
                        style={[
                          styles.transferStatus,
                          { backgroundColor: getTransferStatusColor(transfer.status) },
                        ]}
                      >
                        <Text style={styles.transferStatusText}>
                          {getTransferStatusLabel(transfer.status)}
                        </Text>
                      </View>

                      <Text style={styles.transferItems}>
                        {transfer._count?.items || 0} productos
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getTransferStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: '#f59e0b',
    IN_TRANSIT: '#3b82f6',
    RECEIVED: '#10b981',
    CANCELLED: '#ef4444',
  };
  return colors[status] || '#6b7280';
}

function getTransferStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pendiente',
    IN_TRANSIT: 'En Tránsito',
    RECEIVED: 'Recibida',
    CANCELLED: 'Cancelada',
  };
  return labels[status] || status;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  inactiveBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  inactiveBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  stats: {
    backgroundColor: 'white',
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e5e7eb',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  tabs: {
    backgroundColor: 'white',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#111827',
  },
  infoSubtext: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  notesText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  stockCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stockInfo: {
    flex: 1,
  },
  stockName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stockSku: {
    fontSize: 13,
    color: '#6b7280',
  },
  stockQuantity: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  quantityValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#10b981',
  },
  quantityLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  stockAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  stockAlertText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stockDetails: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  stockDetail: {
    flex: 1,
  },
  stockDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  stockDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  transferCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  transferInfo: {
    flex: 1,
  },
  transferNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  transferDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  transferDirection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  transferDirectionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transferRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transferLocation: {
    flex: 1,
  },
  transferLocationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  transferLocationName: {
    fontSize: 13,
    color: '#111827',
  },
  transferFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transferStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  transferStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  transferItems: {
    fontSize: 13,
    color: '#6b7280',
  },
});
