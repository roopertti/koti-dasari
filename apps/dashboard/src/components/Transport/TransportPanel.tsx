import { useQuery } from '@tanstack/react-query';
import { listAllDepartures } from '../../api/transport.js';
import { t } from '../../i18n/t.js';
import { PanelMessage } from '../common/PanelMessage/PanelMessage.js';
import { PanelShell } from '../common/PanelShell/PanelShell.js';
import { Stack } from '../common/Stack/Stack.js';
import { DepartureRow } from './DepartureRow/DepartureRow.js';

const REFRESH_MS = 30_000;
const LIMIT = 10;

export function TransportPanel() {
  const { data, isPending, error } = useQuery({
    queryKey: ['transport', 'departures', { limit: LIMIT }],
    queryFn: ({ signal }) => listAllDepartures({ limit: LIMIT, signal }),
    refetchInterval: REFRESH_MS,
  });

  function renderContent() {
    if (isPending) {
      return <PanelMessage variant="loading">{t('panel.transport.loading')}</PanelMessage>;
    }

    if (error && !data) {
      return <PanelMessage variant="error">{error.message}</PanelMessage>;
    }

    if (!data || data.length === 0) {
      return <PanelMessage variant="empty">{t('panel.transport.empty')}</PanelMessage>;
    }

    return (
      <Stack as="ul" gap="tight">
        {data.map((departure) => (
          <DepartureRow key={departure.id} departure={departure} />
        ))}
      </Stack>
    );
  }

  return (
    <PanelShell title={t('panel.transport.title')} testId="panel-transport">
      {renderContent()}
    </PanelShell>
  );
}
