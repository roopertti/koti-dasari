import type { ReactNode } from 'react';
import * as styles from './Field.css.js';

interface FieldProps {
  id: string;
  label: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

export function Field({ id, label, fullWidth, children }: FieldProps) {
  return (
    <div className={styles.root[fullWidth ? 'fullWidth' : 'default']}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );
}
