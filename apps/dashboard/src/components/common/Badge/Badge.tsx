import type { ReactNode } from 'react';
import * as styles from './Badge.css.js';

type Variant = 'default' | 'delay' | 'success' | 'danger';

interface BadgeProps {
  variant?: Variant;
  testId?: string;
  children: ReactNode;
}

export function Badge({ variant = 'default', testId, children }: BadgeProps) {
  return (
    <span className={styles.badge[variant]} data-testid={testId}>
      {children}
    </span>
  );
}
