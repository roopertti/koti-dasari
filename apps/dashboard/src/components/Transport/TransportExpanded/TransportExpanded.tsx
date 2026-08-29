import { t } from '@home-dashboard/i18n';
import type { TransportDeparture, TransportStop } from '@home-dashboard/shared';
import { useQuery } from '@tanstack/react-query';
import { listStops } from '../../../api/transport.js';
import { Heading } from '../../common/Heading/Heading.js';
import { Stack } from '../../common/Stack/Stack.js';
import { DepartureRow } from '../DepartureRow/DepartureRow.js';
import * as styles from './TransportExpanded.css.js';

const STOPS_STALE_MS = 10 * 60_000;

interface TransportExpandedProps {
  departures: TransportDeparture[];
}

/** Departures grouped by stop, in the order each stop's first departure leaves. */
function groupByStop(departures: TransportDeparture[]): Map<string, TransportDeparture[]> {
  const groups = new Map<string, TransportDeparture[]>();

  for (const departure of departures) {
    const list = groups.get(departure.stopId);

    if (list) {
      list.push(departure);
    } else {
      groups.set(departure.stopId, [departure]);
    }
  }

  return groups;
}

function stopMeta(stop: TransportStop | undefined): string | null {
  if (!stop) {
    return null;
  }
  const parts = [
    stop.code,
    stop.platform ? t('panel.transport.platform', { platform: stop.platform }) : null,
    stop.distanceM === null ? null : t('panel.transport.distance', { meters: stop.distanceM }),
  ].filter((part): part is string => !!part);

  return parts.length > 0 ? parts.join(' · ') : null;
}

export function TransportExpanded({ departures }: TransportExpandedProps) {
  // Stop names are not carried on a departure; they change rarely, so this is
  // cached well past the modal's lifetime.
  const stops = useQuery({
    queryKey: ['transport', 'stops'],
    queryFn: ({ signal }) => listStops({ signal }),
    staleTime: STOPS_STALE_MS,
  });

  const byId = new Map((stops.data ?? []).map((stop) => [stop.id, stop]));

  return (
    <ul className={styles.groups} data-testid="transport-stop-groups">
      {Array.from(groupByStop(departures).entries()).map(([stopId, stopDepartures]) => {
        const stop = byId.get(stopId);
        const meta = stopMeta(stop);
        return (
          <li key={stopId}>
            <div className={styles.stopHead}>
              <Heading level="section">{stop?.name ?? t('panel.transport.stopUnknown')}</Heading>
              {meta && <span className={styles.stopMeta}>{meta}</span>}
            </div>
            <Stack as="ul" gap="tight">
              {stopDepartures.map((departure) => (
                <DepartureRow key={departure.id} departure={departure} />
              ))}
            </Stack>
          </li>
        );
      })}
    </ul>
  );
}
