import type { ReactNode } from 'react';
import * as styles from './Text.css.js';

type Tone = 'default' | 'muted';
type Size = 'sm' | 'md';
type As = 'p' | 'span';

interface TextProps {
  tone?: Tone;
  size?: Size;
  as?: As;
  testId?: string;
  children: ReactNode;
}

export function Text({
  tone = 'default',
  size = 'md',
  as: Tag = 'span',
  testId,
  children,
}: TextProps) {
  const className = `${styles.base} ${styles.tone[tone]} ${styles.size[size]}`;
  return (
    <Tag className={className} data-testid={testId}>
      {children}
    </Tag>
  );
}
