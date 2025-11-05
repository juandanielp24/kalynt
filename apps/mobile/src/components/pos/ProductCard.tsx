import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Card, Text, Button, Badge } from 'react-native-paper';
import { usePOSMobileStore } from '../../../store/pos-mobile-store';

interface Product {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  imageUrl?: string;
  stock?: {
    quantity: number;
  };
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = usePOSMobileStore((state) => state.addItem);

  const stock = product.stock?.quantity || 0;
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= 5;

  const handleAdd = () => {
    if (!isOutOfStock) {
      addItem(product);
    }
  };

  return (
    <Card style={styles.card} mode="elevated">
      <Card.Content style={styles.content}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text variant="titleLarge">📦</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.info}>
          <Text variant="titleMedium" numberOfLines={2}>
            {product.name}
          </Text>
          <Text variant="bodySmall" style={styles.sku}>
            SKU: {product.sku}
          </Text>

          <View style={styles.priceRow}>
            <Text variant="headlineSmall" style={styles.price}>
              ${(product.priceCents / 100).toFixed(2)}
            </Text>

            {isOutOfStock && <Badge style={styles.outOfStockBadge}>Sin stock</Badge>}
            {isLowStock && (
              <Badge style={styles.lowStockBadge}>Stock: {stock}</Badge>
            )}
          </View>
        </View>

        {/* Add Button */}
        <Button
          mode="contained"
          onPress={handleAdd}
          disabled={isOutOfStock}
          style={styles.addButton}
          compact
        >
          Agregar
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imageContainer: {
    width: 60,
    height: 60,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    gap: 4,
  },
  sku: {
    color: '#666',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  price: {
    fontWeight: 'bold',
    color: '#6200ee',
  },
  outOfStockBadge: {
    backgroundColor: '#f44336',
  },
  lowStockBadge: {
    backgroundColor: '#ff9800',
  },
  addButton: {
    alignSelf: 'center',
  },
});
