import type { ReactNode } from 'react';
import * as styles from './Badge.css.js';

type Variant = 'default' | 'delay';

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return <span className={styles.badge[variant]}>{children}</span>;
}
