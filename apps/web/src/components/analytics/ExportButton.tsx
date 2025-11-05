'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@retail/ui';
import { apiClient } from '@/lib/api-client';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportButtonProps {
  dateRange: { from: Date; to: Date };
}

type ExportType = 'sales' | 'products' | 'customers';
type ExportFormat = 'excel' | 'pdf';

export function ExportButton({ dateRange }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const fetchExportData = async (type: ExportType) => {
    const response = await apiClient.get('/analytics/export', {
      params: {
        type,
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
      },
    });
    return response.data.data;
  };

  const exportToExcel = (data: any[], type: ExportType) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, getSheetName(type));

    // Auto-size columns
    const maxWidth = 30;
    const colWidths = Object.keys(data[0] || {}).map((key) => {
      const maxLength = Math.max(
        key.length,
        ...data.map((row) => String(row[key] || '').length)
      );
      return { wch: Math.min(maxLength + 2, maxWidth) };
    });
    worksheet['!cols'] = colWidths;

    const fileName = `${getFileName(type)}_${formatDate(dateRange.from)}_${formatDate(dateRange.to)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const exportToPDF = (data: any[], type: ExportType) => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(getReportTitle(type), 14, 20);

    // Add date range
    doc.setFontSize(10);
    doc.text(
      `Período: ${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}`,
      14,
      28
    );

    // Prepare table data
    const headers = Object.keys(data[0] || {});
    const rows = data.map((row) => headers.map((header) => row[header]));

    // Add table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [98, 0, 238] },
    });

    const fileName = `${getFileName(type)}_${formatDate(dateRange.from)}_${formatDate(dateRange.to)}.pdf`;
    doc.save(fileName);
  };

  const handleExport = async (type: ExportType, format: ExportFormat) => {
    try {
      setIsExporting(true);

      const data = await fetchExportData(type);

      if (!data || data.length === 0) {
        alert('No hay datos para exportar en el período seleccionado');
        return;
      }

      if (format === 'excel') {
        exportToExcel(data, type);
      } else {
        exportToPDF(data, type);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error al exportar los datos. Por favor intenta nuevamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const getSheetName = (type: ExportType): string => {
    const names = {
      sales: 'Ventas',
      products: 'Productos',
      customers: 'Clientes',
    };
    return names[type];
  };

  const getReportTitle = (type: ExportType): string => {
    const titles = {
      sales: 'Reporte de Ventas',
      products: 'Reporte de Productos',
      customers: 'Reporte de Clientes',
    };
    return titles[type];
  };

  const getFileName = (type: ExportType): string => {
    const names = {
      sales: 'ventas',
      products: 'productos',
      customers: 'clientes',
    };
    return names[type];
  };

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exportando...' : 'Exportar'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Exportar a Excel</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('sales', 'excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Ventas (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('products', 'excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Productos (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('customers', 'excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Clientes (Excel)
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuLabel>Exportar a PDF</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleExport('sales', 'pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Ventas (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('products', 'pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Productos (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('customers', 'pdf')}>
          <FileText className="h-4 w-4 mr-2" />
          Clientes (PDF)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
