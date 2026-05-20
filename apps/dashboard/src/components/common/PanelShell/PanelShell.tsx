import type { ReactNode } from 'react';
import { Heading } from '../Heading/Heading.js';
import * as styles from './PanelShell.css.js';

type Grow = 'fill' | 'auto';

interface PanelShellProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  testId?: string;
  grow?: Grow;
}

export function PanelShell({ title, action, children, testId, grow = 'fill' }: PanelShellProps) {
  return (
    <section className={styles.panel[grow]} data-testid={testId}>
      <div className={styles.head}>
        <Heading level="panel">{title}</Heading>
        {action}
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
