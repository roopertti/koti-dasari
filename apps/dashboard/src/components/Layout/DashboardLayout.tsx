import { type ReactNode, useRef } from 'react';
import { useActivePage } from '../../hooks/useActivePage.js';
import { usePointerSwipe } from '../../hooks/usePointerSwipe.js';
import { Pagination } from '../common/Pagination/Pagination.js';
import * as styles from './DashboardLayout.css.js';

interface DashboardLayoutProps {
  header: ReactNode;
  weather: ReactNode;
  transport: ReactNode;
  calendar: ReactNode;
  todos: ReactNode;
  reminders: ReactNode;
}

interface PageConfig {
  label: string;
  testId: string;
  renderContents: (props: DashboardLayoutProps) => ReactNode;
}

const PAGES: PageConfig[] = [
  {
    label: 'Weather and transport',
    testId: 'page-primary',
    renderContents: ({ weather, transport }) => (
      <>
        {weather}
        {transport}
      </>
    ),
  },
  {
    label: 'Calendar, todos, and reminders',
    testId: 'page-secondary',
    renderContents: ({ calendar, todos, reminders }) => (
      <>
        {calendar}
        {todos}
        {reminders}
      </>
    ),
  },
];

export function DashboardLayout(props: DashboardLayoutProps) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const active = useActivePage(pagesRef);
  usePointerSwipe(pagesRef);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>{props.header}</header>
      <div className={styles.pages} ref={pagesRef}>
        {PAGES.map((page) => (
          <section
            key={page.testId}
            className={styles.page}
            aria-label={page.label}
            data-testid={page.testId}
          >
            {page.renderContents(props)}
          </section>
        ))}
      </div>
      <Pagination count={PAGES.length} active={active} />
    </div>
  );
}
