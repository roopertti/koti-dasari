import { t } from '@home-dashboard/i18n';
import { type ReactNode, useRef } from 'react';
import { useActivePage } from '../../hooks/useActivePage.js';
import { useAutoRotate } from '../../hooks/useAutoRotate.js';
import { useDisplaySettings } from '../../hooks/useDisplaySettings.js';
import { usePointerSwipe } from '../../hooks/usePointerSwipe.js';
import { Pagination } from '../common/Pagination/Pagination.js';
import * as styles from './DashboardLayout.css.js';

interface DashboardLayoutProps {
  header: ReactNode;
  headerAction: ReactNode;
  weather: ReactNode;
  transport: ReactNode;
  calendar: ReactNode;
  todos: ReactNode;
  electricity: ReactNode;
  news: ReactNode;
}

interface PageConfig {
  labelKey: string;
  testId: string;
  renderContents: (props: DashboardLayoutProps) => ReactNode;
}

// Three panels per page (Phase 18): "right now" glanceable data first, the
// slower-moving planning surface second.
const PAGES: PageConfig[] = [
  {
    labelKey: 'layout.pagePrimary',
    testId: 'page-primary',
    renderContents: ({ weather, transport, electricity }) => (
      <>
        {weather}
        {transport}
        {electricity}
      </>
    ),
  },
  {
    labelKey: 'layout.pageSecondary',
    testId: 'page-secondary',
    renderContents: ({ calendar, todos, news }) => (
      <>
        {calendar}
        {todos}
        {news}
      </>
    ),
  },
];

export function DashboardLayout(props: DashboardLayoutProps) {
  const pagesRef = useRef<HTMLDivElement>(null);
  const active = useActivePage(pagesRef);
  const { data } = useDisplaySettings();
  usePointerSwipe(pagesRef);
  useAutoRotate(pagesRef, data?.rotation);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        {props.header}
        <div className={styles.headerAction}>{props.headerAction}</div>
      </header>
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
