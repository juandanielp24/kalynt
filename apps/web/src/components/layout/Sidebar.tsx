'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@retail/ui';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Users,
  BarChart3,
  Settings,
  Store,
  Building2,
  ArrowLeftRight,
  Truck,
  FileText,
  TrendingUp,
  MapPin,
  Tag,
  Award,
  Calendar,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    // Sección principal
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        title: 'Punto de Venta',
        href: '/pos',
        icon: ShoppingCart,
      },
    ],
  },
  {
    title: 'Inventario',
    items: [
      {
        title: 'Productos',
        href: '/inventory',
        icon: Package,
      },
      {
        title: 'Multi-tienda',
        href: '/locations',
        icon: MapPin,
      },
      {
        title: 'Transferencias',
        href: '/inventory/transfers',
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    title: 'Compras',
    items: [
      {
        title: 'Proveedores',
        href: '/suppliers',
        icon: Building2,
      },
      {
        title: 'Órdenes de Compra',
        href: '/purchases/orders',
        icon: FileText,
      },
      {
        title: 'Sugerencias',
        href: '/purchases/reorder',
        icon: TrendingUp,
      },
    ],
  },
  {
    title: 'Ventas',
    items: [
      {
        title: 'Historial',
        href: '/sales',
        icon: Receipt,
      },
      {
        title: 'Clientes',
        href: '/customers',
        icon: Users,
      },
      {
        title: 'Citas',
        href: '/appointments',
        icon: Calendar,
      },
      {
        title: 'Fidelidad',
        href: '/loyalty',
        icon: Award,
      },
      {
        title: 'Promociones',
        href: '/promotions',
        icon: Tag,
      },
      {
        title: 'Delivery',
        href: '/delivery',
        icon: Truck,
      },
      {
        title: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    // Sección inferior
    items: [
      {
        title: 'Reportes',
        href: '/reports',
        icon: BarChart3,
      },
      {
        title: 'Configuración',
        href: '/settings',
        icon: Settings,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-card">
      {/* Logo y branding */}
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Store className="h-6 w-6 text-primary" />
        <div className="flex flex-col">
          <span className="text-lg font-semibold">Retail App</span>
          <span className="text-xs text-muted-foreground">Super App</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {navSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-6 last:mb-0">
            {section.title && (
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.title}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Tenant info */}
      <div className="border-t p-4">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs font-medium text-muted-foreground">Comercio</p>
          <p className="text-sm font-semibold">Demo Store</p>
          <p className="text-xs text-muted-foreground">CUIT: 20-12345678-6</p>
        </div>
      </div>
    </aside>
  );
}
