import { type ReactNode, useEffect, useRef } from 'react';
import * as styles from './Modal.css.js';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  testId?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, testId, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog ref={ref} className={styles.dialog} data-testid={testId} onClose={onClose}>
      <div className={styles.body}>{children}</div>
    </dialog>
  );
}
