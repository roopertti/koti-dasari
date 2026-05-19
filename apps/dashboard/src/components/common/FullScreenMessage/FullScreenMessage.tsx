import type { ReactNode } from 'react';
import * as styles from './FullScreenMessage.css.js';

interface FullScreenMessageProps {
  children: ReactNode;
}

export function FullScreenMessage({ children }: FullScreenMessageProps) {
  return <div className={styles.root}>{children}</div>;
}
