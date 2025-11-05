import { useEffect, useState, useRef } from 'react';

export function useBarcodeScanner(onScan: (barcode: string) => void, options?: {
  minLength?: number;
  timeout?: number;
}) {
  const [buffer, setBuffer] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const minLength = options?.minLength || 3;
  const timeout = options?.timeout || 100;

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Enter key completes the scan
      if (event.key === 'Enter') {
        if (buffer.length >= minLength) {
          onScan(buffer);
          setBuffer('');
        }
        return;
      }

      // Add character to buffer
      if (event.key.length === 1) {
        const newBuffer = buffer + event.key;
        setBuffer(newBuffer);

        // Auto-clear buffer after timeout
        timeoutRef.current = setTimeout(() => {
          setBuffer('');
        }, timeout);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [buffer, minLength, timeout, onScan]);

  return buffer;
}
