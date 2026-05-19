import type { FormEvent, ReactNode } from 'react';
import * as styles from './Form.css.js';

interface FormProps {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}

export function Form({ onSubmit, children }: FormProps) {
  return (
    <form className={styles.root} onSubmit={onSubmit}>
      {children}
    </form>
  );
}
