'use client';

import { usePermissions } from '@/contexts/PermissionsContext';
import { ReactNode } from 'react';

interface PermissionGuardProps {
  resource: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({
  resource,
  action,
  children,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) {
    return null;
  }

  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Convenience components
export function CanCreate({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGuard resource={resource} action="CREATE" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanUpdate({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGuard resource={resource} action="UPDATE" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanDelete({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGuard resource={resource} action="DELETE" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanRead({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGuard resource={resource} action="READ" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

export function CanManage({
  resource,
  children,
  fallback,
}: {
  resource: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <PermissionGuard resource={resource} action="MANAGE" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}
