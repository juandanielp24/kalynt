import React from 'react';
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
  ArrowLeftRight,
  MapPin,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  User,
  Calendar,
} from 'lucide-react-native';
import { apiClient } from '../../src/lib/api/client';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Pendiente', color: '#f59e0b', icon: Clock },
  IN_TRANSIT: { label: 'En Tránsito', color: '#3b82f6', icon: Truck },
  RECEIVED: { label: 'Recibida', color: '#10b981', icon: CheckCircle },
  CANCELLED: { label: 'Cancelada', color: '#ef4444', icon: XCircle },
};

export default function TransferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Fetch transfer details
  const { data: transfer, isLoading, error } = useQuery({
    queryKey: ['transfer', id],
    queryFn: async () => {
      const response = await apiClient.get(`/transfers/${id}`);
      return response.data;
    },
  });

  // Mutations
  const startTransitMutation = useMutation({
    mutationFn: () => apiClient.put(`/transfers/${id}/start-transit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer', id] });
      Alert.alert('Éxito', 'Transferencia iniciada');
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo iniciar la transferencia');
    },
  });

  const receiveTransferMutation = useMutation({
    mutationFn: (receiveData: any) =>
      apiClient.put(`/transfers/${id}/receive`, receiveData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer', id] });
      Alert.alert('Éxito', 'Transferencia recibida');
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo recibir la transferencia');
    },
  });

  const cancelTransferMutation = useMutation({
    mutationFn: (reason: string) =>
      apiClient.put(`/transfers/${id}/cancel`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfer', id] });
      Alert.alert('Éxito', 'Transferencia cancelada');
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo cancelar la transferencia');
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando transferencia...</Text>
      </View>
    );
  }

  if (error || !transfer) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error al cargar transferencia</Text>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[transfer.status];
  const StatusIcon = statusConfig.icon;

  const handleStartTransit = () => {
    Alert.alert(
      'Iniciar Transferencia',
      '¿Los productos están en camino?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, iniciar', onPress: () => startTransitMutation.mutate() },
      ]
    );
  };

  const handleReceive = () => {
    // In real app, would show dialog to confirm quantities
    Alert.alert(
      'Recibir Transferencia',
      '¿Se recibieron todos los productos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, recibir',
          onPress: () => {
            const receiveData = {
              receivedDate: new Date().toISOString(),
              items: transfer.items.map((item: any) => ({
                itemId: item.id,
                quantityReceived: item.quantity,
              })),
            };
            receiveTransferMutation.mutate(receiveData);
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Transferencia',
      'Ingresa el motivo de la cancelación:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            // In real app, would show input dialog
            const reason = 'Cancelado desde móvil';
            cancelTransferMutation.mutate(reason);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.transferNumber}>{transfer.transferNumber}</Text>
            <Text style={styles.transferDate}>
              {new Date(transfer.createdAt).toLocaleDateString('es-AR')}
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
            <StatusIcon size={14} color="white" />
            <Text style={styles.statusText}>{statusConfig.label}</Text>
          </View>
        </View>

        {/* Route */}
        <View style={styles.route}>
          <View style={styles.routePoint}>
            <View style={styles.routeIcon}>
              <MapPin size={20} color="#3b82f6" />
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>Origen</Text>
              <Text style={styles.routeName}>{transfer.originLocation.name}</Text>
              <Text style={styles.routeType}>{transfer.originLocation.type}</Text>
            </View>
          </View>

          <View style={styles.routeArrow}>
            <ArrowLeftRight size={24} color="#9ca3af" />
          </View>

          <View style={styles.routePoint}>
            <View style={[styles.routeIcon, { backgroundColor: '#dcfce7' }]}>
              <MapPin size={20} color="#10b981" />
            </View>
            <View style={styles.routeInfo}>
              <Text style={styles.routeLabel}>Destino</Text>
              <Text style={styles.routeName}>{transfer.destinationLocation.name}</Text>
              <Text style={styles.routeType}>{transfer.destinationLocation.type}</Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {transfer.status === 'PENDING' && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleStartTransit}
            >
              <Truck size={16} color="white" />
              <Text style={styles.actionButtonText}>Iniciar Envío</Text>
            </TouchableOpacity>
          )}

          {transfer.status === 'IN_TRANSIT' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#10b981' }]}
              onPress={handleReceive}
            >
              <CheckCircle size={16} color="white" />
              <Text style={styles.actionButtonText}>Recibir</Text>
            </TouchableOpacity>
          )}

          {transfer.status !== 'CANCELLED' && transfer.status !== 'RECEIVED' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
              onPress={handleCancel}
            >
              <XCircle size={16} color="white" />
              <Text style={styles.actionButtonText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Package size={20} color="#6b7280" />
          <Text style={styles.summaryValue}>{transfer.items?.length || 0}</Text>
          <Text style={styles.summaryLabel}>Productos</Text>
        </View>

        <View style={styles.summaryCard}>
          <Package size={20} color="#6b7280" />
          <Text style={styles.summaryValue}>
            {transfer.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}
          </Text>
          <Text style={styles.summaryLabel}>Unidades</Text>
        </View>
      </View>

      {/* Items */}
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos</Text>

          {!transfer.items || transfer.items.length === 0 ? (
            <View style={styles.emptyState}>
              <Package size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No hay productos</Text>
            </View>
          ) : (
            transfer.items.map((item: any) => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.product.name}</Text>
                    <Text style={styles.itemSku}>SKU: {item.product.sku}</Text>
                  </View>

                  <View style={styles.itemQuantity}>
                    <Text style={styles.quantityValue}>{item.quantity}</Text>
                    <Text style={styles.quantityLabel}>unidades</Text>
                  </View>
                </View>

                {transfer.status === 'RECEIVED' && item.quantityReceived && (
                  <View style={styles.itemReceived}>
                    <CheckCircle size={16} color="#10b981" />
                    <Text style={styles.itemReceivedText}>
                      Recibido: {item.quantityReceived} un.
                    </Text>
                  </View>
                )}

                {item.notes && (
                  <View style={styles.itemNotes}>
                    <Text style={styles.itemNotesLabel}>Notas:</Text>
                    <Text style={styles.itemNotesText}>{item.notes}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalles</Text>

          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <User size={16} color="#6b7280" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Creado por</Text>
                <Text style={styles.detailValue}>
                  {transfer.createdBy?.name || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.detailRow}>
              <Calendar size={16} color="#6b7280" />
              <View style={styles.detailInfo}>
                <Text style={styles.detailLabel}>Fecha de creación</Text>
                <Text style={styles.detailValue}>
                  {new Date(transfer.createdAt).toLocaleDateString('es-AR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>

            {transfer.startedAt && (
              <View style={styles.detailRow}>
                <Truck size={16} color="#6b7280" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Inicio de tránsito</Text>
                  <Text style={styles.detailValue}>
                    {new Date(transfer.startedAt).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            )}

            {transfer.receivedAt && (
              <View style={styles.detailRow}>
                <CheckCircle size={16} color="#6b7280" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Recibido</Text>
                  <Text style={styles.detailValue}>
                    {new Date(transfer.receivedAt).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {transfer.receivedBy && (
                    <Text style={styles.detailSubvalue}>
                      Por: {transfer.receivedBy.name}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {transfer.expectedDate && (
              <View style={styles.detailRow}>
                <Calendar size={16} color="#6b7280" />
                <View style={styles.detailInfo}>
                  <Text style={styles.detailLabel}>Fecha esperada</Text>
                  <Text style={styles.detailValue}>
                    {new Date(transfer.expectedDate).toLocaleDateString('es-AR')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {transfer.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{transfer.notes}</Text>
            </View>
          </View>
        )}

        {/* Cancellation Reason */}
        {transfer.status === 'CANCELLED' && transfer.cancellationReason && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Motivo de Cancelación</Text>
            <View style={[styles.notesCard, { backgroundColor: '#fee2e2' }]}>
              <Text style={[styles.notesText, { color: '#991b1b' }]}>
                {transfer.cancellationReason}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  transferNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  transferDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  routeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  routeType: {
    fontSize: 12,
    color: '#6b7280',
  },
  routeArrow: {
    paddingHorizontal: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
  },
  itemCard: {
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
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  itemSku: {
    fontSize: 13,
    color: '#6b7280',
  },
  itemQuantity: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  quantityValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3b82f6',
  },
  quantityLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemReceived: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  itemReceivedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  itemNotes: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  itemNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  itemNotesText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
  },
  detailSubvalue: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  notesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});
