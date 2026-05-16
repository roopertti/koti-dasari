import { type ReactNode, useRef } from 'react';
import { useActivePage } from '../../hooks/useActivePage.js';
import { usePointerSwipe } from '../../hooks/usePointerSwipe.js';
import { t } from '../../i18n/t.js';
import { Pagination } from '../common/Pagination/Pagination.js';
import * as styles from './DashboardLayout.css.js';

interface DashboardLayoutProps {
  header: ReactNode;
  weather: ReactNode;
  transport: ReactNode;
  calendar: ReactNode;
  todos: ReactNode;
}

interface PageConfig {
  labelKey: string;
  testId: string;
  renderContents: (props: DashboardLayoutProps) => ReactNode;
}

const PAGES: PageConfig[] = [
  {
    labelKey: 'layout.pagePrimary',
    testId: 'page-primary',
    renderContents: ({ weather, transport }) => (
      <>
        {weather}
        {transport}
      </>
    ),
  },
  {
    labelKey: 'layout.pageSecondary',
    testId: 'page-secondary',
    renderContents: ({ calendar, todos }) => (
      <>
        {calendar}
        {todos}
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
            aria-label={t(page.labelKey)}
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
