import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '@/store/cart-store';

// Mock types - should import from shared lib
interface Product {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  taxRate: number;
  stock?: Array<{
    quantity: number;
  }>;
  category?: {
    name: string;
  };
}

export default function POSScreen() {
  const cart = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // Mock product loading - should use API client
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await productsApi.findAll({ inStock: true });
      // setProducts(response.data);
      setProducts([]);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    const amount = cents / 100;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const handleAddToCart = (product: Product) => {
    cart.addItem({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unitPriceCents: product.priceCents,
      taxRate: product.taxRate,
    });
  };

  const renderProductItem = ({ item }: { item: Product }) => {
    const stockQuantity = item.stock?.[0]?.quantity || 0;
    const inStock = stockQuantity > 0;

    return (
      <TouchableOpacity
        style={[styles.productCard, !inStock && styles.productCardDisabled]}
        onPress={() => inStock && handleAddToCart(item)}
        disabled={!inStock}
      >
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productSku}>{item.sku}</Text>
          {item.category && (
            <Text style={styles.productCategory}>{item.category.name}</Text>
          )}
        </View>
        <View style={styles.productDetails}>
          <Text style={styles.productPrice}>
            {formatCurrency(item.priceCents)}
          </Text>
          <Text style={styles.productTax}>
            + IVA {(item.taxRate * 100).toFixed(1)}%
          </Text>
          <Text
            style={[
              styles.productStock,
              !inStock && styles.productStockOut,
              stockQuantity <= 5 && stockQuantity > 0 && styles.productStockLow,
            ]}
          >
            {inStock ? `Stock: ${stockQuantity}` : 'Sin stock'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCartItem = (item: typeof cart.items[0]) => {
    const itemTotal =
      item.unitPriceCents * item.quantity +
      Math.round(item.unitPriceCents * item.quantity * item.taxRate) -
      (item.discountCents || 0);

    return (
      <View key={item.productId} style={styles.cartItem}>
        <View style={styles.cartItemInfo}>
          <Text style={styles.cartItemName}>{item.productName}</Text>
          <Text style={styles.cartItemSku}>{item.sku}</Text>
        </View>
        <View style={styles.cartItemControls}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => cart.updateQuantity(item.productId, item.quantity - 1)}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => cart.updateQuantity(item.productId, item.quantity + 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.cartItemPrice}>{formatCurrency(itemTotal)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar productos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Products Grid */}
        <View style={styles.productsSection}>
          {isLoading ? (
            <ActivityIndicator size="large" style={styles.loader} />
          ) : (
            <FlatList
              data={products}
              renderItem={renderProductItem}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.productsList}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No hay productos disponibles</Text>
                </View>
              }
            />
          )}
        </View>

        {/* Cart Section */}
        <View style={styles.cartSection}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>Carrito</Text>
            <Text style={styles.cartItemCount}>
              {cart.getItemCount()} {cart.getItemCount() === 1 ? 'item' : 'items'}
            </Text>
          </View>

          <ScrollView style={styles.cartItems}>
            {cart.items.length === 0 ? (
              <Text style={styles.emptyCart}>Carrito vacío</Text>
            ) : (
              cart.items.map(renderCartItem)
            )}
          </ScrollView>

          {/* Totals */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(cart.getSubtotalCents())}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>IVA</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(cart.getTaxCents())}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.totalRowFinal]}>
              <Text style={styles.totalLabelFinal}>Total</Text>
              <Text style={styles.totalValueFinal}>
                {formatCurrency(cart.getTotalCents())}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              disabled={cart.items.length === 0}
              onPress={() => setShowCheckout(true)}
            >
              <Text style={styles.buttonTextPrimary}>Procesar Venta</Text>
            </TouchableOpacity>
            {cart.items.length > 0 && (
              <TouchableOpacity
                style={[styles.button, styles.buttonOutline]}
                onPress={() => cart.clearCart()}
              >
                <Text style={styles.buttonTextOutline}>Limpiar Carrito</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  productsSection: {
    flex: 2,
    padding: 16,
  },
  productsList: {
    gap: 12,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    margin: 6,
    minHeight: 160,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productCardDisabled: {
    opacity: 0.5,
  },
  productInfo: {
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    color: '#666',
  },
  productCategory: {
    fontSize: 11,
    color: '#888',
    marginTop: 4,
  },
  productDetails: {
    marginTop: 'auto',
  },
  productPrice: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  productTax: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  productStock: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '500',
  },
  productStockLow: {
    color: '#f97316',
  },
  productStockOut: {
    color: '#ef4444',
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
  },
  cartSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#e0e0e0',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  cartItemCount: {
    fontSize: 14,
    color: '#666',
  },
  cartItems: {
    flex: 1,
    padding: 16,
  },
  emptyCart: {
    textAlign: 'center',
    color: '#999',
    marginTop: 40,
  },
  cartItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartItemInfo: {
    marginBottom: 8,
  },
  cartItemName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  cartItemSku: {
    fontSize: 12,
    color: '#666',
  },
  cartItemControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '500',
    minWidth: 24,
    textAlign: 'center',
  },
  cartItemPrice: {
    fontSize: 16,
    fontWeight: '600',
  },
  totalsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalRowFinal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: '700',
  },
  totalValueFinal: {
    fontSize: 18,
    fontWeight: '700',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#3b82f6',
  },
  buttonTextPrimary: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonOutline: {
    borderWidth: 1,
    borderColor: '#ddd',
  },
  buttonTextOutline: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});
