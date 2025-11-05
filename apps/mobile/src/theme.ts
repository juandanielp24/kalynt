import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#3b82f6', // Blue
    secondary: '#8b5cf6', // Purple
    tertiary: '#06b6d4', // Cyan
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    background: '#ffffff',
    surface: '#f3f4f6',
    surfaceVariant: '#e5e7eb',
    onSurface: '#111827',
    onSurfaceVariant: '#6b7280',
  },
  roundness: 8,
};

export type AppTheme = typeof theme;
