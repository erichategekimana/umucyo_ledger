import { useAuthStore } from '@/store/authStore';
import { useMemo } from 'react';

export const useAuth = () => {
  const { user, isAuthenticated, login, logout, refreshAccessToken, isLoading } = useAuthStore();

  return useMemo(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      refreshAccessToken,
      role: user?.role || null,
    }),
    [user, isAuthenticated, isLoading, login, logout, refreshAccessToken]
  );
};