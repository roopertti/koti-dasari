import { useQuery } from '@tanstack/react-query';
import { listAllDepartures } from '../../api/transport.js';
import { PanelMessage } from '../common/PanelMessage.js';
import { PanelShell } from '../common/PanelShell.js';
import { DepartureRow } from './DepartureRow.js';
import * as styles from './TransportPanel.css.js';

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
      <ul className={styles.list}>
        {data.map((departure) => (
          <DepartureRow key={departure.id} departure={departure} />
        ))}
      </ul>
    );
  }

  return (
    <PanelShell title="Departures" testId="panel-transport">
      {renderContent()}
    </PanelShell>
  );
}
