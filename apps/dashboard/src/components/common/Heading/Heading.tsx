import type { ReactNode } from 'react';
import * as styles from './Heading.css.js';

type Level = 'page' | 'section' | 'panel' | 'dialog';

interface HeadingProps {
  level: Level;
  children: ReactNode;
}

export function Heading({ level, children }: HeadingProps) {
  const className = styles.level[level];
  if (level === 'page') {
    return <h1 className={className}>{children}</h1>;
  }
  return <h2 className={className}>{children}</h2>;
}
