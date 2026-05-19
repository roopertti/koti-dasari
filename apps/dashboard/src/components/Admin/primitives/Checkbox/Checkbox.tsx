import type { ReactNode } from 'react';
import * as styles from './Checkbox.css.js';

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: ReactNode;
  disabled?: boolean;
}

export function Checkbox({ id, checked, onChange, hint, disabled }: CheckboxProps) {
  return (
    <span className={styles.row}>
      <input
        id={id}
        type="checkbox"
        className={styles.input}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </span>
  );
}
