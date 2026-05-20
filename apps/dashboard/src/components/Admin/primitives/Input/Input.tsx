import type { InputHTMLAttributes } from 'react';
import * as styles from './Input.css.js';

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'className'>;

export function Input(props: InputProps) {
  return <input {...props} className={styles.root} />;
}
