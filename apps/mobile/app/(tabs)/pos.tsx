import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, FAB, Portal, Dialog, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductSearchBar } from '../../src/components/pos/ProductSearchBar';
import { ProductCard } from '../../src/components/pos/ProductCard';
import { CartSummary } from '../../src/components/pos/CartSummary';
import { CheckoutModal } from '../../src/components/pos/CheckoutModal';
import { SyncIndicator } from '../../src/components/SyncIndicator';
import { usePOSMobileStore } from '../../store/pos-mobile-store';
import { useProducts } from '../../src/hooks/use-products';

export default function POSScreen() {
  const { items, totalCents, removeItem, updateQuantity } = usePOSMobileStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutVisible, setIsCheckoutVisible] = useState(false);
  const [isCartVisible, setIsCartVisible] = useState(false);

  const { products, isLoading } = useProducts(searchQuery);

  const hasItems = items.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Punto de Venta
        </Text>
        <SyncIndicator />
      </View>

      {/* Search Bar */}
      <ProductSearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Product List */}
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ProductCard product={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            {isLoading ? (
              <Text>Buscando productos...</Text>
            ) : searchQuery ? (
              <Text>No se encontraron productos</Text>
            ) : (
              <Text>Busca productos para comenzar</Text>
            )}
          </View>
        }
      />

      {/* Cart Summary Bottom Bar */}
      {hasItems && (
        <CartSummary
          itemCount={items.length}
          total={totalCents}
          onPress={() => setIsCartVisible(true)}
        />
      )}

      {/* Floating Action Buttons */}
      <Portal>
        <FAB.Group
          open={false}
          visible
          icon="cart"
          actions={[
            {
              icon: 'cart',
              label: 'Ver Carrito',
              onPress: () => setIsCartVisible(true),
              disabled: !hasItems,
            },
            {
              icon: 'cash-register',
              label: 'Cobrar',
              onPress: () => setIsCheckoutVisible(true),
              disabled: !hasItems,
            },
          ]}
          onStateChange={() => {}}
        />
      </Portal>

      {/* Cart Dialog */}
      <Portal>
        <Dialog
          visible={isCartVisible}
          onDismiss={() => setIsCartVisible(false)}
          style={styles.cartDialog}
        >
          <Dialog.Title>Carrito</Dialog.Title>
          <Dialog.Content>
            <CartItems
              items={items}
              removeItem={removeItem}
              updateQuantity={updateQuantity}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setIsCartVisible(false)}>Cerrar</Button>
            <Button
              mode="contained"
              onPress={() => {
                setIsCartVisible(false);
                setIsCheckoutVisible(true);
              }}
            >
              Procesar Venta
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Checkout Modal */}
      <CheckoutModal
        visible={isCheckoutVisible}
        onDismiss={() => setIsCheckoutVisible(false)}
      />
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
  },
  listContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  cartDialog: {
    maxHeight: '80%',
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantity: {
    minWidth: 30,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  itemTotal: {
    minWidth: 80,
    textAlign: 'right',
    fontWeight: 'bold',
  },
});

// Cart Items Component
interface CartItemsProps {
  items: any[];
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
}

function CartItems({ items, removeItem, updateQuantity }: CartItemsProps) {
  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.cartItem}>
          <View style={styles.cartItemInfo}>
            <Text variant="titleMedium">{item.name}</Text>
            <Text variant="bodySmall">
              ${(item.unitPriceCents / 100).toFixed(2)} c/u
            </Text>
          </View>
          <View style={styles.cartItemActions}>
            <Button
              mode="outlined"
              compact
              onPress={() => updateQuantity(item.id, item.quantity - 1)}
            >
              -
            </Button>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <Button
              mode="outlined"
              compact
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
            >
              +
            </Button>
            <Text style={styles.itemTotal}>
              ${(item.totalCents / 100).toFixed(2)}
            </Text>
          </View>
        </View>
      )}
    />
  );
}
