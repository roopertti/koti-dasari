import type { ReactNode } from 'react';
import * as styles from './DetailList.css.js';

interface DetailListProps {
  children: ReactNode;
}

/** Label/value metadata table for read-only detail dialogs. */
export function DetailList({ children }: DetailListProps) {
  return <dl className={styles.list}>{children}</dl>;
}

interface DetailRowProps {
  label: ReactNode;
  children: ReactNode;
}

export function DetailRow({ label, children }: DetailRowProps) {
  return (
    <>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{children}</dd>
    </>
  );
}
