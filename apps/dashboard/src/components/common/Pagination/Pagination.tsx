import { t } from '../../../i18n/t.js';
import * as styles from './Pagination.css.js';

interface PaginationProps {
  count: number;
  active: number;
}

export function Pagination({ count, active }: PaginationProps) {
  return (
    <nav className={styles.pagination} aria-label={t('pagination.label')} data-testid="pagination">
      {Array.from({ length: count }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: pages are a fixed, ordered list
          key={i}
          className={i === active ? styles.dotActive : styles.dot}
          aria-current={i === active ? 'page' : undefined}
        />
      ))}
    </nav>
  );
}
