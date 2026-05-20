import type { TransportDeparture } from '@home-dashboard/shared';
import { departureToDate } from '@home-dashboard/shared';
import { Bus, Ship, TrainFront, TramFront } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import { LOCALE, t } from '../../../i18n/t.js';
import { Badge } from '../../common/Badge/Badge.js';
import { MetroMark } from '../../common/MetroMark/MetroMark.js';
import * as styles from './DepartureRow.css.js';

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { size?: string | number }>;

const VEHICLE_ICONS: Record<TransportDeparture['vehicleType'], IconComponent> = {
  BUS: Bus,
  TRAM: TramFront,
  METRO: MetroMark,
  TRAIN: TrainFront,
  FERRY: Ship,
};

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function formatMinutesAway(departure: TransportDeparture): {
  label: string;
  soon: boolean;
} {
  const scheduled = departure.realtimeDeparture ?? departure.scheduledDeparture;
  const when = departureToDate(departure.serviceDay, scheduled);
  const diffMs = when.getTime() - Date.now();
  const minutes = Math.round(diffMs / 60_000);

  if (minutes <= 0) {
    return { label: t('panel.transport.now'), soon: true };
  }

  if (minutes < 60) {
    return { label: t('panel.transport.minAway', { minutes }), soon: minutes <= 3 };
  }

  return { label: timeFormatter.format(when), soon: false };
}

interface DepartureRowProps {
  departure: TransportDeparture;
}

export function DepartureRow({ departure }: DepartureRowProps) {
  const { label, soon } = formatMinutesAway(departure);
  const state = soon ? 'soon' : 'default';
  const hasDelay = departure.isRealtime && Math.abs(departure.departureDelay) >= 60;
  const Icon = VEHICLE_ICONS[departure.vehicleType];

  return (
    <li className={styles.row[state]}>
      <span className={styles.vehicle} role="img" aria-label={departure.vehicleType}>
        <Icon size="1em" />
      </span>
      <span className={styles.route}>{departure.routeShortName}</span>
      <span className={styles.headsign}>{departure.headsign}</span>
      <span className={styles.time[state]}>
        {departure.isRealtime && (
          <span className={styles.liveDot} role="img" aria-label={t('panel.transport.liveLabel')} />
        )}
        {label}
        {hasDelay && (
          <Badge variant="delay">
            {departure.departureDelay > 0 ? '+' : ''}
            {Math.round(departure.departureDelay / 60)}
          </Badge>
        )}
      </span>
    </li>
  );
}
