import { t } from '@home-dashboard/i18n';
import { Modal } from '../../common/Modal/Modal.js';
import { QRCode } from '../../common/QRCode/QRCode.js';
import { Text } from '../../common/Text/Text.js';
import type { AdminQrTarget } from '../adminQrTargets.js';
import * as styles from './AdminQRModal.css.js';

interface AdminQRModalProps {
  open: boolean;
  origin: string;
  targets: AdminQrTarget[];
  onClose: () => void;
}

export function AdminQRModal({ open, origin, targets, onClose }: AdminQRModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={t('kiosk.adminQr.title')} testId="admin-qr-modal">
      <div className={styles.body}>
        <ul className={styles.list} data-testid="admin-qr-list">
          {targets.map((target) => (
            <li key={target.key} className={styles.item}>
              <QRCode
                value={target.url}
                alt={t('kiosk.adminQr.codeAlt', { target: t(target.labelKey) })}
                size="sm"
                testId={`admin-qr-code-${target.key}`}
              />
              <Text size="sm">{t(target.labelKey)}</Text>
            </li>
          ))}
        </ul>
        <Text tone="muted" size="sm" as="p">
          {t('kiosk.adminQr.hint', { origin })}
        </Text>
      </div>
    </Modal>
  );
}
