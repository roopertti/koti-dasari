import { t } from '../../../i18n/t.js';
import { Badge } from '../../common/Badge/Badge.js';
import { Stat, StatList } from '../../common/Stat/Stat.js';
import type { PriceClass } from '../priceClass.js';
import * as styles from './ElectricityCurrent.css.js';

interface ElectricityCurrentProps {
  currentPrice: number | null;
  currentClass: PriceClass | null;
  averagePrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
}

const PILL_VARIANT: Record<PriceClass, 'success' | 'default' | 'danger'> = {
  cheap: 'success',
  normal: 'default',
  expensive: 'danger',
};

const PILL_LABEL_KEY: Record<PriceClass, string> = {
  cheap: 'panel.electricity.status.cheap',
  normal: 'panel.electricity.status.normal',
  expensive: 'panel.electricity.status.expensive',
};

function formatPrice(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return '—';
  }
  return value.toFixed(1);
}

export function ElectricityCurrent({
  currentPrice,
  currentClass,
  averagePrice,
  minPrice,
  maxPrice,
}: ElectricityCurrentProps) {
  return (
    <div className={styles.current}>
      <div className={styles.priceRow}>
        <span className={styles.priceValue}>{formatPrice(currentPrice)}</span>
        <span className={styles.caption}>{t('panel.electricity.unit')}</span>
      </div>
      <div className={styles.labelRow}>
        <span className={styles.caption}>{t('panel.electricity.now')}</span>
        {currentClass && (
          <Badge variant={PILL_VARIANT[currentClass]} testId="electricity-status-pill">
            {t(PILL_LABEL_KEY[currentClass])}
          </Badge>
        )}
      </div>
      <div className={styles.statsRow}>
        <StatList>
          <Stat
            label={t('panel.electricity.stat.average')}
            value={`${formatPrice(averagePrice)} ${t('panel.electricity.unit')}`}
          />
          <Stat
            label={t('panel.electricity.stat.cheapest')}
            value={`${formatPrice(minPrice)} ${t('panel.electricity.unit')}`}
          />
          <Stat
            label={t('panel.electricity.stat.priciest')}
            value={`${formatPrice(maxPrice)} ${t('panel.electricity.unit')}`}
          />
        </StatList>
      </div>
    </div>
  );
}
