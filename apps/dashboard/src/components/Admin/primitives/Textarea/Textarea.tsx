import type { TextareaHTMLAttributes } from 'react';
import * as styles from './Textarea.css.js';

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={styles.root} />;
}
