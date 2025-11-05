import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Store, Warehouse, ChevronRight, Plus } from 'lucide-react-native';
import { apiClient } from '../../src/lib/api/client';

export default function LocationsScreen() {
  const router = useRouter();

  const { data: locationsData, isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await apiClient.get('/locations');
      return response.data;
    },
  });

  const locations = locationsData?.data || [];

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'STORE':
        return Store;
      case 'WAREHOUSE':
        return Warehouse;
      default:
        return MapPin;
    }
  };

  const getLocationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      STORE: 'Tienda',
      WAREHOUSE: 'Depósito',
      OFFICE: 'Oficina',
      OTHER: 'Otro',
    };
    return labels[type] || type;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Ubicaciones</Text>
          <Text style={styles.subtitle}>{locations.length} ubicaciones</Text>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando ubicaciones...</Text>
        </View>
      ) : locations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MapPin size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No hay ubicaciones</Text>
          <Text style={styles.emptyText}>Configura tus tiendas y depósitos</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {locations.map((location: any) => {
            const Icon = getLocationIcon(location.type);
            return (
              <TouchableOpacity
                key={location.id}
                style={styles.locationCard}
                onPress={() => router.push(`/locations/${location.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.locationIcon}>
                  <Icon size={24} color="#3b82f6" />
                </View>
                <View style={styles.locationContent}>
                  <Text style={styles.locationName}>{location.name}</Text>
                  <Text style={styles.locationCode}>{location.code}</Text>
                  <View style={styles.locationMeta}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {getLocationTypeLabel(location.type)}
                      </Text>
                    </View>
                    {location.address && (
                      <Text style={styles.locationAddress} numberOfLines={1}>
                        {location.address}
                      </Text>
                    )}
                  </View>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
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
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationContent: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  locationCode: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4f46e5',
  },
  locationAddress: {
    flex: 1,
    fontSize: 12,
    color: '#9ca3af',
  },
});
