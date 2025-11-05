import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Building2, Plus, Package, ShoppingCart, Mail, Phone, MapPin } from 'lucide-react-native';
import { suppliersApi } from '../../src/lib/api/suppliers';

export default function SuppliersScreen() {
  const router = useRouter();

  const { data: suppliersData, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => suppliersApi.getSuppliers(),
  });

  const suppliers = suppliersData?.data || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Proveedores</Text>
          <Text style={styles.subtitle}>{suppliers.length} proveedores</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando proveedores...</Text>
        </View>
      ) : suppliers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Building2 size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No hay proveedores</Text>
          <Text style={styles.emptyText}>Agrega proveedores para gestionar compras</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {suppliers.map((supplier: any) => (
            <TouchableOpacity
              key={supplier.id}
              style={styles.supplierCard}
              onPress={() => router.push(`/suppliers/${supplier.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.supplierHeader}>
                <View style={styles.supplierIcon}>
                  <Building2 size={24} color="#3b82f6" />
                </View>
                <View style={styles.supplierInfo}>
                  <Text style={styles.supplierName}>{supplier.name}</Text>
                  <Text style={styles.supplierCode}>{supplier.code}</Text>
                </View>
              </View>

              {/* Contact Info */}
              {(supplier.email || supplier.phone) && (
                <View style={styles.contactInfo}>
                  {supplier.email && (
                    <View style={styles.contactItem}>
                      <Mail size={14} color="#6b7280" />
                      <Text style={styles.contactText} numberOfLines={1}>
                        {supplier.email}
                      </Text>
                    </View>
                  )}
                  {supplier.phone && (
                    <View style={styles.contactItem}>
                      <Phone size={14} color="#6b7280" />
                      <Text style={styles.contactText}>{supplier.phone}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.stat}>
                  <Package size={16} color="#6b7280" />
                  <Text style={styles.statText}>
                    {supplier._count?.products || 0} productos
                  </Text>
                </View>
                <View style={styles.stat}>
                  <ShoppingCart size={16} color="#6b7280" />
                  <Text style={styles.statText}>
                    {supplier._count?.purchaseOrders || 0} órdenes
                  </Text>
                </View>
              </View>

              {/* Payment Terms */}
              {supplier.paymentTerms && (
                <View style={styles.paymentTerms}>
                  <Text style={styles.paymentTermsText}>
                    Pago: {supplier.paymentTerms}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
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
  supplierCard: {
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
  supplierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  supplierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  supplierInfo: {
    flex: 1,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  supplierCode: {
    fontSize: 14,
    color: '#6b7280',
  },
  contactInfo: {
    marginBottom: 12,
    gap: 6,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: '#6b7280',
  },
  paymentTerms: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  paymentTermsText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
