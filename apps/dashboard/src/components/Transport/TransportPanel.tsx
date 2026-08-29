import { t } from '@home-dashboard/i18n';
import { useQuery } from '@tanstack/react-query';
import { listAllDepartures } from '../../api/transport.js';
import { FocusablePanel } from '../common/FocusablePanel/FocusablePanel.js';
import { PanelMessage } from '../common/PanelMessage/PanelMessage.js';
import { Stack } from '../common/Stack/Stack.js';
import { DepartureRow } from './DepartureRow/DepartureRow.js';
import { TransportExpanded } from './TransportExpanded/TransportExpanded.js';

const REFRESH_MS = 30_000;
// One fetch feeds both views: the compact panel slices off the head of the list,
// the full-screen view groups all of them by stop.
const LIMIT = 30;
const COMPACT_LIMIT = 10;

export function TransportPanel() {
  const { data, isPending, error } = useQuery({
    queryKey: ['transport', 'departures', { limit: LIMIT }],
    queryFn: ({ signal }) => listAllDepartures({ limit: LIMIT, signal }),
    refetchInterval: REFRESH_MS,
  });

  const hasDepartures = !!data && data.length > 0;

  function renderCompact() {
    if (isPending) {
      return <PanelMessage variant="loading">{t('panel.transport.loading')}</PanelMessage>;
    }

    if (error && !data) {
      return <PanelMessage variant="error">{error.message}</PanelMessage>;
    }

    if (!hasDepartures) {
      return <PanelMessage variant="empty">{t('panel.transport.empty')}</PanelMessage>;
    }

    return (
      <Stack as="ul" gap="tight">
        {data.slice(0, COMPACT_LIMIT).map((departure) => (
          <DepartureRow key={departure.id} departure={departure} />
        ))}
      </Stack>
    );
  }

  return (
    <FocusablePanel
      title={t('panel.transport.title')}
      testId="panel-transport"
      expandable={hasDepartures}
      compact={renderCompact()}
      expanded={hasDepartures ? <TransportExpanded departures={data} /> : null}
    />
  );
}
