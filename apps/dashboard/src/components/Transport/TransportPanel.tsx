import { useQuery } from '@tanstack/react-query';
import { listAllDepartures } from '../../api/transport.js';
import { PanelMessage } from '../common/PanelMessage.js';
import { PanelShell } from '../common/PanelShell.js';
import { Stack } from '../common/Stack.js';
import { DepartureRow } from './DepartureRow.js';

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
      return <PanelMessage variant="loading">Loading…</PanelMessage>;
    }

    if (error && !data) {
      return <PanelMessage variant="error">{error.message}</PanelMessage>;
    }

    if (!data || data.length === 0) {
      return <PanelMessage variant="empty">No upcoming departures</PanelMessage>;
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
    <PanelShell title="Departures" testId="panel-transport">
      {renderContent()}
    </PanelShell>
  );
}
