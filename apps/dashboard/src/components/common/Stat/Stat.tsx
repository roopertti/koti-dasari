import type { ReactNode } from 'react';
import * as styles from './Stat.css.js';

interface StatListProps {
  children: ReactNode;
}

export function StatList({ children }: StatListProps) {
  return <dl className={styles.list}>{children}</dl>;
}

interface StatProps {
  label: ReactNode;
  value: ReactNode;
}

export function Stat({ label, value }: StatProps) {
  return (
    <div className={styles.item}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{value}</dd>
    </div>
  );
}
