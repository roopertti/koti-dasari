import type { ElectricityPrice } from '@home-dashboard/shared';
import { useQuery } from '@tanstack/react-query';
import { getElectricityPrices } from '../../api/electricity.js';
import { t } from '../../i18n/t.js';
import { PanelMessage } from '../common/PanelMessage/PanelMessage.js';
import { PanelShell } from '../common/PanelShell/PanelShell.js';
import { Text } from '../common/Text/Text.js';
import { type ChartEntry, ElectricityChart } from './ElectricityChart/ElectricityChart.js';
import { ElectricityCurrent } from './ElectricityCurrent/ElectricityCurrent.js';
import * as styles from './ElectricityPanel.css.js';
import { classifyPrice, type PriceClass } from './priceClass.js';

const REFRESH_MS = 10 * 60_000;
const CHEAP_THRESHOLD_CENTS = 5;
const EXPENSIVE_THRESHOLD_CENTS = 15;
const THRESHOLDS = { cheap: CHEAP_THRESHOLD_CENTS, expensive: EXPENSIVE_THRESHOLD_CENTS };

const helsinkiDateFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Helsinki',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function topOfHour(date: Date): number {
  return Math.floor(date.getTime() / 3_600_000) * 3_600_000;
}

function helsinkiDate(date: Date): string {
  return helsinkiDateFmt.format(date);
}

interface PriceStats {
  current: number | null;
  currentClass: PriceClass | null;
  average: number | null;
  min: number | null;
  max: number | null;
  entries: ChartEntry[];
  tomorrowPublished: boolean;
}

function buildStats(prices: ElectricityPrice[], now: Date): PriceStats {
  if (prices.length === 0) {
    return {
      current: null,
      currentClass: null,
      average: null,
      min: null,
      max: null,
      entries: [],
      tomorrowPublished: false,
    };
  }

  const nowHourMs = topOfHour(now);
  const todayDate = helsinkiDate(now);
  const tomorrowDate = helsinkiDate(new Date(now.getTime() + 24 * 3_600_000));

  const entries: ChartEntry[] = prices.map((p) => {
    const hourMs = new Date(p.hourStart).getTime();
    const localDate = helsinkiDate(new Date(p.hourStart));
    return {
      hourStart: p.hourStart,
      priceCentsPerKwh: p.priceCentsPerKwh,
      isCurrent: hourMs === nowHourMs,
      isFuture: hourMs >= nowHourMs && localDate === todayDate,
      isTomorrow: localDate === tomorrowDate,
    };
  });

  const current = entries.find((e) => e.isCurrent)?.priceCentsPerKwh ?? null;
  const currentClass = current === null ? null : classifyPrice(current, THRESHOLDS);

  const todayAndForward = entries.filter((e) => new Date(e.hourStart).getTime() >= nowHourMs);
  const visible = todayAndForward.length > 0 ? todayAndForward : entries;
  const visiblePrices = visible.map((e) => e.priceCentsPerKwh);

  const average = visiblePrices.length
    ? visiblePrices.reduce((sum, n) => sum + n, 0) / visiblePrices.length
    : null;
  const min = visiblePrices.length ? Math.min(...visiblePrices) : null;
  const max = visiblePrices.length ? Math.max(...visiblePrices) : null;

  const tomorrowPublished = entries.some((e) => e.isTomorrow);

  return { current, currentClass, average, min, max, entries: visible, tomorrowPublished };
}

export function ElectricityPanel() {
  const prices = useQuery({
    queryKey: ['electricity', 'prices'],
    queryFn: ({ signal }) => getElectricityPrices({ signal }),
    refetchInterval: REFRESH_MS,
  });

  function renderContent() {
    if (prices.isPending) {
      return <PanelMessage variant="loading">{t('panel.electricity.loading')}</PanelMessage>;
    }

    if (prices.error && !prices.data) {
      return <PanelMessage variant="error">{prices.error.message}</PanelMessage>;
    }

    if (!prices.data || prices.data.length === 0) {
      return <PanelMessage variant="empty">{t('panel.electricity.unavailable')}</PanelMessage>;
    }

    const stats = buildStats(prices.data, new Date());

    return (
      <div className={styles.body} data-testid="electricity-content">
        <ElectricityCurrent
          currentPrice={stats.current}
          currentClass={stats.currentClass}
          averagePrice={stats.average}
          minPrice={stats.min}
          maxPrice={stats.max}
        />
        <ElectricityChart
          entries={stats.entries}
          cheapThreshold={CHEAP_THRESHOLD_CENTS}
          expensiveThreshold={EXPENSIVE_THRESHOLD_CENTS}
        />
        {!stats.tomorrowPublished && (
          <Text as="p" tone="muted" size="sm" testId="electricity-tomorrow-pending">
            {t('panel.electricity.tomorrowPending')}
          </Text>
        )}
      </div>
    );
  }

  return (
    <PanelShell title={t('panel.electricity.title')} testId="panel-electricity" grow="auto">
      {renderContent()}
    </PanelShell>
  );
}
