import { useState, useCallback } from 'react';
import type { ToastProps } from '@/components/common/Toast/Toast';

interface Toast extends ToastProps {
  id: string;
}

let toastId = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<ToastProps, 'onClose'>) => {
    const id = `toast-${++toastId}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (message: string, title?: string) =>
      addToast({ type: 'success', message, title }),
    error: (message: string, title?: string) =>
      addToast({ type: 'error', message, title }),
    info: (message: string, title?: string) =>
      addToast({ type: 'info', message, title }),
    warning: (message: string, title?: string) =>
      addToast({ type: 'warning', message, title }),
  };

  return { toasts, toast, removeToast };
};
