import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Building2,
  FileText,
  TrendingUp,
  MapPin,
  ArrowLeftRight,
  BarChart3,
  Settings,
  Users,
  Bell,
  Shield,
  ChevronRight,
} from 'lucide-react-native';

interface MenuItem {
  title: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  route: string;
  description?: string;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: 'Inventario',
    items: [
      {
        title: 'Ubicaciones',
        icon: MapPin,
        route: '/locations',
        description: 'Gestiona tus locales y depósitos',
      },
      {
        title: 'Transferencias',
        icon: ArrowLeftRight,
        route: '/transfers',
        description: 'Traslados entre ubicaciones',
      },
    ],
  },
  {
    title: 'Compras',
    items: [
      {
        title: 'Proveedores',
        icon: Building2,
        route: '/suppliers',
        description: 'Gestiona tus proveedores',
      },
      {
        title: 'Órdenes de Compra',
        icon: FileText,
        route: '/purchase-orders',
        description: 'Órdenes a proveedores',
      },
      {
        title: 'Sugerencias de Reposición',
        icon: TrendingUp,
        route: '/reorder',
        description: 'Productos para reponer',
      },
    ],
  },
  {
    title: 'Ventas',
    items: [
      {
        title: 'Clientes',
        icon: Users,
        route: '/customers',
        description: 'Gestiona tus clientes',
      },
    ],
  },
  {
    title: 'Sistema',
    items: [
      {
        title: 'Reportes y Analytics',
        icon: BarChart3,
        route: '/analytics',
        description: 'Visualiza estadísticas',
      },
      {
        title: 'Notificaciones',
        icon: Bell,
        route: '/notifications',
        description: 'Centro de notificaciones',
      },
      {
        title: 'Permisos y Roles',
        icon: Shield,
        route: '/roles',
        description: 'Control de acceso',
      },
      {
        title: 'Configuración',
        icon: Settings,
        route: '/settings',
        description: 'Ajustes de la aplicación',
      },
    ],
  },
];

export default function MoreScreen() {
  const router = useRouter();

  const handleNavigate = (route: string) => {
    router.push(route as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Más</Text>
        <Text style={styles.subtitle}>Funciones adicionales</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={[
                      styles.menuItem,
                      itemIndex === section.items.length - 1 && styles.menuItemLast,
                    ]}
                    onPress={() => handleNavigate(item.route)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.menuItemIcon}>
                      <Icon size={24} color="#3b82f6" />
                    </View>
                    <View style={styles.menuItemContent}>
                      <Text style={styles.menuItemTitle}>{item.title}</Text>
                      {item.description && (
                        <Text style={styles.menuItemDescription}>{item.description}</Text>
                      )}
                    </View>
                    <ChevronRight size={20} color="#9ca3af" />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Retail App Mobile</Text>
          <Text style={styles.appInfoVersion}>Versión 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
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
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionContent: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5e5',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  menuItemDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  appInfo: {
    padding: 24,
    alignItems: 'center',
  },
  appInfoText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  appInfoVersion: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
});
