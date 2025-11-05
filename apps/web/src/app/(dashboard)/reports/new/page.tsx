'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi, ReportType, ReportFormat, REPORT_TYPE_LABELS } from '@/lib/api/reports';
import { apiClient } from '@/lib/api-client';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@retail/ui';
import { ArrowLeft, FileText, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewReportPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    type: '' as ReportType | '',
    format: 'PDF' as ReportFormat,
    startDate: '',
    endDate: '',
    locationId: '',
    categoryId: '',
    userId: '',
  });

  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const response = await apiClient.get('/locations');
      return response.data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await apiClient.get('/categories');
      return response.data;
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await apiClient.get('/users');
      return response.data;
    },
  });

  const createReportMutation = useMutation({
    mutationFn: reportsApi.createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Reporte en proceso',
        description: 'El reporte se está generando. Te notificaremos cuando esté listo.',
      });
      router.push('/reports');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo generar el reporte',
        variant: 'destructive',
      });
    },
  });

  const locations = locationsData?.data || [];
  const categories = categoriesData?.data || [];
  const users = usersData?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type) {
      toast({
        title: 'Error',
        description: 'Selecciona un tipo de reporte',
        variant: 'destructive',
      });
      return;
    }

    // Build filters
    const filters: any = {};
    if (formData.startDate) filters.startDate = formData.startDate;
    if (formData.endDate) filters.endDate = formData.endDate;
    if (formData.locationId) filters.locationId = formData.locationId;
    if (formData.categoryId) filters.categoryId = formData.categoryId;
    if (formData.userId) filters.userId = formData.userId;

    // Generate default name if empty
    const name = formData.name || `${REPORT_TYPE_LABELS[formData.type]} - ${new Date().toLocaleDateString()}`;

    createReportMutation.mutate({
      name,
      type: formData.type,
      format: formData.format,
      filters,
    });
  };

  const reportTypes = [
    {
      category: 'Ventas',
      types: [
        {
          value: ReportType.SALES_SUMMARY,
          label: 'Resumen de Ventas',
          description: 'Análisis general de ventas, métodos de pago, productos top',
        },
        {
          value: ReportType.SALES_DETAIL,
          label: 'Detalle de Ventas',
          description: 'Listado completo de todas las ventas realizadas',
        },
      ],
    },
    {
      category: 'Inventario',
      types: [
        {
          value: ReportType.INVENTORY_STOCK,
          label: 'Estado de Inventario',
          description: 'Stock actual por producto, alertas de stock bajo',
        },
        {
          value: ReportType.INVENTORY_MOVEMENTS,
          label: 'Movimientos de Stock',
          description: 'Historial de entradas, salidas y ajustes de inventario',
        },
        {
          value: ReportType.PRODUCTS_PERFORMANCE,
          label: 'Performance de Productos',
          description: 'Análisis de rendimiento, rotación y rentabilidad por producto',
        },
      ],
    },
    {
      category: 'Compras',
      types: [
        {
          value: ReportType.PURCHASE_ORDERS,
          label: 'Órdenes de Compra',
          description: 'Resumen de órdenes de compra por proveedor',
        },
        {
          value: ReportType.SUPPLIERS_SUMMARY,
          label: 'Resumen por Proveedor',
          description: 'Análisis de compras y pagos a proveedores',
        },
      ],
    },
  ];

  const needsDateRange = [
    ReportType.SALES_SUMMARY,
    ReportType.SALES_DETAIL,
    ReportType.INVENTORY_MOVEMENTS,
    ReportType.PRODUCTS_PERFORMANCE,
  ].includes(formData.type as ReportType);

  const needsLocation = [
    ReportType.INVENTORY_STOCK,
    ReportType.INVENTORY_MOVEMENTS,
    ReportType.SALES_SUMMARY,
  ].includes(formData.type as ReportType);

  const needsCategory = [
    ReportType.INVENTORY_STOCK,
    ReportType.PRODUCTS_PERFORMANCE,
  ].includes(formData.type as ReportType);

  return (
    <ProtectedRoute>
      <PermissionGuard resource="REPORTS" action="CREATE">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/reports">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Generar Reporte</h1>
              <p className="text-gray-600 mt-1">
                Configura y genera un reporte personalizado
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Report Type Selection */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tipo de Reporte</CardTitle>
                    <CardDescription>
                      Selecciona el tipo de reporte que deseas generar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {reportTypes.map((category) => (
                        <div key={category.category}>
                          <h3 className="font-semibold mb-3">{category.category}</h3>
                          <div className="space-y-2">
                            {category.types.map((type) => (
                              <div
                                key={type.value}
                                className={`flex items-start space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                                  formData.type === type.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() =>
                                  setFormData({ ...formData, type: type.value })
                                }
                              >
                                <input
                                  type="radio"
                                  name="reportType"
                                  value={type.value}
                                  checked={formData.type === type.value}
                                  onChange={() =>
                                    setFormData({ ...formData, type: type.value })
                                  }
                                  className="mt-1"
                                />
                                <div className="flex-1">
                                  <label
                                    htmlFor={type.value}
                                    className="font-medium cursor-pointer"
                                  >
                                    {type.label}
                                  </label>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {type.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Filters */}
                {formData.type && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Filtros</CardTitle>
                      <CardDescription>
                        Personaliza el contenido del reporte
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Date Range */}
                      {needsDateRange && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="startDate">Fecha Desde</Label>
                            <Input
                              id="startDate"
                              type="date"
                              value={formData.startDate}
                              onChange={(e) =>
                                setFormData({ ...formData, startDate: e.target.value })
                              }
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="endDate">Fecha Hasta</Label>
                            <Input
                              id="endDate"
                              type="date"
                              value={formData.endDate}
                              onChange={(e) =>
                                setFormData({ ...formData, endDate: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      )}

                      {/* Location */}
                      {needsLocation && (
                        <div className="space-y-2">
                          <Label htmlFor="locationId">Ubicación (Opcional)</Label>
                          <Select
                            value={formData.locationId}
                            onValueChange={(value) =>
                              setFormData({ ...formData, locationId: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Todas las ubicaciones" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Todas las ubicaciones</SelectItem>
                              {locations.map((location: any) => (
                                <SelectItem key={location.id} value={location.id}>
                                  {location.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {/* Category */}
                      {needsCategory && (
                        <div className="space-y-2">
                          <Label htmlFor="categoryId">Categoría (Opcional)</Label>
                          <Select
                            value={formData.categoryId}
                            onValueChange={(value) =>
                              setFormData({ ...formData, categoryId: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Todas las categorías" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Todas las categorías</SelectItem>
                              {categories.map((category: any) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Configuration */}
              <div className="space-y-6">
                <Card className="sticky top-6">
                  <CardHeader>
                    <CardTitle>Configuración</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del Reporte (Opcional)</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Se generará automáticamente"
                      />
                    </div>

                    {/* Format */}
                    <div className="space-y-2">
                      <Label>Formato</Label>
                      <div className="space-y-2">
                        <div
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.format === 'PDF'
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, format: 'PDF' })}
                        >
                          <input
                            type="radio"
                            name="format"
                            value="PDF"
                            checked={formData.format === 'PDF'}
                            onChange={() => setFormData({ ...formData, format: 'PDF' })}
                          />
                          <FileText className="h-4 w-4" />
                          <span>PDF</span>
                        </div>
                        <div
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                            formData.format === 'EXCEL'
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, format: 'EXCEL' })}
                        >
                          <input
                            type="radio"
                            name="format"
                            value="EXCEL"
                            checked={formData.format === 'EXCEL'}
                            onChange={() => setFormData({ ...formData, format: 'EXCEL' })}
                          />
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>Excel</span>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="pt-4 border-t">
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>
                          <strong>PDF:</strong> Ideal para visualizar e imprimir
                        </p>
                        <p>
                          <strong>Excel:</strong> Permite edición y análisis de datos
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 space-y-2">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={createReportMutation.isPending || !formData.type}
                      >
                        {createReportMutation.isPending ? 'Generando...' : 'Generar Reporte'}
                      </Button>

                      <Link href="/reports" className="block">
                        <Button type="button" variant="outline" className="w-full">
                          Cancelar
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Tips */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">💡 Consejos</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600 space-y-2">
                    <p>• Los reportes se generan en segundo plano</p>
                    <p>• Recibirás una notificación cuando estén listos</p>
                    <p>• Puedes generar múltiples reportes simultáneamente</p>
                    <p>• Los archivos se guardan por 30 días</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </PermissionGuard>
    </ProtectedRoute>
  );
}
