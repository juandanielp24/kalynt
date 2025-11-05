import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationsBell } from '../NotificationsBell';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <NotificationsProvider>{children}</NotificationsProvider>
  </QueryClientProvider>
);

describe('NotificationsBell', () => {
  it('should render bell icon', () => {
    render(<NotificationsBell />, { wrapper });
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should show unread count badge', async () => {
    // Mock unread count
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { count: 5 } }),
    } as Response);

    render(<NotificationsBell />, { wrapper });

    // Badge should appear with count
    const badge = await screen.findByText('5');
    expect(badge).toBeInTheDocument();
  });

  it('should open popover on click', () => {
    render(<NotificationsBell />, { wrapper });

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Popover content should be visible
    expect(screen.getByText('Notificaciones')).toBeInTheDocument();
  });
});
