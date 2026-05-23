import { t } from '@home-dashboard/i18n';
import type { ReactNode } from 'react';
import { useAdminLogout } from '../../hooks/useAdminSession.js';
import { Button } from '../common/Button/Button.js';
import { Heading } from '../common/Heading/Heading.js';
import * as styles from './AdminLayout.css.js';
import { NavTab } from './primitives/NavTab/NavTab.js';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const logout = useAdminLogout();

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Heading level="page">{t('admin.title')}</Heading>
        <Button variant="subtle" onClick={() => logout.mutate()} disabled={logout.isPending}>
          {t('admin.logout')}
        </Button>
      </header>
      <nav className={styles.nav} aria-label={t('admin.nav.label')}>
        <NavTab to="/admin/events">{t('admin.nav.events')}</NavTab>
        <NavTab to="/admin/todos">{t('admin.nav.todos')}</NavTab>
        <NavTab to="/admin/settings">{t('admin.nav.settings')}</NavTab>
      </nav>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
