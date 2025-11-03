import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  withCredentials: true, // Importante para cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Agregar tenant-id si está disponible
    const tenantId = localStorage.getItem('tenant_id');
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Guardar tenant-id si viene en la respuesta
    const tenantId = response.data?.data?.user?.tenantId;
    if (tenantId) {
      localStorage.setItem('tenant_id', tenantId);
    }

    return response;
  },
  (error) => {
    // Si es 401, redirigir a login
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
