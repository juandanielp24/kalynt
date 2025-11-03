import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { formatCurrencyARS } from '@retail/shared';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    priceCents: number;
    imageUrl?: string;
  };
  onPress: () => void;
}

export function ProductCard({ product, onPress }: ProductCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      {product.imageUrl ? (
        <Image
          source={{ uri: product.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>
            {product.name.charAt(0)}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.price}>
          {formatCurrencyARS(product.priceCents)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  cardPressed: {
    opacity: 0.7,
  },
  image: {
    width: '100%',
    height: 120,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#e5e5e5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#999',
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
});
