import { useContext } from 'react';
import { type ToastApi, ToastContext } from './toastContext.js';

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
