import { t } from '@home-dashboard/i18n';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'qrcode';
import { Button } from '../../common/Button/Button.js';
import { Heading } from '../../common/Heading/Heading.js';
import { Modal } from '../../common/Modal/Modal.js';
import { Text } from '../../common/Text/Text.js';
import * as styles from './QRModal.css.js';

interface QRModalProps {
  url: string | null;
  title: string | null;
  onClose: () => void;
}

export function QRModal({ url, title, onClose }: QRModalProps) {
  const qr = useQuery({
    queryKey: ['news-qr', url],
    queryFn: () => QRCode.toDataURL(url ?? '', { margin: 1, width: 320 }),
    enabled: !!url,
    staleTime: Infinity,
  });

  return (
    <Modal open={!!url} onClose={onClose} testId="news-qr-modal">
      {title && <Heading level="dialog">{title}</Heading>}
      {qr.data && (
        <img
          className={styles.qrImage}
          src={qr.data}
          alt={t('panel.news.openOnPhone')}
          data-testid="news-qr-image"
        />
      )}
      <Text tone="muted" size="sm" as="p">
        {t('panel.news.qrHint')}
      </Text>
      <Button variant="primary" onClick={onClose} data-testid="news-qr-close">
        {t('panel.news.close')}
      </Button>
    </Modal>
  );
}
