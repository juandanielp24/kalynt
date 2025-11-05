import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, Plus, Package, Clock, CheckCircle, XCircle } from 'lucide-react-native';
import { apiClient } from '../../src/lib/api/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  PENDING: { label: 'Pendiente', color: '#f59e0b', icon: Clock },
  IN_TRANSIT: { label: 'En Tránsito', color: '#3b82f6', icon: ArrowLeftRight },
  RECEIVED: { label: 'Recibida', color: '#10b981', icon: CheckCircle },
  CANCELLED: { label: 'Cancelada', color: '#ef4444', icon: XCircle },
};

export default function TransfersScreen() {
  const router = useRouter();

  const { data: transfersData, isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const response = await apiClient.get('/stock-transfers');
      return response.data;
    },
  });

  const transfers = transfersData?.data?.transfers || [];

  const getStatusConfig = (status: keyof typeof STATUS_CONFIG) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Transferencias</Text>
          <Text style={styles.subtitle}>{transfers.length} transferencias</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando transferencias...</Text>
        </View>
      ) : transfers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ArrowLeftRight size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No hay transferencias</Text>
          <Text style={styles.emptyText}>Crea una transferencia entre ubicaciones</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {transfers.map((transfer: any) => {
            const statusConfig = getStatusConfig(transfer.status);
            const StatusIcon = statusConfig.icon;

            return (
              <TouchableOpacity
                key={transfer.id}
                style={styles.transferCard}
                onPress={() => router.push(`/transfers/${transfer.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.transferHeader}>
                  <View style={styles.transferNumber}>
                    <Text style={styles.transferNumberText}>{transfer.transferNumber}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + '20' }]}>
                    <StatusIcon size={14} color={statusConfig.color} />
                    <Text style={[styles.statusText, { color: statusConfig.color }]}>
                      {statusConfig.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.transferRoute}>
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>Origen</Text>
                    <Text style={styles.locationName}>{transfer.fromLocation.name}</Text>
                  </View>
                  <ArrowLeftRight size={20} color="#9ca3af" style={styles.routeIcon} />
                  <View style={styles.locationInfo}>
                    <Text style={styles.locationLabel}>Destino</Text>
                    <Text style={styles.locationName}>{transfer.toLocation.name}</Text>
                  </View>
                </View>

                <View style={styles.transferMeta}>
                  <View style={styles.metaItem}>
                    <Package size={16} color="#6b7280" />
                    <Text style={styles.metaText}>
                      {transfer._count?.items || 0} productos
                    </Text>
                  </View>
                  <Text style={styles.metaDate}>
                    {format(new Date(transfer.createdAt), 'dd MMM yyyy', { locale: es })}
                  </Text>
                </View>
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
  transferCard: {
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
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  transferNumber: {
    flex: 1,
  },
  transferNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  transferRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2,
  },
  locationName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  routeIcon: {
    marginHorizontal: 4,
  },
  transferMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: '#6b7280',
  },
  metaDate: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
