'use client';

import { useState, useEffect } from 'react';
import { Search, Barcode, MapPin } from 'lucide-react';
import { Input, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@retail/ui';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { CartSidebar } from '@/components/pos/CartSidebar';
import { CheckoutDialog } from '@/components/pos/CheckoutDialog';
import { useCartStore } from '@/store/cart-store';
import { productsApi, locationsApi, type Product, type Location } from '@/lib/api';

export default function POSPage() {
  const cart = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Load locations on mount
  useEffect(() => {
    loadLocations();
  }, []);

  // Load products when location changes
  useEffect(() => {
    if (selectedLocation) {
      loadProducts();
    }
  }, [selectedLocation]);

  const loadLocations = async () => {
    try {
      setIsLoadingLocations(true);
      const response = await locationsApi.findAll({ isActive: true });
      setLocations(response.data);

      // Auto-select first location
      if (response.data[0]) {
        setSelectedLocation(response.data[0].id);
        cart.setLocationId(response.data[0].id);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await productsApi.findAll({
        locationId: selectedLocation,
        search: searchQuery || undefined,
        inStock: true,
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleLocationChange = (locationId: string) => {
    setSelectedLocation(locationId);
    cart.setLocationId(locationId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProducts();
  };

  const handleProductSelect = (product: Product) => {
    cart.addItem({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unitPriceCents: product.priceCents,
      taxRate: product.taxRate,
    });
  };

  const handleCheckout = () => {
    setCheckoutOpen(true);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with search and location */}
        <div className="p-4 border-b bg-card space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Punto de Venta</h1>

            {/* Location selector */}
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Select
                value={selectedLocation}
                onValueChange={handleLocationChange}
                disabled={isLoadingLocations}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Seleccionar ubicación" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name}
                      {location.address && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {location.address}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por nombre, SKU, código de barras..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" variant="outline">
              Buscar
            </Button>
            <Button type="button" variant="outline" size="icon" title="Escanear código">
              <Barcode className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-auto p-4">
          {!selectedLocation ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  Selecciona una ubicación
                </h3>
                <p className="text-muted-foreground">
                  Elige una ubicación para ver los productos disponibles
                </p>
              </div>
            </div>
          ) : (
            <ProductGrid
              products={products}
              isLoading={isLoadingProducts}
              onProductSelect={handleProductSelect}
            />
          )}
        </div>
      </div>

      {/* Cart sidebar */}
      <CartSidebar onCheckout={handleCheckout} />

      {/* Checkout dialog */}
      <CheckoutDialog open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}
