'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi, TEMPLATE_TYPE_LABELS, WhatsAppTemplateType } from '@/lib/api/whatsapp';
import { Button } from '@retail/ui';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@retail/ui';
import { Input } from '@retail/ui';
import { Label } from '@retail/ui';
import { Textarea } from '@retail/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@retail/ui';
import { Badge } from '@retail/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@retail/ui';
import { Switch } from '@retail/ui';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Eye,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

export function WhatsAppTemplates() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '' as WhatsAppTemplateType | '',
    content: '',
    language: 'es',
    isActive: true,
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['whatsapp', 'templates'],
    queryFn: whatsappApi.getTemplates,
  });

  const createDefaultsMutation = useMutation({
    mutationFn: whatsappApi.createDefaultTemplates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'templates'] });
      toast.success('Plantillas predeterminadas creadas correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudieron crear las plantillas');
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: whatsappApi.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'templates'] });
      toast.success('Plantilla creada correctamente');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo crear la plantilla');
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      whatsappApi.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'templates'] });
      toast.success('Plantilla actualizada correctamente');
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo actualizar la plantilla');
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: whatsappApi.deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'templates'] });
      toast.success('Plantilla eliminada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'No se pudo eliminar la plantilla');
    },
  });

  const handleOpenDialog = (template?: any) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        type: template.type,
        content: template.content,
        language: template.language,
        isActive: template.isActive,
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        type: '' as WhatsAppTemplateType | '',
        content: '',
        language: 'es',
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingTemplate(null);
    setFormData({
      name: '',
      type: '' as WhatsAppTemplateType | '',
      content: '',
      language: 'es',
      isActive: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.type) {
      toast.error('Selecciona un tipo de plantilla');
      return;
    }

    if (editingTemplate) {
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        data: {
          ...formData,
          type: formData.type as WhatsAppTemplateType,
        },
      });
    } else {
      createTemplateMutation.mutate({
        ...formData,
        type: formData.type as WhatsAppTemplateType,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta plantilla?')) {
      await deleteTemplateMutation.mutateAsync(id);
    }
  };

  const getPreviewContent = (template: any) => {
    let content = template.content;

    // Replace common variables with examples
    const exampleVariables: Record<string, string> = {
      customerName: 'Juan Pérez',
      orderNumber: '12345',
      totalAmount: '$5,000.00',
      orderDate: '25/11/2024',
      businessName: 'Mi Negocio',
      productName: 'Producto Ejemplo',
      price: '$1,500.00',
      quantity: '5',
      locationAddress: 'Av. Ejemplo 123',
      businessHours: '9:00 a 18:00',
      amount: '$3,000.00',
      dueDate: '30/11/2024',
      deliveryMethod: 'retiro en local',
    };

    Object.entries(exampleVariables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{${key}}`, 'g'), value);
    });

    return content;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Plantillas de Mensajes</h2>
          <p className="text-muted-foreground">
            Crea plantillas reutilizables para notificaciones automáticas
          </p>
        </div>

        <div className="flex gap-2">
          {(!templates || templates.length === 0) && (
            <Button
              variant="outline"
              onClick={() => createDefaultsMutation.mutate()}
              disabled={createDefaultsMutation.isPending}
            >
              {createDefaultsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Crear Plantillas Predeterminadas
                </>
              )}
            </Button>
          )}

          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Plantilla
          </Button>
        </div>
      </div>

      {/* Variables Info */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
        <CardContent className="pt-6">
          <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
            💡 Variables disponibles
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-blue-800 dark:text-blue-200 md:grid-cols-3">
            <div>
              <code className="rounded bg-blue-100 px-2 py-1 dark:bg-blue-900">
                {'{customerName}'}
              </code>
            </div>
            <div>
              <code className="rounded bg-blue-100 px-2 py-1 dark:bg-blue-900">
                {'{orderNumber}'}
              </code>
            </div>
            <div>
              <code className="rounded bg-blue-100 px-2 py-1 dark:bg-blue-900">
                {'{totalAmount}'}
              </code>
            </div>
            <div>
              <code className="rounded bg-blue-100 px-2 py-1 dark:bg-blue-900">
                {'{orderDate}'}
              </code>
            </div>
            <div>
              <code className="rounded bg-blue-100 px-2 py-1 dark:bg-blue-900">
                {'{businessName}'}
              </code>
            </div>
            <div>
              <code className="rounded bg-blue-100 px-2 py-1 dark:bg-blue-900">
                {'{productName}'}
              </code>
            </div>
          </div>
          <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
            Estas variables se reemplazarán automáticamente con los valores reales
          </p>
        </CardContent>
      </Card>

      {/* Templates List */}
      {!templates || templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-semibold">No hay plantillas</h3>
            <p className="mb-4 text-muted-foreground">
              Crea plantillas para enviar mensajes automáticos
            </p>
            <Button onClick={() => createDefaultsMutation.mutate()}>
              <Sparkles className="mr-2 h-4 w-4" />
              Crear Plantillas Predeterminadas
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template: any) => (
            <Card key={template.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>
                      {TEMPLATE_TYPE_LABELS[template.type as WhatsAppTemplateType]}
                    </CardDescription>
                  </div>
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="line-clamp-4 whitespace-pre-wrap text-sm">
                      {template.content}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                      className="flex-1"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Vista Previa
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      disabled={deleteTemplateMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
            </DialogTitle>
            <DialogDescription>
              Crea una plantilla de mensaje personalizada con variables dinámicas
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Plantilla</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Confirmación de pedido"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Plantilla</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as WhatsAppTemplateType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPLATE_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenido del Mensaje</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Escribe tu mensaje aquí... Usa {variables} para datos dinámicos"
                  rows={10}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {formData.content.length} caracteres
                </p>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                <div>
                  <Label htmlFor="isActive" className="font-medium">
                    Plantilla Activa
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Solo las plantillas activas se pueden usar
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createTemplateMutation.isPending || updateTemplateMutation.isPending
                }
              >
                {createTemplateMutation.isPending || updateTemplateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : editingTemplate ? (
                  'Actualizar'
                ) : (
                  'Crear Plantilla'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vista Previa: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Así se verá el mensaje con datos de ejemplo
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
                <div className="rounded-lg bg-white p-3 shadow-sm dark:bg-gray-900">
                  <p className="whitespace-pre-wrap text-sm">
                    {getPreviewContent(previewTemplate)}
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <strong>Tipo:</strong>{' '}
                  {TEMPLATE_TYPE_LABELS[previewTemplate.type as WhatsAppTemplateType]}
                </p>
                <p>
                  <strong>Estado:</strong>{' '}
                  {previewTemplate.isActive ? 'Activa' : 'Inactiva'}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setPreviewTemplate(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
