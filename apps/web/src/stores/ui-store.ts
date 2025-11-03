import { create } from 'zustand';

interface UIStore {
  // Sidebar
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Modals
  activeModal: string | null;
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // Toast notifications (complementario a sonner)
  toastQueue: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>;
  addToast: (
    message: string,
    type: 'success' | 'error' | 'info'
  ) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Sidebar
  isSidebarCollapsed: false,
  toggleSidebar: () =>
    set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  // Modals
  activeModal: null,
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),

  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Toasts
  toastQueue: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toastQueue: [...state.toastQueue, { id, message, type }],
    }));

    // Auto-remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        toastQueue: state.toastQueue.filter((toast) => toast.id !== id),
      }));
    }, 5000);
  },
  removeToast: (id) =>
    set((state) => ({
      toastQueue: state.toastQueue.filter((toast) => toast.id !== id),
    })),
}));
