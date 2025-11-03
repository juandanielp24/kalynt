import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useCartStore } from '@/store/cart-store';
import { formatCurrencyARS } from '@retail/shared';

export function Cart() {
  const cart = useCartStore();
  const items = cart.items;
  const totalCents = cart.getTotalCents();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Carrito</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.productId}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.productName}
              </Text>
              <Text style={styles.itemQuantity}>x{item.quantity}</Text>
            </View>
            <View style={styles.itemActions}>
              <Text style={styles.itemPrice}>
                {formatCurrencyARS(item.unitPriceCents * item.quantity)}
              </Text>
              <Pressable onPress={() => cart.removeItem(item.productId)}>
                <Trash2 color="#ef4444" size={18} />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>Carrito vacío</Text>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalValue}>
            {formatCurrencyARS(totalCents)}
          </Text>
        </View>
        <Pressable
          style={[
            styles.checkoutButton,
            items.length === 0 && styles.checkoutButtonDisabled,
          ]}
          disabled={items.length === 0}
          onPress={() => {
            // Navigate to checkout
          }}
        >
          <Text style={styles.checkoutButtonText}>
            Procesar Venta
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#e5e5e5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    padding: 32,
    color: '#999',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  checkoutButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#e5e5e5',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
