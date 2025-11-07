'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@retail/ui';
import {
  Package,
  Download,
  Search,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ZAxis,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface Props {
  period: string;
  onExport: () => void;
}

export function ProductPerformance({ period, onExport }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'revenue' | 'profit' | 'quantity' | 'margin'>('revenue');

  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['product-performance', period],
    queryFn: () => analyticsApi.getProductPerformance(period),
  });

  const data = performanceData?.data;

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];

    let filtered = data.products.filter(
      (p: any) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'revenue':
          return b.revenue - a.revenue;
        case 'profit':
          return b.profit - a.profit;
        case 'quantity':
          return b.quantitySold - a.quantitySold;
        case 'margin':
          return b.profitMargin - a.profitMargin;
        default:
          return 0;
      }
    });

    return filtered;
  }, [data?.products, searchTerm, sortBy]);

  if (isLoading) {
    return <div className="text-center py-12">Cargando análisis de productos...</div>;
  }

  if (!data) return null;

  const topProducts = filteredProducts.slice(0, 15);
  const tableProducts = filteredProducts.slice(0, 50);

  // Matrix data - scatter plot
  const matrixData = filteredProducts.slice(0, 30).map((p: any) => ({
    x: p.revenue,
    y: p.profitMargin,
    z: p.quantitySold,
    name: p.name,
  }));

  // Calculate insights
  const lowMarginProducts = filteredProducts.filter((p: any) => p.profitMargin < 20).length;
  const criticalStockProducts = filteredProducts.filter(
    (p: any) => p.currentStock <= p.minimumStock
  ).length;
  const starProducts = filteredProducts.filter(
    (p: any) => p.profitMargin > 40 && p.revenue > 5000
  ).length;
  const slowMovers = filteredProducts.filter((p: any) => p.turnoverRate < 2).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Análisis de Productos
          </h2>
          <p className="text-gray-600">Performance detallado por producto</p>
        </div>

        <Button onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre o SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="revenue">Por Ingresos</SelectItem>
            <SelectItem value="profit">Por Ganancia</SelectItem>
            <SelectItem value="quantity">Por Cantidad</SelectItem>
            <SelectItem value="margin">Por Margen</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalProducts}</div>
            <p className="text-xs text-gray-600 mt-1">En el período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ingresos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${data.summary.totalRevenue.toLocaleString('es-AR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Ganancia Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${data.summary.totalProfit.toLocaleString('es-AR')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Margen Promedio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.summary.averageMargin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Margen Bajo</h4>
                <p className="text-sm text-gray-700">
                  {lowMarginProducts} productos con margen menor al 20%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-red-500 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Stock Crítico</h4>
                <p className="text-sm text-gray-700">
                  {criticalStockProducts} productos con stock bajo mínimo
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-yellow-500 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Star className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Productos Estrella</h4>
                <p className="text-sm text-gray-700">
                  {starProducts} productos con alto margen y ventas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-gray-500 bg-gray-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm mb-1">Baja Rotación</h4>
                <p className="text-sm text-gray-700">
                  {slowMovers} productos con rotación lenta
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top 15 Productos por Ingresos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 150 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={150} />
              <Tooltip
                formatter={(value: number) => `$${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Ingresos" />
              <Bar dataKey="profit" fill="#10b981" name="Ganancia" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Product Performance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Performance: Margen vs Ingresos</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            El tamaño de las burbujas representa la cantidad vendida
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="x"
                name="Ingresos"
                label={{ value: 'Ingresos ($)', position: 'bottom' }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Margen"
                label={{ value: 'Margen (%)', angle: -90, position: 'left' }}
              />
              <ZAxis type="number" dataKey="z" range={[50, 1000]} name="Cantidad" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(value: any, name: string) => {
                  if (name === 'Ingresos') return `$${value.toFixed(2)}`;
                  if (name === 'Margen') return `${value.toFixed(1)}%`;
                  return value;
                }}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc' }}
              />
              <Scatter name="Productos" data={matrixData} fill="#3b82f6" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>

          {/* Matrix Legend */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Productos Estrella (Alto Margen + Altos Ingresos)
              </h4>
              <p className="text-sm text-green-800">
                Mantener stock, promocionar, maximizar visibilidad
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Productos Volumen (Bajo Margen + Altos Ingresos)
              </h4>
              <p className="text-sm text-blue-800">
                Optimizar costos, negociar con proveedores, bundles
              </p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Productos Nicho (Alto Margen + Bajos Ingresos)
              </h4>
              <p className="text-sm text-yellow-800">
                Aumentar marketing, cross-selling, evaluar demanda
              </p>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Revisar Estrategia (Bajo Margen + Bajos Ingresos)
              </h4>
              <p className="text-sm text-red-800">
                Discontinuar, liquidar, o replantear estrategia
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis Detallado por Producto (Top 50)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Producto</th>
                  <th className="text-left py-3 px-4">SKU</th>
                  <th className="text-left py-3 px-4">Categoría</th>
                  <th className="text-right py-3 px-4">Cantidad</th>
                  <th className="text-right py-3 px-4">Ingresos</th>
                  <th className="text-right py-3 px-4">Ganancia</th>
                  <th className="text-right py-3 px-4">Margen</th>
                  <th className="text-right py-3 px-4">Stock</th>
                  <th className="text-right py-3 px-4">Rotación</th>
                  <th className="text-right py-3 px-4">Días Stock</th>
                </tr>
              </thead>
              <tbody>
                {tableProducts.map((product: any, index: number) => {
                  const stockStatus =
                    product.currentStock <= product.minimumStock
                      ? 'critical'
                      : product.currentStock <= product.minimumStock * 2
                      ? 'low'
                      : 'ok';

                  const marginColor =
                    product.profitMargin >= 40
                      ? 'text-green-600'
                      : product.profitMargin >= 20
                      ? 'text-blue-600'
                      : 'text-orange-600';

                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{product.name}</td>
                      <td className="py-3 px-4 text-gray-600">{product.sku}</td>
                      <td className="py-3 px-4 text-gray-600">{product.categoryName}</td>
                      <td className="text-right py-3 px-4">{product.quantitySold}</td>
                      <td className="text-right py-3 px-4">
                        ${product.revenue.toFixed(2)}
                      </td>
                      <td className="text-right py-3 px-4 text-green-600 font-medium">
                        ${product.profit.toFixed(2)}
                      </td>
                      <td className={`text-right py-3 px-4 font-medium ${marginColor}`}>
                        {product.profitMargin.toFixed(1)}%
                      </td>
                      <td className="text-right py-3 px-4">
                        <Badge
                          variant={
                            stockStatus === 'critical'
                              ? 'destructive'
                              : stockStatus === 'low'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {product.currentStock}
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-4">
                        {product.turnoverRate.toFixed(1)}x
                      </td>
                      <td className="text-right py-3 px-4">
                        {product.daysOfStock.toFixed(0)} días
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredProducts.length > 50 && (
              <div className="text-center text-gray-600 py-4">
                Mostrando 50 de {filteredProducts.length} productos
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
