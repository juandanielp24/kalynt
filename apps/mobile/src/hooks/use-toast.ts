import { useCallback } from 'react';
import { ToastAndroid, Platform, Alert } from 'react-native';

interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: 'short' | 'long';
}

export function useToast() {
  const showToast = useCallback(
    ({ message, type = 'info', duration = 'short' }: ToastOptions) => {
      if (Platform.OS === 'android') {
        const toastDuration =
          duration === 'long' ? ToastAndroid.LONG : ToastAndroid.SHORT;
        ToastAndroid.show(message, toastDuration);
      } else {
        // iOS fallback with Alert
        Alert.alert(
          type === 'error'
            ? 'Error'
            : type === 'success'
            ? 'Éxito'
            : 'Información',
          message
        );
      }
    },
    []
  );

  return { showToast };
}
