'use client';

import { useEffect, useState } from 'react';
import { authClient } from './client';
import { AuthUser, LoginCredentials, RegisterData } from '@retail/shared';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await authClient.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const result = await authClient.login(credentials);
    setUser(result.user);
    return result;
  };

  const register = async (data: RegisterData) => {
    const result = await authClient.register(data);
    // Auto login after registration
    if (result.success) {
      await login({ email: data.email, password: data.password });
    }
    return result;
  };

  const logout = async () => {
    await authClient.logout();
    setUser(null);
    router.push('/login');
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
}
