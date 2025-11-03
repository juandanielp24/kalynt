'use client';

import { AuthUser, LoginCredentials, RegisterData } from '@retail/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class AuthClient {
  private static instance: AuthClient;

  private constructor() {}

  static getInstance(): AuthClient {
    if (!AuthClient.instance) {
      AuthClient.instance = new AuthClient();
    }
    return AuthClient.instance;
  }

  async login(credentials: LoginCredentials) {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  async register(data: RegisterData) {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  }

  async logout() {
    const response = await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Logout failed');
    }

    return response.json();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      return null;
    }
  }
}

export const authClient = AuthClient.getInstance();
