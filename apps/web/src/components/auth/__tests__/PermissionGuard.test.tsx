import { render, screen } from '@testing-library/react';
import { PermissionGuard, CanCreate, CanUpdate, CanDelete, CanRead } from '../PermissionGuard';
import { PermissionsProvider } from '@/contexts/PermissionsContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const mockPermissions = [
  { resource: 'PRODUCTS', action: 'READ', description: 'Read products' },
  { resource: 'PRODUCTS', action: 'CREATE', description: 'Create products' },
  { resource: 'SALES', action: 'MANAGE', description: 'Manage sales' },
];

// Mock usePermissions hook
jest.mock('@/contexts/PermissionsContext', () => ({
  ...jest.requireActual('@/contexts/PermissionsContext'),
  usePermissions: () => ({
    permissions: mockPermissions,
    isLoading: false,
    hasPermission: (resource: string, action: string) => {
      return mockPermissions.some(
        (p) =>
          (p.resource === resource && p.action === action) ||
          (p.resource === resource && p.action === 'MANAGE') ||
          (p.resource === 'ALL' && p.action === 'MANAGE')
      );
    },
    canCreate: (resource: string) => mockPermissions.some(p =>
      (p.resource === resource && p.action === 'CREATE') ||
      (p.resource === resource && p.action === 'MANAGE')
    ),
    canRead: (resource: string) => mockPermissions.some(p =>
      (p.resource === resource && p.action === 'READ') ||
      (p.resource === resource && p.action === 'MANAGE')
    ),
    canUpdate: (resource: string) => mockPermissions.some(p =>
      (p.resource === resource && p.action === 'UPDATE') ||
      (p.resource === resource && p.action === 'MANAGE')
    ),
    canDelete: (resource: string) => mockPermissions.some(p =>
      (p.resource === resource && p.action === 'DELETE') ||
      (p.resource === resource && p.action === 'MANAGE')
    ),
    canManage: (resource: string) => mockPermissions.some(p =>
      (p.resource === resource && p.action === 'MANAGE')
    ),
  }),
  PermissionsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <PermissionsProvider>{children}</PermissionsProvider>
  </QueryClientProvider>
);

describe('PermissionGuard', () => {
  it('should render children when user has permission', () => {
    render(
      <PermissionGuard resource="PRODUCTS" action="READ">
        <div>Protected Content</div>
      </PermissionGuard>,
      { wrapper }
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should not render children when user lacks permission', () => {
    render(
      <PermissionGuard resource="PRODUCTS" action="DELETE">
        <div>Protected Content</div>
      </PermissionGuard>,
      { wrapper }
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should render fallback when user lacks permission', () => {
    render(
      <PermissionGuard
        resource="PRODUCTS"
        action="DELETE"
        fallback={<div>No Permission</div>}
      >
        <div>Protected Content</div>
      </PermissionGuard>,
      { wrapper }
    );

    expect(screen.getByText('No Permission')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should respect MANAGE permission hierarchy', () => {
    render(
      <PermissionGuard resource="SALES" action="CREATE">
        <div>Protected Content</div>
      </PermissionGuard>,
      { wrapper }
    );

    // User has SALES:MANAGE which grants all actions
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});

describe('CanCreate', () => {
  it('should render children when user can create', () => {
    render(
      <CanCreate resource="PRODUCTS">
        <button>Create Product</button>
      </CanCreate>,
      { wrapper }
    );

    expect(screen.getByText('Create Product')).toBeInTheDocument();
  });

  it('should not render children when user cannot create', () => {
    render(
      <CanCreate resource="CUSTOMERS">
        <button>Create Customer</button>
      </CanCreate>,
      { wrapper }
    );

    expect(screen.queryByText('Create Customer')).not.toBeInTheDocument();
  });
});

describe('CanUpdate', () => {
  it('should render children when user can update via MANAGE', () => {
    render(
      <CanUpdate resource="SALES">
        <button>Update Sale</button>
      </CanUpdate>,
      { wrapper }
    );

    expect(screen.getByText('Update Sale')).toBeInTheDocument();
  });

  it('should not render children when user cannot update', () => {
    render(
      <CanUpdate resource="PRODUCTS">
        <button>Update Product</button>
      </CanUpdate>,
      { wrapper }
    );

    expect(screen.queryByText('Update Product')).not.toBeInTheDocument();
  });
});

describe('CanDelete', () => {
  it('should render children when user can delete via MANAGE', () => {
    render(
      <CanDelete resource="SALES">
        <button>Delete Sale</button>
      </CanDelete>,
      { wrapper }
    );

    expect(screen.getByText('Delete Sale')).toBeInTheDocument();
  });

  it('should not render children when user cannot delete', () => {
    render(
      <CanDelete resource="PRODUCTS">
        <button>Delete Product</button>
      </CanDelete>,
      { wrapper }
    );

    expect(screen.queryByText('Delete Product')).not.toBeInTheDocument();
  });
});

describe('CanRead', () => {
  it('should render children when user can read', () => {
    render(
      <CanRead resource="PRODUCTS">
        <div>Product Details</div>
      </CanRead>,
      { wrapper }
    );

    expect(screen.getByText('Product Details')).toBeInTheDocument();
  });

  it('should not render children when user cannot read', () => {
    render(
      <CanRead resource="INVOICES">
        <div>Invoice Details</div>
      </CanRead>,
      { wrapper }
    );

    expect(screen.queryByText('Invoice Details')).not.toBeInTheDocument();
  });
});
