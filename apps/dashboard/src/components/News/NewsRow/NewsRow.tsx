import { t } from '@home-dashboard/i18n';
import type { NewsItem } from '@home-dashboard/shared';
import { formatRelativeTime } from '../relativeTime.js';
import * as styles from './NewsRow.css.js';

interface NewsRowProps {
  item: NewsItem;
  onOpen: (item: NewsItem) => void;
  now: Date;
}

export function NewsRow({ item, onOpen, now }: NewsRowProps) {
  return (
    <li>
      <button
        type="button"
        className={styles.row}
        onClick={() => onOpen(item)}
        aria-label={t('panel.news.openOnPhone')}
      >
        <span className={styles.title}>{item.title}</span>
        <span className={styles.meta}>{formatRelativeTime(item.publishedAt, now)}</span>
      </button>
    </li>
  );
}
