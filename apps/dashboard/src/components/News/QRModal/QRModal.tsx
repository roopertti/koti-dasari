import { t } from '@home-dashboard/i18n';
import type { NewsItem } from '@home-dashboard/shared';
import { Modal } from '../../common/Modal/Modal.js';
import { QRCode } from '../../common/QRCode/QRCode.js';
import { Text } from '../../common/Text/Text.js';
import * as styles from './QRModal.css.js';

interface QRModalProps {
  /** The headline being shared, or null when nothing is selected. */
  item: NewsItem | null;
  onClose: () => void;
}

export function QRModal({ item, onClose }: QRModalProps) {
  // Taking the whole item rather than a url/title pair keeps the dialog's title
  // non-nullable: there is no "open but unnamed" state to fall back from.
  if (!item) {
    return null;
  }

  return (
    <Modal open onClose={onClose} title={item.title} testId="news-qr-modal">
      <div className={styles.body}>
        <QRCode value={item.link} alt={t('panel.news.openOnPhone')} testId="news-qr-image" />
        <Text tone="muted" size="sm" as="p">
          {t('panel.news.qrHint')}
        </Text>
      </div>
    </Modal>
  );
}
