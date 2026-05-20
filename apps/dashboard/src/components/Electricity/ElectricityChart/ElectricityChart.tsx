import { LOCALE, t } from '../../../i18n/t.js';
import { classifyPrice, type PriceClass } from '../priceClass.js';
import * as styles from './ElectricityChart.css.js';

const hourFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  hour12: false,
});

const VIEWBOX_WIDTH = 600;
const VIEWBOX_HEIGHT = 180;
const PADDING_TOP = 18;
const PADDING_BOTTOM = 28;

export interface ChartEntry {
  hourStart: string;
  priceCentsPerKwh: number;
  isCurrent: boolean;
  isFuture: boolean;
  isTomorrow: boolean;
}

interface ElectricityChartProps {
  entries: ChartEntry[];
  cheapThreshold: number;
  expensiveThreshold: number;
}

const BAR_CLASSES: Record<PriceClass, string> = {
  cheap: styles.barCheap,
  normal: styles.barNeutral,
  expensive: styles.barExpensive,
};

const LABEL_CLASSES: Record<PriceClass, string> = {
  cheap: styles.priceLabelCheap,
  normal: styles.priceLabelNeutral,
  expensive: styles.priceLabelExpensive,
};

interface PriceLabel {
  key: string;
  x: number;
  y: number;
  text: string;
  className: string;
  testId?: string;
}

interface BarShape {
  key: string;
  x: number;
  y: number;
  width: number;
  height: number;
  className: string;
}

interface HourLabel {
  key: string;
  x: number;
  y: number;
  text: string;
}

function getVariantClass(entry: ChartEntry): string {
  if (entry.isCurrent) {
    return styles.barCurrent;
  }
  if (entry.isTomorrow) {
    return styles.barTomorrow;
  }
  if (entry.isFuture) {
    return styles.barFuture;
  }
  return styles.barPast;
}

export function ElectricityChart({
  entries,
  cheapThreshold,
  expensiveThreshold,
}: ElectricityChartProps) {
  if (entries.length === 0) {
    return null;
  }

  const thresholds = { cheap: cheapThreshold, expensive: expensiveThreshold };
  const prices = entries.map((e) => e.priceCentsPerKwh);
  const minPrice = Math.min(0, ...prices);
  const maxPrice = Math.max(...prices, expensiveThreshold);
  const range = maxPrice - minPrice || 1;

  const chartHeight = VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const barGap = 2;
  const barWidth = (VIEWBOX_WIDTH - barGap * (entries.length - 1)) / entries.length;
  const zeroY = PADDING_TOP + (maxPrice / range) * chartHeight;

  function barCenterX(index: number): number {
    return index * (barWidth + barGap) + barWidth / 2;
  }

  function barTopY(price: number): number {
    const ratio = (price - minPrice) / range;
    return PADDING_TOP + chartHeight - Math.max(2, ratio * chartHeight);
  }

  function buildBar(entry: ChartEntry, index: number): BarShape {
    const x = index * (barWidth + barGap);
    const topY = barTopY(entry.priceCentsPerKwh);
    const isNegative = entry.priceCentsPerKwh < 0;
    const barHeight = PADDING_TOP + chartHeight - topY;
    const baseY = isNegative ? zeroY : topY;
    const drawHeight = isNegative
      ? PADDING_TOP + chartHeight - zeroY - barHeight
      : Math.max(2, zeroY - baseY);

    const colorClass = BAR_CLASSES[classifyPrice(entry.priceCentsPerKwh, thresholds)];
    const variantClass = getVariantClass(entry);

    return {
      key: entry.hourStart,
      x,
      y: Math.min(baseY, baseY + drawHeight),
      width: barWidth,
      height: Math.abs(drawHeight),
      className: `${styles.bar} ${colorClass} ${variantClass}`,
    };
  }

  function buildHourLabel(entry: ChartEntry, index: number): HourLabel | null {
    const showLabel = index === 0 || index === entries.length - 1 || index % 6 === 0;
    if (!showLabel) {
      return null;
    }
    return {
      key: `label-${entry.hourStart}`,
      x: barCenterX(index),
      y: VIEWBOX_HEIGHT - 8,
      text: hourFormatter.format(new Date(entry.hourStart)),
    };
  }

  function buildPriceLabel(index: number, testId: string): PriceLabel {
    const entry = entries[index];
    const rawX = barCenterX(index);
    return {
      key: `label-price-${entry.hourStart}`,
      x: Math.min(Math.max(rawX, 18), VIEWBOX_WIDTH - 18),
      y: Math.max(12, barTopY(entry.priceCentsPerKwh) - 4),
      text: entry.priceCentsPerKwh.toFixed(1),
      className: LABEL_CLASSES[classifyPrice(entry.priceCentsPerKwh, thresholds)],
      testId,
    };
  }

  function buildPriceLabels(): PriceLabel[] {
    const peakIndex = entries.reduce(
      (best, entry, i) => (entry.priceCentsPerKwh > entries[best].priceCentsPerKwh ? i : best),
      0,
    );
    const currentIndex = entries.findIndex((e) => e.isCurrent);
    const labels = [buildPriceLabel(peakIndex, 'electricity-peak-label')];
    if (currentIndex >= 0 && currentIndex !== peakIndex) {
      labels.push(buildPriceLabel(currentIndex, 'electricity-now-label'));
    }
    return labels;
  }

  const bars = entries.map(buildBar);
  const hourLabels = entries
    .map(buildHourLabel)
    .filter((label): label is HourLabel => label !== null);
  const priceLabels = buildPriceLabels();

  return (
    <svg
      className={styles.chart}
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={t('panel.electricity.chartAriaLabel')}
    >
      <line
        className={styles.axis}
        x1={0}
        x2={VIEWBOX_WIDTH}
        y1={zeroY}
        y2={zeroY}
        strokeDasharray="2 4"
      />
      {bars.map((bar) => (
        <rect
          key={bar.key}
          x={bar.x}
          y={bar.y}
          width={bar.width}
          height={bar.height}
          className={bar.className}
        />
      ))}
      {hourLabels.map((label) => (
        <text
          key={label.key}
          className={styles.hourLabel}
          x={label.x}
          y={label.y}
          textAnchor="middle"
        >
          {label.text}
        </text>
      ))}
      {priceLabels.map((label) => (
        <text
          key={label.key}
          className={label.className}
          x={label.x}
          y={label.y}
          textAnchor="middle"
          data-testid={label.testId}
        >
          {label.text}
        </text>
      ))}
    </svg>
  );
}
