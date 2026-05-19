import type { ReactNode } from 'react';
import * as styles from './FormActions.css.js';

interface FormActionsProps {
  children: ReactNode;
}

export function FormActions({ children }: FormActionsProps) {
  return <div className={styles.root}>{children}</div>;
}
