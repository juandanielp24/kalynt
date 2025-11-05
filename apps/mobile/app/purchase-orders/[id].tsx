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
  FileText,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Truck,
  Edit,
  Trash2,
  Building2,
  MapPin,
} from 'lucide-react-native';
import { suppliersApi } from '../../src/lib/api/suppliers';
import { suppliersSyncService } from '../../src/lib/sync/suppliers-sync.service';

type Tab = 'items' | 'payments' | 'timeline';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT: { label: 'Borrador', color: '#6b7280', icon: FileText },
  SENT: { label: 'Enviada', color: '#3b82f6', icon: Send },
  CONFIRMED: { label: 'Confirmada', color: '#8b5cf6', icon: CheckCircle },
  PARTIAL: { label: 'Parcial', color: '#f59e0b', icon: Clock },
  RECEIVED: { label: 'Recibida', color: '#10b981', icon: Package },
  CANCELLED: { label: 'Cancelada', color: '#ef4444', icon: XCircle },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: '#ef4444' },
  PARTIAL: { label: 'Parcial', color: '#f59e0b' },
  PAID: { label: 'Pagado', color: '#10b981' },
};

export default function PurchaseOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('items');

  // Fetch order details
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: async () => {
      const response = await suppliersApi.getPurchaseOrder(id);
      return response.data;
    },
  });

  // Mutations
  const sendOrderMutation = useMutation({
    mutationFn: () => suppliersApi.sendPurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      Alert.alert('Éxito', 'Orden enviada al proveedor');
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo enviar la orden');
    },
  });

  const confirmOrderMutation = useMutation({
    mutationFn: () => suppliersApi.confirmPurchaseOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      Alert.alert('Éxito', 'Orden confirmada');
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo confirmar la orden');
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (reason: string) => suppliersApi.cancelPurchaseOrder(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      Alert.alert('Éxito', 'Orden cancelada');
    },
    onError: () => {
      Alert.alert('Error', 'No se pudo cancelar la orden');
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando orden...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error al cargar orden</Text>
      </View>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;
  const paymentStatusConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus];

  const handleSend = () => {
    Alert.alert(
      'Enviar Orden',
      '¿Estás seguro de que deseas enviar esta orden al proveedor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Enviar', onPress: () => sendOrderMutation.mutate() },
      ]
    );
  };

  const handleConfirm = () => {
    Alert.alert(
      'Confirmar Orden',
      '¿El proveedor confirmó esta orden?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, confirmar', onPress: () => confirmOrderMutation.mutate() },
      ]
    );
  };

  const handleReceive = () => {
    // TODO: Open receive dialog/screen
    Alert.alert('Recibir Mercadería', 'Funcionalidad próximamente');
  };

  const handleRegisterPayment = () => {
    // TODO: Open payment dialog/screen
    Alert.alert('Registrar Pago', 'Funcionalidad próximamente');
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancelar Orden',
      'Ingresa el motivo de la cancelación:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => {
            // In real app, would show input dialog first
            const reason = 'Cancelado desde móvil';
            cancelOrderMutation.mutate(reason);
          },
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Orden',
      'Solo se pueden eliminar órdenes en borrador. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await suppliersApi.deletePurchaseOrder(id);
              router.back();
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar la orden');
            }
          },
        },
      ]
    );
  };

  const pendingAmount = order.totalAmount - order.paidAmount;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderNumber}>{order.orderNumber}</Text>
            <Text style={styles.orderDate}>
              {new Date(order.orderDate).toLocaleDateString('es-AR')}
            </Text>
          </View>

          <View style={styles.statusBadges}>
            <View style={[styles.statusBadge, { backgroundColor: statusConfig.color }]}>
              <StatusIcon size={14} color="white" />
              <Text style={styles.statusText}>{statusConfig.label}</Text>
            </View>
            <View
              style={[
                styles.paymentBadge,
                { backgroundColor: paymentStatusConfig.color },
              ]}
            >
              <Text style={styles.paymentBadgeText}>
                {paymentStatusConfig.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Supplier and Location */}
        <View style={styles.headerDetails}>
          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => router.push(`/suppliers/${order.supplier.id}` as any)}
          >
            <Building2 size={16} color="#6b7280" />
            <Text style={styles.detailText}>{order.supplier.name}</Text>
          </TouchableOpacity>

          {order.location && (
            <View style={styles.detailRow}>
              <MapPin size={16} color="#6b7280" />
              <Text style={styles.detailText}>{order.location.name}</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.actions}>
            {order.status === 'DRAFT' && (
              <TouchableOpacity style={styles.actionButton} onPress={handleSend}>
                <Send size={16} color="white" />
                <Text style={styles.actionButtonText}>Enviar</Text>
              </TouchableOpacity>
            )}

            {order.status === 'SENT' && (
              <TouchableOpacity style={styles.actionButton} onPress={handleConfirm}>
                <CheckCircle size={16} color="white" />
                <Text style={styles.actionButtonText}>Confirmar</Text>
              </TouchableOpacity>
            )}

            {(order.status === 'CONFIRMED' || order.status === 'PARTIAL') && (
              <TouchableOpacity style={styles.actionButton} onPress={handleReceive}>
                <Truck size={16} color="white" />
                <Text style={styles.actionButtonText}>Recibir</Text>
              </TouchableOpacity>
            )}

            {(order.status === 'PARTIAL' || order.status === 'RECEIVED') &&
              order.paymentStatus !== 'PAID' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                  onPress={handleRegisterPayment}
                >
                  <DollarSign size={16} color="white" />
                  <Text style={styles.actionButtonText}>Pagar</Text>
                </TouchableOpacity>
              )}

            {order.status !== 'CANCELLED' && order.status !== 'RECEIVED' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                onPress={handleCancel}
              >
                <XCircle size={16} color="white" />
                <Text style={styles.actionButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}

            {order.status === 'DRAFT' && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#6b7280' }]}
                onPress={handleDelete}
              >
                <Trash2 size={16} color="white" />
                <Text style={styles.actionButtonText}>Eliminar</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>

      {/* Summary Cards */}
      <View style={styles.summary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total</Text>
          <Text style={styles.summaryValue}>
            ${order.totalAmount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pagado</Text>
          <Text style={[styles.summaryValue, { color: '#10b981' }]}>
            ${order.paidAmount.toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pendiente</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: pendingAmount > 0 ? '#f59e0b' : '#10b981' },
            ]}
          >
            ${pendingAmount.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'items' && styles.tabActive]}
          onPress={() => setActiveTab('items')}
        >
          <Text style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}>
            Items ({order.items?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
          onPress={() => setActiveTab('payments')}
        >
          <Text
            style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}
          >
            Pagos ({order.payments?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'timeline' && styles.tabActive]}
          onPress={() => setActiveTab('timeline')}
        >
          <Text
            style={[styles.tabText, activeTab === 'timeline' && styles.tabTextActive]}
          >
            Detalles
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'items' && (
          <View style={styles.tabContent}>
            {!order.items || order.items.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No hay items</Text>
              </View>
            ) : (
              order.items.map((item: any) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.productName}</Text>
                    <Text style={styles.itemTotal}>
                      ${item.totalAmount.toFixed(2)}
                    </Text>
                  </View>

                  <Text style={styles.itemSku}>SKU: {item.productSku}</Text>

                  <View style={styles.itemDetails}>
                    <View style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Ordenado</Text>
                      <Text style={styles.itemDetailValue}>
                        {item.quantityOrdered} un.
                      </Text>
                    </View>

                    <View style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Recibido</Text>
                      <Text
                        style={[
                          styles.itemDetailValue,
                          {
                            color:
                              item.quantityReceived === item.quantityOrdered
                                ? '#10b981'
                                : item.quantityReceived > 0
                                ? '#f59e0b'
                                : '#6b7280',
                          },
                        ]}
                      >
                        {item.quantityReceived} un.
                      </Text>
                    </View>

                    <View style={styles.itemDetail}>
                      <Text style={styles.itemDetailLabel}>Costo Unit.</Text>
                      <Text style={styles.itemDetailValue}>
                        ${item.unitCost.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  {item.quantityReceived < item.quantityOrdered && (
                    <View style={styles.itemPending}>
                      <Text style={styles.itemPendingText}>
                        Pendiente: {item.quantityOrdered - item.quantityReceived} un.
                      </Text>
                    </View>
                  )}

                  <View style={styles.itemBreakdown}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>Subtotal:</Text>
                      <Text style={styles.breakdownValue}>
                        ${item.subtotal.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>
                        Impuesto ({item.taxRate}%):
                      </Text>
                      <Text style={styles.breakdownValue}>
                        ${item.taxAmount.toFixed(2)}
                      </Text>
                    </View>
                    {item.discount > 0 && (
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Descuento:</Text>
                        <Text style={[styles.breakdownValue, { color: '#10b981' }]}>
                          -${item.discount.toFixed(2)}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))
            )}

            {/* Order Totals */}
            {order.items && order.items.length > 0 && (
              <View style={styles.totalsCard}>
                <Text style={styles.totalsTitle}>Totales</Text>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal:</Text>
                  <Text style={styles.totalValue}>${order.subtotal.toFixed(2)}</Text>
                </View>

                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Impuestos:</Text>
                  <Text style={styles.totalValue}>${order.taxAmount.toFixed(2)}</Text>
                </View>

                {order.discount > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Descuento:</Text>
                    <Text style={[styles.totalValue, { color: '#10b981' }]}>
                      -${order.discount.toFixed(2)}
                    </Text>
                  </View>
                )}

                {order.shippingCost > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Envío:</Text>
                    <Text style={styles.totalValue}>
                      ${order.shippingCost.toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={[styles.totalRow, styles.totalRowFinal]}>
                  <Text style={styles.totalLabelFinal}>TOTAL:</Text>
                  <Text style={styles.totalValueFinal}>
                    ${order.totalAmount.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'payments' && (
          <View style={styles.tabContent}>
            {!order.payments || order.payments.length === 0 ? (
              <View style={styles.emptyState}>
                <DollarSign size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No hay pagos registrados</Text>
              </View>
            ) : (
              order.payments.map((payment: any) => (
                <View key={payment.id} style={styles.paymentCard}>
                  <View style={styles.paymentHeader}>
                    <View>
                      <Text style={styles.paymentNumber}>{payment.paymentNumber}</Text>
                      <Text style={styles.paymentDate}>
                        {new Date(payment.paymentDate).toLocaleDateString('es-AR')}
                      </Text>
                    </View>
                    <Text style={styles.paymentAmount}>
                      ${payment.amount.toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.paymentDetails}>
                    <View style={styles.paymentDetail}>
                      <Text style={styles.paymentDetailLabel}>Método</Text>
                      <Text style={styles.paymentDetailValue}>
                        {payment.paymentMethod}
                      </Text>
                    </View>

                    {payment.reference && (
                      <View style={styles.paymentDetail}>
                        <Text style={styles.paymentDetailLabel}>Referencia</Text>
                        <Text style={styles.paymentDetailValue}>
                          {payment.reference}
                        </Text>
                      </View>
                    )}
                  </View>

                  {payment.notes && (
                    <View style={styles.paymentNotes}>
                      <Text style={styles.paymentNotesLabel}>Notas:</Text>
                      <Text style={styles.paymentNotesText}>{payment.notes}</Text>
                    </View>
                  )}

                  {payment.createdBy && (
                    <Text style={styles.paymentCreatedBy}>
                      Por: {payment.createdBy.name}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'timeline' && (
          <View style={styles.tabContent}>
            <View style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Información de la Orden</Text>

              {order.expectedDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fecha esperada:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(order.expectedDate).toLocaleDateString('es-AR')}
                  </Text>
                </View>
              )}

              {order.receivedDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fecha recibida:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(order.receivedDate).toLocaleDateString('es-AR')}
                  </Text>
                </View>
              )}

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Creado por:</Text>
                <Text style={styles.detailValue}>
                  {order.createdBy?.name || 'N/A'}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Creado:</Text>
                <Text style={styles.detailValue}>
                  {new Date(order.createdAt).toLocaleDateString('es-AR')}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Última actualización:</Text>
                <Text style={styles.detailValue}>
                  {new Date(order.updatedAt).toLocaleDateString('es-AR')}
                </Text>
              </View>
            </View>

            {order.notes && (
              <View style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>Notas</Text>
                <Text style={styles.notesText}>{order.notes}</Text>
              </View>
            )}

            {order.internalNotes && (
              <View style={styles.detailsCard}>
                <Text style={styles.detailsTitle}>Notas Internas</Text>
                <Text style={styles.notesText}>{order.internalNotes}</Text>
              </View>
            )}
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
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadges: {
    gap: 8,
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
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  paymentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  headerDetails: {
    gap: 8,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#4b5563',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
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
    padding: 16,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
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
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  itemSku: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  itemDetail: {
    flex: 1,
  },
  itemDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  itemDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  itemPending: {
    backgroundColor: '#fef3c7',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  itemPendingText: {
    fontSize: 13,
    color: '#92400e',
    fontWeight: '600',
  },
  itemBreakdown: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  breakdownValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  totalsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  totalsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalRowFinal: {
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  totalLabelFinal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  totalValueFinal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  paymentCard: {
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
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  paymentNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 13,
    color: '#6b7280',
  },
  paymentAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  paymentDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  paymentDetail: {
    flex: 1,
  },
  paymentDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  paymentDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  paymentNotes: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentNotesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  paymentNotesText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  paymentCreatedBy: {
    fontSize: 12,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  detailsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  notesText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
});
