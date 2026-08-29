import { t } from '@home-dashboard/i18n';
import { QrCode } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../common/Button/Button.js';
import { useIsAsleep } from '../Sleep/useIsAsleep.js';
import { AdminQRModal } from './AdminQRModal/AdminQRModal.js';
import { adminQrTargets } from './adminQrTargets.js';

const ICON_SIZE = 22;

/**
 * Kiosk header affordance: opens a dialog of QR codes pointing at the admin UI,
 * so a phone can jump straight there instead of typing the LAN address. The
 * origin is read at render time, so the codes track whatever address the kiosk
 * itself is being served from.
 */
export function AdminQRButton() {
  const [open, setOpen] = useState(false);
  const asleep = useIsAsleep();
  const origin = window.location.origin;

  // The dialog lives in the top layer, above the sleep overlay, so it would stay
  // lit all night if the sleep window began while it was open. Adjusting state
  // during render (rather than in an effect) closes it in the same commit.
  if (asleep && open) {
    setOpen(false);
  }

  return (
    <>
      <Button
        variant="subtle"
        onClick={() => setOpen(true)}
        aria-label={t('kiosk.adminQr.open')}
        data-testid="admin-qr-button"
      >
        <QrCode size={ICON_SIZE} aria-hidden />
      </Button>
      <AdminQRModal
        open={open}
        origin={origin}
        targets={adminQrTargets(origin)}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
