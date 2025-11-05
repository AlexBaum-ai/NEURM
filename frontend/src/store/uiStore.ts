import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

type Theme = 'light' | 'dark' | 'system';
type AuthView = 'login' | 'register';

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  notificationsPanelOpen: boolean;
  authModalOpen: boolean;
  authModalView: AuthView;
}

interface UIActions {
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setNotificationsPanelOpen: (open: boolean) => void;
  toggleNotificationsPanel: () => void;
  openAuthModal: (view: AuthView) => void;
  closeAuthModal: () => void;
}

export type UIStore = UIState & UIActions;

const applyTheme = (theme: Theme) => {
  const root = window.document.documentElement;

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
    root.classList.remove('light', 'dark');
    root.classList.add(systemTheme);
  } else {
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }
};

export const useUIStore = create<UIStore>()(
  persist(
    immer((set) => ({
      // State
      theme: 'system',
      sidebarOpen: true,
      mobileMenuOpen: false,
      notificationsPanelOpen: false,
      authModalOpen: false,
      authModalView: 'login',

      // Actions
      setTheme: (theme) =>
        set((state) => {
          state.theme = theme;
          applyTheme(theme);
        }),

      toggleTheme: () =>
        set((state) => {
          const themes: Theme[] = ['light', 'dark', 'system'];
          const currentIndex = themes.indexOf(state.theme);
          const nextTheme = themes[(currentIndex + 1) % themes.length];
          state.theme = nextTheme;
          applyTheme(nextTheme);
        }),

      setSidebarOpen: (open) =>
        set((state) => {
          state.sidebarOpen = open;
        }),

      toggleSidebar: () =>
        set((state) => {
          state.sidebarOpen = !state.sidebarOpen;
        }),

      setMobileMenuOpen: (open) =>
        set((state) => {
          state.mobileMenuOpen = open;
        }),

      toggleMobileMenu: () =>
        set((state) => {
          state.mobileMenuOpen = !state.mobileMenuOpen;
        }),

      setNotificationsPanelOpen: (open) =>
        set((state) => {
          state.notificationsPanelOpen = open;
        }),

      toggleNotificationsPanel: () =>
        set((state) => {
          state.notificationsPanelOpen = !state.notificationsPanelOpen;
        }),

      openAuthModal: (view) =>
        set((state) => {
          state.authModalOpen = true;
          state.authModalView = view;
        }),

      closeAuthModal: () =>
        set((state) => {
          state.authModalOpen = false;
        }),
    })),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

export default useUIStore;
