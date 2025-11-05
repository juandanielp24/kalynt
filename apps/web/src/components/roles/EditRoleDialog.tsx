'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacApi } from '@/lib/api/rbac';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@retail/ui';
import { Button } from '@retail/ui';
import { Label } from '@retail/ui';
import { Checkbox } from '@retail/ui';
import { ScrollArea } from '@retail/ui';
import { useToast } from '@retail/ui';

interface EditRoleDialogProps {
  role: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRoleDialog({ role, open, onOpenChange }: EditRoleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: rbacApi.getPermissions,
    enabled: open,
  });

  useEffect(() => {
    if (role) {
      const permissionIds = role.permissions.map((rp: any) => rp.permission.id);
      setSelectedPermissions(permissionIds);
    }
  }, [role]);

  const updateRoleMutation = useMutation({
    mutationFn: (permissionIds: string[]) =>
      rbacApi.updateRolePermissions(role.id, permissionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      toast({
        title: 'Rol actualizado',
        description: 'Los permisos del rol han sido actualizados correctamente',
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'No se pudo actualizar el rol',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateRoleMutation.mutate(selectedPermissions);
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const selectAllInResource = (resourcePerms: any[]) => {
    const resourcePermIds = resourcePerms.map((p) => p.id);
    const allSelected = resourcePermIds.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      // Deselect all
      setSelectedPermissions((prev) =>
        prev.filter((id) => !resourcePermIds.includes(id))
      );
    } else {
      // Select all
      setSelectedPermissions((prev) => [
        ...prev.filter((id) => !resourcePermIds.includes(id)),
        ...resourcePermIds,
      ]);
    }
  };

  const permissions = permissionsData?.data || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Permisos - {role?.name}</DialogTitle>
          <DialogDescription>
            {role?.description || 'Modifica los permisos asignados a este rol'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Permissions */}
          <div className="space-y-2">
            <Label>Permisos</Label>
            <ScrollArea className="h-96 border rounded-md p-4">
              <div className="space-y-4">
                {Object.entries(permissions).map(([resource, perms]: [string, any]) => {
                  const allSelected = perms.every((p: any) =>
                    selectedPermissions.includes(p.id)
                  );

                  return (
                    <div key={resource} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{resource}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => selectAllInResource(perms)}
                        >
                          {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                        </Button>
                      </div>
                      <div className="space-y-1 ml-4">
                        {perms.map((permission: any) => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => togglePermission(permission.id)}
                            />
                            <label
                              htmlFor={permission.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {permission.action} - {permission.description}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <p className="text-sm text-gray-500">
              {selectedPermissions.length} permisos seleccionados
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateRoleMutation.isPending || selectedPermissions.length === 0}
            >
              {updateRoleMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
