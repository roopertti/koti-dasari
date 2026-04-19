import type { ReactNode } from 'react';
import * as styles from './PanelShell.css.js';

interface PanelShellProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  testId?: string;
}

export function PanelShell({ title, action, children, testId }: PanelShellProps) {
  return (
    <section className={styles.panel} data-testid={testId}>
      <div className={styles.head}>
        <h2 className={styles.title}>{title}</h2>
        {action}
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
}
