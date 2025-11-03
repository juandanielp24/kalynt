import { AppError } from '@retail/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, headers, ...fetchOptions } = options;

    // Construir URL con query params
    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      );
      url += `?${searchParams.toString()}`;
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...this.defaultHeaders,
          ...headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          message: response.statusText,
        }));
        throw new AppError(
          error.message || 'Error en la solicitud',
          error.code || 'API_ERROR',
          response.status
        );
      }

      return response.json();
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        'Error de red',
        'NETWORK_ERROR',
        500,
        error
      );
    }
  }

  // Métodos HTTP
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Configurar headers (ej: auth token)
  setAuthToken(token: string) {
    this.defaultHeaders = {
      ...this.defaultHeaders,
      Authorization: `Bearer ${token}`,
    };
  }

  clearAuthToken() {
    const { Authorization, ...rest } = this.defaultHeaders as Record<
      string,
      string
    >;
    this.defaultHeaders = rest;
  }
}

// Instancia singleton
export const apiClient = new ApiClient(API_BASE_URL);
