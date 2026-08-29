import { t } from '@home-dashboard/i18n';
import { Button } from '../../common/Button/Button.js';
import { Heading } from '../../common/Heading/Heading.js';
import { Modal } from '../../common/Modal/Modal.js';
import { QRCode } from '../../common/QRCode/QRCode.js';
import { Text } from '../../common/Text/Text.js';

interface QRModalProps {
  url: string | null;
  title: string | null;
  onClose: () => void;
}

export function QRModal({ url, title, onClose }: QRModalProps) {
  return (
    <Modal open={!!url} onClose={onClose} testId="news-qr-modal">
      {title && <Heading level="dialog">{title}</Heading>}
      {url && <QRCode value={url} alt={t('panel.news.openOnPhone')} testId="news-qr-image" />}
      <Text tone="muted" size="sm" as="p">
        {t('panel.news.qrHint')}
      </Text>
      <Button variant="primary" onClick={onClose} data-testid="news-qr-close">
        {t('panel.news.close')}
      </Button>
    </Modal>
  );
}
