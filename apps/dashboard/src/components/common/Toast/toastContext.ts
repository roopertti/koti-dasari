import { createContext } from 'react';

export type ToastTone = 'success' | 'error';

export interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

// Undefined outside a ToastProvider so useToast can throw a clear error.
export const ToastContext = createContext<ToastApi | undefined>(undefined);
