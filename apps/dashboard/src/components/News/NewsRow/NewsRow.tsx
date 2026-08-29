import { t } from '@home-dashboard/i18n';
import type { NewsItem } from '@home-dashboard/shared';
import { useId } from 'react';
import { VisuallyHidden } from '../../common/VisuallyHidden/VisuallyHidden.js';
import { formatRelativeTime } from '../relativeTime.js';
import * as styles from './NewsRow.css.js';

interface NewsRowProps {
  item: NewsItem;
  onOpen: (item: NewsItem) => void;
  now: Date;
  /** Full-screen view: also show the headline's summary. */
  detailed?: boolean;
}

export function NewsRow({ item, onOpen, now, detailed }: NewsRowProps) {
  const hintId = useId();

  return (
    <li>
      <button
        type="button"
        className={styles.row}
        onClick={() => onOpen(item)}
        aria-describedby={hintId}
      >
        <span className={detailed ? styles.titleFull : styles.title}>{item.title}</span>
        {detailed && item.summary ? <span className={styles.summary}>{item.summary}</span> : null}
        <span className={styles.meta}>{formatRelativeTime(item.publishedAt, now)}</span>
      </button>
      <VisuallyHidden id={hintId}>{t('panel.news.openOnPhone')}</VisuallyHidden>
    </li>
  );
}
