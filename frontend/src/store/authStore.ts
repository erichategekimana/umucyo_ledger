import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, RegisterRequest } from '@/types';
import { authService } from '@/api/auth.service';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  loadUserFromStorage: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const response = await authService.login({ username, password });
          const { access, refresh, user } = response;
          set({
            user,
            accessToken: access,
            refreshToken: refresh,
            isAuthenticated: true,
            isLoading: false,
          });
          localStorage.setItem('access_token', access);
          localStorage.setItem('refresh_token', refresh);
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true });
        try {
          await authService.register(data);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      },

      refreshAccessToken: async () => {
        const currentRefresh = get().refreshToken;
        if (!currentRefresh) throw new Error('No refresh token');
        try {
          const { access } = await authService.refresh(currentRefresh);
          set({ accessToken: access });
          localStorage.setItem('access_token', access);
        } catch {
          get().logout();
          throw new Error('Refresh failed');
        }
      },

      loadUserFromStorage: () => {},
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);