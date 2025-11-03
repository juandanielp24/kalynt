'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  tenantName: string;
  tenantSlug?: string;
  country?: string;
  cuit?: string;
  fiscalCondition?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Cargar sesión al montar
  useEffect(() => {
    loadSession();
  }, []);

  const loadSession = async () => {
    try {
      const response = await apiClient.get('/auth/session');

      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (error) {
      // No hay sesión activa
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        setUser(response.data.data.user);
        router.push('/dashboard');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.post('/auth/register', data);

      if (response.data.success) {
        // Redirigir a página de verificación de email
        router.push('/verify-email?email=' + encodeURIComponent(data.email));
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
      setUser(null);
      router.push('/login');
    } catch (error) {
      // Limpiar sesión local incluso si falla la llamada
      setUser(null);
      router.push('/login');
    }
  };

  const refreshSession = async () => {
    await loadSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
