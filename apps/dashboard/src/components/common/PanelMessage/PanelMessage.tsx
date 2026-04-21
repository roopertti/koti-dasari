import type { ReactNode } from 'react';
import * as styles from './PanelMessage.css.js';

type Variant = 'empty' | 'loading' | 'error';

interface PanelMessageProps {
  variant: Variant;
  children: ReactNode;
}

export function PanelMessage({ variant, children }: PanelMessageProps) {
  return <div className={styles.message[variant]}>{children}</div>;
}
