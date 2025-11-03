import { Tabs } from 'expo-router';
import { ShoppingCart, Package, BarChart, Menu } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e5e5',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'POS',
          tabBarIcon: ({ color, size }) => (
            <ShoppingCart color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventario',
          tabBarIcon: ({ color, size }) => (
            <Package color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: 'Ventas',
          tabBarIcon: ({ color, size }) => (
            <BarChart color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Más',
          tabBarIcon: ({ color, size }) => (
            <Menu color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
