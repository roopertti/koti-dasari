import type { InputHTMLAttributes } from 'react';
import * as styles from './Input.css.js';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={styles.root} />;
}
