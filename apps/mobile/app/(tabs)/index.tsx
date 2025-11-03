import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Scan } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ProductCard } from '@/components/pos/ProductCard';
import { Cart } from '@/components/pos/Cart';
import { useProducts } from '@/hooks/use-products';
import { useCartStore } from '@/store/cart-store';

export default function POSScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { data: products, isLoading } = useProducts();
  const cart = useCartStore();

  const filteredProducts = products?.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Punto de Venta</Text>
        <Pressable
          style={styles.scanButton}
          onPress={() => {
            // TODO: Navigate to scanner
            console.log('Open scanner');
          }}
        >
          <Scan color="#fff" size={20} />
        </Pressable>
      </View>

      <View style={styles.searchContainer}>
        <Search color="#666" size={20} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar productos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.productsContainer}>
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            renderItem={({ item }) => (
              <ProductCard
                product={item}
                onPress={() => cart.addItem({
                  productId: item.id,
                  productName: item.name,
                  sku: item.sku,
                  unitPriceCents: item.priceCents,
                  taxRate: item.taxRate,
                })}
              />
            )}
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>
                {isLoading ? 'Cargando...' : 'No hay productos'}
              </Text>
            )}
          />
        </View>

        <Cart />
      </View>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  scanButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  productsContainer: {
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    padding: 32,
    color: '#666',
  },
});
