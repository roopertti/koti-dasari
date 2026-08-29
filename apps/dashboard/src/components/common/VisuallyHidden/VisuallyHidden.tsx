import type { ReactNode } from 'react';
import * as styles from './VisuallyHidden.css.js';

interface VisuallyHiddenProps {
  /** Referenced by an `aria-describedby` / `aria-labelledby` on a sibling. */
  id?: string;
  children: ReactNode;
}

/**
 * Text for assistive tech only. Used to describe what a row tap does without
 * overriding the row's visible content as its accessible name.
 */
export function VisuallyHidden({ id, children }: VisuallyHiddenProps) {
  return (
    <span id={id} className={styles.root}>
      {children}
    </span>
  );
}
