import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  CreditCard,
  FileText,
  Package,
  ChevronRight,
  Edit,
  Trash2,
} from 'lucide-react-native';
import { suppliersApi } from '../../src/lib/api/suppliers';

type Tab = 'info' | 'products' | 'orders';

export default function SupplierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('info');

  // Fetch supplier details
  const { data: supplier, isLoading, error } = useQuery({
    queryKey: ['supplier', id],
    queryFn: async () => {
      const response = await suppliersApi.getSupplier(id, {
        includeProducts: true,
        includeOrders: true,
      });
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Cargando proveedor...</Text>
      </View>
    );
  }

  if (error || !supplier) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error al cargar proveedor</Text>
      </View>
    );
  }

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleWebsite = (url: string) => {
    Linking.openURL(url);
  };

  const handleEdit = () => {
    // TODO: Navigate to edit screen
    Alert.alert('Editar', 'Funcionalidad próximamente');
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Proveedor',
      '¿Estás seguro de que deseas eliminar este proveedor?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await suppliersApi.deleteSupplier(id);
              router.back();
            } catch (err) {
              Alert.alert('Error', 'No se pudo eliminar el proveedor');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Building2 size={32} color="#3b82f6" />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.supplierName}>{supplier.name}</Text>
            <Text style={styles.supplierCode}>{supplier.code}</Text>
            {!supplier.isActive && (
              <View style={styles.inactiveBadge}>
                <Text style={styles.inactiveBadgeText}>Inactivo</Text>
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
          <Text style={styles.statValue}>{supplier._count?.products || 0}</Text>
          <Text style={styles.statLabel}>Productos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <FileText size={20} color="#6b7280" />
          <Text style={styles.statValue}>{supplier._count?.purchaseOrders || 0}</Text>
          <Text style={styles.statLabel}>Órdenes</Text>
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
          style={[styles.tab, activeTab === 'products' && styles.tabActive]}
          onPress={() => setActiveTab('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.tabTextActive]}>
            Productos ({supplier.products?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.tabActive]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.tabTextActive]}>
            Órdenes ({supplier.purchaseOrders?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'info' && (
          <View style={styles.tabContent}>
            {/* Contact Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contacto</Text>

              {supplier.email && (
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => handleEmail(supplier.email!)}
                >
                  <Mail size={20} color="#6b7280" />
                  <Text style={styles.infoText}>{supplier.email}</Text>
                  <ChevronRight size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}

              {supplier.phone && (
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => handleCall(supplier.phone!)}
                >
                  <Phone size={20} color="#6b7280" />
                  <Text style={styles.infoText}>{supplier.phone}</Text>
                  <ChevronRight size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}

              {supplier.website && (
                <TouchableOpacity
                  style={styles.infoRow}
                  onPress={() => handleWebsite(supplier.website!)}
                >
                  <Globe size={20} color="#6b7280" />
                  <Text style={styles.infoText}>{supplier.website}</Text>
                  <ChevronRight size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}

              {supplier.contactName && (
                <View style={styles.infoRow}>
                  <Building2 size={20} color="#6b7280" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Persona de contacto</Text>
                    <Text style={styles.infoText}>{supplier.contactName}</Text>
                    {supplier.contactEmail && (
                      <Text style={styles.infoSubtext}>{supplier.contactEmail}</Text>
                    )}
                    {supplier.contactPhone && (
                      <Text style={styles.infoSubtext}>{supplier.contactPhone}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Address */}
            {supplier.address && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dirección</Text>
                <View style={styles.infoRow}>
                  <MapPin size={20} color="#6b7280" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoText}>{supplier.address}</Text>
                    <Text style={styles.infoSubtext}>
                      {[supplier.city, supplier.state, supplier.zipCode]
                        .filter(Boolean)
                        .join(', ')}
                    </Text>
                    {supplier.country && (
                      <Text style={styles.infoSubtext}>{supplier.country}</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Payment Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información de Pago</Text>

              {supplier.taxId && (
                <View style={styles.infoRow}>
                  <CreditCard size={20} color="#6b7280" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>CUIT/Tax ID</Text>
                    <Text style={styles.infoText}>{supplier.taxId}</Text>
                  </View>
                </View>
              )}

              {supplier.paymentTerms && (
                <View style={styles.infoRow}>
                  <CreditCard size={20} color="#6b7280" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Términos de Pago</Text>
                    <Text style={styles.infoText}>{supplier.paymentTerms}</Text>
                  </View>
                </View>
              )}

              {supplier.currency && (
                <View style={styles.infoRow}>
                  <CreditCard size={20} color="#6b7280" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Moneda</Text>
                    <Text style={styles.infoText}>{supplier.currency}</Text>
                  </View>
                </View>
              )}

              {supplier.bankName && (
                <View style={styles.infoRow}>
                  <CreditCard size={20} color="#6b7280" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Banco</Text>
                    <Text style={styles.infoText}>{supplier.bankName}</Text>
                    {supplier.bankAccount && (
                      <Text style={styles.infoSubtext}>
                        Cuenta: {supplier.bankAccount}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>

            {/* Notes */}
            {supplier.notes && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notas</Text>
                <Text style={styles.notesText}>{supplier.notes}</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'products' && (
          <View style={styles.tabContent}>
            {!supplier.products || supplier.products.length === 0 ? (
              <View style={styles.emptyState}>
                <Package size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>
                  No hay productos vinculados
                </Text>
              </View>
            ) : (
              supplier.products.map((supplierProduct: any) => (
                <TouchableOpacity
                  key={supplierProduct.id}
                  style={styles.productCard}
                  onPress={() =>
                    router.push(`/products/${supplierProduct.product.id}` as any)
                  }
                >
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>
                      {supplierProduct.product.name}
                    </Text>
                    {supplierProduct.isPreferred && (
                      <View style={styles.preferredBadge}>
                        <Text style={styles.preferredBadgeText}>Preferido</Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.productSku}>
                    SKU: {supplierProduct.product.sku}
                  </Text>

                  {supplierProduct.supplierSku && (
                    <Text style={styles.productSupplierSku}>
                      SKU Proveedor: {supplierProduct.supplierSku}
                    </Text>
                  )}

                  <View style={styles.productDetails}>
                    <View style={styles.productDetail}>
                      <Text style={styles.productDetailLabel}>Costo</Text>
                      <Text style={styles.productDetailValue}>
                        ${supplierProduct.cost.toFixed(2)}
                      </Text>
                    </View>

                    {supplierProduct.minOrderQty && (
                      <View style={styles.productDetail}>
                        <Text style={styles.productDetailLabel}>Mín. Orden</Text>
                        <Text style={styles.productDetailValue}>
                          {supplierProduct.minOrderQty} un.
                        </Text>
                      </View>
                    )}

                    {supplierProduct.leadTimeDays && (
                      <View style={styles.productDetail}>
                        <Text style={styles.productDetailLabel}>Entrega</Text>
                        <Text style={styles.productDetailValue}>
                          {supplierProduct.leadTimeDays} días
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.productStock}>
                    <Text style={styles.productStockLabel}>Stock actual:</Text>
                    <Text style={styles.productStockValue}>
                      {supplierProduct.product.stock} un.
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'orders' && (
          <View style={styles.tabContent}>
            {!supplier.purchaseOrders || supplier.purchaseOrders.length === 0 ? (
              <View style={styles.emptyState}>
                <FileText size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>
                  No hay órdenes de compra
                </Text>
              </View>
            ) : (
              supplier.purchaseOrders.map((order: any) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderCard}
                  onPress={() => router.push(`/purchase-orders/${order.id}` as any)}
                >
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(order.status) },
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {getStatusLabel(order.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderDetails}>
                    <Text style={styles.orderDate}>
                      {new Date(order.orderDate).toLocaleDateString('es-AR')}
                    </Text>
                    <Text style={styles.orderAmount}>
                      ${order.totalAmount.toFixed(2)}
                    </Text>
                  </View>

                  {order.paymentStatus !== 'PAID' && (
                    <View style={styles.orderPayment}>
                      <Text style={styles.orderPaymentLabel}>Pendiente:</Text>
                      <Text style={styles.orderPaymentValue}>
                        ${(order.totalAmount - order.paidAmount).toFixed(2)}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: '#6b7280',
    SENT: '#3b82f6',
    CONFIRMED: '#8b5cf6',
    PARTIAL: '#f59e0b',
    RECEIVED: '#10b981',
    CANCELLED: '#ef4444',
  };
  return colors[status] || '#6b7280';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Borrador',
    SENT: 'Enviada',
    CONFIRMED: 'Confirmada',
    PARTIAL: 'Parcial',
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
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  supplierCode: {
    fontSize: 14,
    color: '#6b7280',
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
  productCard: {
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
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  preferredBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  preferredBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
  },
  productSku: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 4,
  },
  productSupplierSku: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
  },
  productDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  productDetail: {
    flex: 1,
  },
  productDetailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  productDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  productStock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  productStockLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  productStockValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderDate: {
    fontSize: 14,
    color: '#6b7280',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  orderPayment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  orderPaymentLabel: {
    fontSize: 13,
    color: '#6b7280',
  },
  orderPaymentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
});
