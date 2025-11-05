import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Send,
  CheckCircle,
  Package,
  XCircle,
  Clock,
  DollarSign,
} from 'lucide-react-native';
import { suppliersApi } from '../../src/lib/api/suppliers';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  DRAFT: { label: 'Borrador', color: '#6b7280', icon: FileText },
  SENT: { label: 'Enviada', color: '#3b82f6', icon: Send },
  CONFIRMED: { label: 'Confirmada', color: '#8b5cf6', icon: CheckCircle },
  PARTIAL: { label: 'Parcial', color: '#f59e0b', icon: Clock },
  RECEIVED: { label: 'Recibida', color: '#10b981', icon: Package },
  CANCELLED: { label: 'Cancelada', color: '#ef4444', icon: XCircle },
};

const PAYMENT_STATUS_CONFIG = {
  PENDING: { label: 'Pendiente', color: '#f59e0b' },
  PARTIAL: { label: 'Parcial', color: '#eab308' },
  PAID: { label: 'Pagado', color: '#10b981' },
  OVERDUE: { label: 'Vencido', color: '#ef4444' },
};

export default function PurchaseOrdersScreen() {
  const router = useRouter();

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => suppliersApi.getPurchaseOrders({}),
  });

  const orders = ordersData?.data?.orders || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Órdenes de Compra</Text>
          <Text style={styles.subtitle}>{orders.length} órdenes</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando órdenes...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No hay órdenes de compra</Text>
          <Text style={styles.emptyText}>Crea tu primera orden a un proveedor</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {orders.map((order: any) => {
            const statusConfig = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
            const paymentConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus as keyof typeof PAYMENT_STATUS_CONFIG];
            const StatusIcon = statusConfig?.icon;

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/purchase-orders/${order.id}`)}
                activeOpacity={0.7}
              >
                {/* Header */}
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                  <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: statusConfig.color + '20' }]}>
                      {StatusIcon && <StatusIcon size={12} color={statusConfig.color} />}
                      <Text style={[styles.badgeText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Supplier */}
                <Text style={styles.supplierName}>{order.supplier.name}</Text>

                {/* Details */}
                <View style={styles.orderDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Fecha:</Text>
                    <Text style={styles.detailValue}>
                      {format(new Date(order.orderDate), 'dd MMM yyyy', { locale: es })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Productos:</Text>
                    <Text style={styles.detailValue}>{order._count?.items || 0}</Text>
                  </View>
                </View>

                {/* Amount */}
                <View style={styles.amountContainer}>
                  <View style={styles.totalAmount}>
                    <DollarSign size={16} color="#1f2937" />
                    <Text style={styles.amountText}>
                      ${order.totalAmount.toLocaleString()}
                    </Text>
                  </View>
                  {order.paymentStatus !== 'PAID' && (
                    <View style={[styles.paymentBadge, { backgroundColor: paymentConfig.color + '20' }]}>
                      <Text style={[styles.paymentBadgeText, { color: paymentConfig.color }]}>
                        {paymentConfig.label}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Pending amount */}
                {order.paidAmount < order.totalAmount && (
                  <View style={styles.pendingAmount}>
                    <Text style={styles.pendingText}>
                      Pendiente: ${(order.totalAmount - order.paidAmount).toLocaleString()}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  badges: {
    gap: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  supplierName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3b82f6',
    marginBottom: 12,
  },
  orderDetails: {
    gap: 6,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 13,
    color: '#1f2937',
    fontWeight: '500',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  totalAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  paymentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentBadgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  pendingAmount: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  pendingText: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '500',
  },
});
