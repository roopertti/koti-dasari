import type { TextareaHTMLAttributes } from 'react';
import * as styles from './Textarea.css.js';

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>;

export function Textarea(props: TextareaProps) {
  return <textarea {...props} className={styles.root} />;
}
