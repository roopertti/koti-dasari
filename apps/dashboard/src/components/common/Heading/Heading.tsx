import type { ReactNode } from 'react';
import * as styles from './Heading.css.js';

type Level = 'page' | 'section' | 'panel' | 'dialog';

interface HeadingProps {
  level: Level;
  id?: string;
  children: ReactNode;
}

export function Heading({ level, id, children }: HeadingProps) {
  const className = styles.level[level];
  if (level === 'page') {
    return (
      <h1 className={className} id={id}>
        {children}
      </h1>
    );
  }
  return (
    <h2 className={className} id={id}>
      {children}
    </h2>
  );
}
