'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rbacApi } from '@/lib/api/rbac';

interface Permission {
  resource: string;
  action: string;
  description?: string;
}

interface PermissionsContextType {
  permissions: Permission[];
  isLoading: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  canCreate: (resource: string) => boolean;
  canRead: (resource: string) => boolean;
  canUpdate: (resource: string) => boolean;
  canDelete: (resource: string) => boolean;
  canManage: (resource: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { data: permissionsData, isLoading } = useQuery({
    queryKey: ['my-permissions'],
    queryFn: rbacApi.getMyPermissions,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  const permissions = permissionsData?.data || [];

  const hasPermission = (resource: string, action: string): boolean => {
    return permissions.some(
      (p: Permission) =>
        (p.resource === resource && p.action === action) ||
        (p.resource === resource && p.action === 'MANAGE') ||
        (p.resource === 'ALL' && p.action === 'MANAGE')
    );
  };

  const canCreate = (resource: string) => hasPermission(resource, 'CREATE');
  const canRead = (resource: string) => hasPermission(resource, 'READ');
  const canUpdate = (resource: string) => hasPermission(resource, 'UPDATE');
  const canDelete = (resource: string) => hasPermission(resource, 'DELETE');
  const canManage = (resource: string) => hasPermission(resource, 'MANAGE');

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        isLoading,
        hasPermission,
        canCreate,
        canRead,
        canUpdate,
        canDelete,
        canManage,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
}
