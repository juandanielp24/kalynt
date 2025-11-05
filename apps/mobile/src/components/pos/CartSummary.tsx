import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Badge } from 'react-native-paper';
import { ShoppingCart } from 'lucide-react-native';

interface CartSummaryProps {
  itemCount: number;
  total: number;
  onPress: () => void;
}

export function CartSummary({ itemCount, total, onPress }: CartSummaryProps) {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <ShoppingCart size={24} color="#fff" />
          <Badge style={styles.badge}>{itemCount}</Badge>
        </View>

        <View style={styles.centerSection}>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.total}>${(total / 100).toFixed(2)}</Text>
        </View>

        <View style={styles.rightSection}>
          <Text style={styles.actionText}>Ver Carrito →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#6200ee',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  leftSection: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f44336',
  },
  centerSection: {
    flex: 1,
    marginLeft: 20,
  },
  label: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  total: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  rightSection: {
    marginLeft: 20,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
