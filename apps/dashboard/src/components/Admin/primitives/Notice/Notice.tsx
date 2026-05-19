import type { ReactNode } from 'react';
import * as styles from './Notice.css.js';

interface NoticeProps {
  tone: 'info' | 'error' | 'empty';
  fullWidth?: boolean;
  children: ReactNode;
}

export function Notice({ tone, fullWidth, children }: NoticeProps) {
  const className = fullWidth ? `${styles.tone[tone]} ${styles.fullWidth}` : styles.tone[tone];
  return <p className={className}>{children}</p>;
}
