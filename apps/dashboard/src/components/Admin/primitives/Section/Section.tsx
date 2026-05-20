import type { ReactNode } from 'react';
import { Heading } from '../../../common/Heading/Heading.js';
import * as styles from './Section.css.js';

interface SectionProps {
  title: ReactNode;
  children: ReactNode;
}

export function Section({ title, children }: SectionProps) {
  return (
    <section className={styles.root}>
      <Heading level="section">{title}</Heading>
      {children}
    </section>
  );
}
