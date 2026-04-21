import type { ReactNode } from 'react';
import * as styles from './Stack.css.js';

type Gap = keyof typeof styles.stack;
type StackElement = 'ul' | 'ol' | 'div' | 'section' | 'nav';

interface StackProps {
  as?: StackElement;
  gap?: Gap;
  children: ReactNode;
}

export function Stack({ as: Component = 'div', gap = 'sm', children }: StackProps) {
  return <Component className={styles.stack[gap]}>{children}</Component>;
}
