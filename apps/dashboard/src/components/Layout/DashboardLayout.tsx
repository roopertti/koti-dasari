import type { ReactNode } from 'react';
import * as styles from './DashboardLayout.css.js';

interface DashboardLayoutProps {
  header: ReactNode;
  weather: ReactNode;
  transport: ReactNode;
  calendar: ReactNode;
  todos: ReactNode;
  reminders: ReactNode;
}

export function DashboardLayout(props: DashboardLayoutProps) {
  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>{props.header}</header>
      <section className={styles.hero}>
        <div className={styles.heroItem}>{props.weather}</div>
        <div className={styles.heroItem}>{props.transport}</div>
      </section>
      <section className={styles.secondary}>
        {props.todos}
        {props.reminders}
        {props.calendar}
      </section>
    </div>
  );
}
