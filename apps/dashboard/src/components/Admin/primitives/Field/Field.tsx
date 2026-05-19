import type { ReactNode } from 'react';
import * as styles from './Field.css.js';

interface FieldProps {
  id: string;
  label: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Field({ id, label, fullWidth, children }: FieldProps) {
  const rootClass = fullWidth ? `${styles.root} ${styles.fullWidth}` : styles.root;
  return (
    <div className={rootClass}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}
