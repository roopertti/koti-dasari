import { t } from '@home-dashboard/i18n';
import { X } from 'lucide-react';
import { type MouseEvent, type ReactNode, useEffect, useId, useRef } from 'react';
import { Button } from '../Button/Button.js';
import { Heading } from '../Heading/Heading.js';
import * as styles from './Modal.css.js';

type Size = 'auto' | 'full';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Rendered in the dialog header next to the close button, and referenced by
   * `aria-labelledby`. Required: a titleless dialog has no accessible name and
   * no visible close affordance, so every caller has to name its own dialog.
   */
  title: string;
  size?: Size;
  testId?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, size = 'auto', testId, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

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

  // Every dismissal goes through the element's own close(), so the native
  // `close` event stays the single path to onClose — calling onClose directly
  // here as well would fire it twice for one tap.
  function requestClose() {
    ref.current?.close();
  }

  // Clicks on ::backdrop retarget to the <dialog> element itself; the dialog has
  // no padding, so anything inside the modal hits `surface` instead.
  function handleClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === ref.current) {
      requestClose();
    }
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: backdrop tap-to-dismiss is pointer-only by nature; <dialog> already closes on Escape for keyboard users.
    <dialog
      ref={ref}
      className={styles.dialog[size]}
      data-testid={testId}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={handleClick}
    >
      {open && (
        <div className={styles.surface}>
          <div className={styles.head}>
            <Heading level="dialog" id={titleId}>
              {title}
            </Heading>
            <Button
              variant="subtle"
              onClick={requestClose}
              aria-label={t('dialog.close')}
              data-testid={testId ? `${testId}-close` : undefined}
            >
              <X size="1.2em" aria-hidden="true" />
            </Button>
          </div>
          <div className={styles.body}>{children}</div>
        </div>
      )}
    </dialog>
  );
}
