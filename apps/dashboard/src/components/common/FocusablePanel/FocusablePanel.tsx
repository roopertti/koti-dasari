import { t } from '@home-dashboard/i18n';
import { type ReactNode, useState } from 'react';
import { ExpandButton } from '../ExpandButton/ExpandButton.js';
import { Modal } from '../Modal/Modal.js';
import { PanelShell } from '../PanelShell/PanelShell.js';

interface FocusablePanelProps {
  title: string;
  testId: string;
  grow?: 'fill' | 'auto';
  /** Hide the expand affordance while the panel has nothing worth expanding. */
  expandable?: boolean;
  compact: ReactNode;
  /** Only mounted while the full-screen view is open. */
  expanded: ReactNode;
}

/**
 * A panel that can be tapped open into a full-screen view showing more detail.
 * Owns only the open/closed state; both views are supplied by the caller.
 */
export function FocusablePanel({
  title,
  testId,
  grow,
  expandable = true,
  compact,
  expanded,
}: FocusablePanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PanelShell
        title={title}
        testId={testId}
        grow={grow}
        action={
          expandable ? (
            <ExpandButton
              onClick={() => setOpen(true)}
              label={t('panel.expandLabel', { title })}
              testId={`${testId}-expand`}
            />
          ) : undefined
        }
      >
        {compact}
      </PanelShell>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        size="full"
        testId={`${testId}-expanded`}
      >
        {expanded}
      </Modal>
    </>
  );
}
