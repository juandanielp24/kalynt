'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportsApi, ReportType, ReportFormat, ReportStatus, REPORT_TYPE_LABELS } from '@/lib/api/reports';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from '@retail/ui';
import {
  Plus,
  FileText,
  Download,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pendiente',
    color: 'bg-gray-100 text-gray-800',
    icon: Clock,
  },
  PROCESSING: {
    label: 'Procesando',
    color: 'bg-blue-100 text-blue-800',
    icon: Loader2,
  },
  COMPLETED: {
    label: 'Completado',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
  },
  FAILED: {
    label: 'Fallido',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
  },
};

const FORMAT_ICONS = {
  PDF: FileText,
  EXCEL: FileSpreadsheet,
  CSV: FileText,
};

export default function ReportsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['reports', typeFilter, statusFilter],
    queryFn: () =>
      reportsApi.getReports({
        type: typeFilter !== 'all' ? (typeFilter as ReportType) : undefined,
        status: statusFilter !== 'all' ? (statusFilter as ReportStatus) : undefined,
      }),
    refetchInterval: 5000, // Refetch every 5 seconds to update status
  });

  const deleteReportMutation = useMutation({
    mutationFn: reportsApi.deleteReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast({
        title: 'Reporte eliminado',
        description: 'El reporte ha sido eliminado correctamente',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo eliminar el reporte',
        variant: 'destructive',
      });
    },
  });

  const handleDownload = async (report: any) => {
    try {
      const blob = await reportsApi.downloadReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.name}.${report.format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Descarga iniciada',
        description: 'El reporte se está descargando',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo descargar el reporte',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (reportId: string) => {
    if (confirm('¿Estás seguro de eliminar este reporte?')) {
      await deleteReportMutation.mutateAsync(reportId);
    }
  };

  const reports = reportsData?.data?.reports || [];
  const stats = {
    total: reports.length,
    completed: reports.filter((r: any) => r.status === 'COMPLETED').length,
    processing: reports.filter((r: any) => r.status === 'PROCESSING').length,
    failed: reports.filter((r: any) => r.status === 'FAILED').length,
  };

  return (
    <ProtectedRoute>
      <PermissionGuard resource="REPORTS" action="READ">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Reportes</h1>
              <p className="text-gray-600 mt-1">
                Genera y descarga reportes personalizados
              </p>
            </div>

            <PermissionGuard resource="REPORTS" action="CREATE">
              <Link href="/reports/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Generar Reporte
                </Button>
              </Link>
            </PermissionGuard>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Reportes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-600">
                  Completados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600">
                  Procesando
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.processing}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-600">
                  Fallidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.failed}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="COMPLETED">Completados</SelectItem>
                      <SelectItem value="PROCESSING">Procesando</SelectItem>
                      <SelectItem value="PENDING">Pendientes</SelectItem>
                      <SelectItem value="FAILED">Fallidos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reports List */}
          {isLoading ? (
            <div className="text-center py-12">Cargando reportes...</div>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay reportes</h3>
                <p className="text-gray-600 mb-4">
                  Genera tu primer reporte para comenzar
                </p>
                <PermissionGuard resource="REPORTS" action="CREATE">
                  <Link href="/reports/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Generar Reporte
                    </Button>
                  </Link>
                </PermissionGuard>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {reports.map((report: any) => {
                const StatusIcon = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG]?.icon;
                const statusConfig = STATUS_CONFIG[report.status as keyof typeof STATUS_CONFIG];
                const FormatIcon = FORMAT_ICONS[report.format as keyof typeof FORMAT_ICONS];

                return (
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {FormatIcon && (
                              <FormatIcon className="h-5 w-5 text-gray-400" />
                            )}
                            <h3 className="text-lg font-semibold">{report.name}</h3>
                            <Badge className={statusConfig?.color}>
                              {StatusIcon && <StatusIcon className="h-3 w-3 mr-1" />}
                              {statusConfig?.label}
                            </Badge>
                            <Badge variant="outline">{report.format}</Badge>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Tipo:</span>{' '}
                              {REPORT_TYPE_LABELS[report.type as ReportType]}
                            </div>
                            <div>
                              <span className="font-medium">Creado:</span>{' '}
                              {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm')} •{' '}
                              {formatDistanceToNow(new Date(report.createdAt), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </div>
                            {report.generatedAt && (
                              <div>
                                <span className="font-medium">Generado:</span>{' '}
                                {format(new Date(report.generatedAt), 'dd/MM/yyyy HH:mm')}
                              </div>
                            )}
                            {report.generatedBy && (
                              <div>
                                <span className="font-medium">Por:</span>{' '}
                                {report.generatedBy.name}
                              </div>
                            )}
                            {report.fileSize && (
                              <div>
                                <span className="font-medium">Tamaño:</span>{' '}
                                {(report.fileSize / 1024).toFixed(2)} KB
                              </div>
                            )}
                            {report.error && (
                              <div className="text-red-600">
                                <span className="font-medium">Error:</span> {report.error}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {report.status === 'COMPLETED' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(report)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {report.status === 'PROCESSING' && (
                            <Button variant="outline" size="sm" disabled>
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </Button>
                          )}

                          <PermissionGuard resource="REPORTS" action="DELETE">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(report.id)}
                              disabled={deleteReportMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </PermissionGuard>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PermissionGuard>
    </ProtectedRoute>
  );
}
