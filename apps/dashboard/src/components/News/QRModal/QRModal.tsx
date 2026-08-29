import { t } from '@home-dashboard/i18n';
import { Button } from '../../common/Button/Button.js';
import { Modal } from '../../common/Modal/Modal.js';
import { QRCode } from '../../common/QRCode/QRCode.js';
import { Text } from '../../common/Text/Text.js';
import * as styles from './QRModal.css.js';

interface QRModalProps {
  url: string | null;
  title: string | null;
  onClose: () => void;
}

export function QRModal({ url, title, onClose }: QRModalProps) {
  return (
    <Modal open={!!url} onClose={onClose} title={title ?? undefined} testId="news-qr-modal">
      <div className={styles.body}>
        {url && <QRCode value={url} alt={t('panel.news.openOnPhone')} testId="news-qr-image" />}
        <Text tone="muted" size="sm" as="p">
          {t('panel.news.qrHint')}
          </Text>
          <Button variant="primary" onClick={onClose} data-testid="news-qr-close">
            {t('panel.news.close')}
          </Button>
      </div>
    </Modal>
  );
}
