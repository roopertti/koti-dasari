import { t } from '@home-dashboard/i18n';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as styles from './Toast.css.js';
import { type ToastApi, ToastContext, type ToastTone } from './toastContext.js';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

// Errors linger longer than successes since the operator may need to read them.
const DURATION_MS: Record<ToastTone, number> = {
  success: 4000,
  error: 6000,
};

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (tone: ToastTone, message: string) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, tone, message }]);
      timers.current.set(
        id,
        window.setTimeout(() => dismiss(id), DURATION_MS[tone]),
      );
    },
    [dismiss],
  );

  // Clear any pending auto-dismiss timers if the provider unmounts.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending.values()) {
        window.clearTimeout(timer);
      }
      pending.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('error', message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className={styles.viewport} aria-live="polite" data-testid="toast-viewport">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={styles.toast[toast.tone]}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            data-testid="toast"
            data-tone={toast.tone}
          >
            <p className={styles.message}>{toast.message}</p>
            <button
              type="button"
              className={styles.dismiss}
              onClick={() => dismiss(toast.id)}
              aria-label={t('admin.toast.dismiss')}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
