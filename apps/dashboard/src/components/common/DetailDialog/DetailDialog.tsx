import { t } from '@home-dashboard/i18n';
import type { ReactNode } from 'react';
import { DetailList } from '../DetailList/DetailList.js';
import { Modal } from '../Modal/Modal.js';
import * as styles from './DetailDialog.css.js';

interface DetailDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  testId: string;
  /** `DetailRow` children describing the item's metadata. */
  details: ReactNode;
  description: string | null;
}

/**
 * Read-only kiosk dialog: a metadata table plus the item's full description.
 * The kiosk never edits — the admin UI remains the only editor.
 */
export function DetailDialog({
  open,
  title,
  onClose,
  testId,
  details,
  description,
}: DetailDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} testId={testId}>
      <div className={styles.content}>
        <DetailList>{details}</DetailList>
        {description ? (
          <p className={styles.description} data-testid={`${testId}-description`}>
            {description}
          </p>
        ) : (
          <p className={styles.empty}>{t('dialog.noDescription')}</p>
        )}
      </div>
    </Modal>
  );
}
