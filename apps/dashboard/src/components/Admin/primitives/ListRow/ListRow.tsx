import type { ReactNode } from 'react';
import * as styles from './ListRow.css.js';

interface ListRowProps {
  title: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}

export function ListRow({ title, meta, actions }: ListRowProps) {
  return (
    <div className={styles.root}>
      <div className={styles.main}>
        <span className={styles.title}>{title}</span>
        {meta ? <span className={styles.meta}>{meta}</span> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
}
