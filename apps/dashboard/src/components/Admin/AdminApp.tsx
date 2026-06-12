import { t } from '@home-dashboard/i18n';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAdminSession } from '../../hooks/useAdminSession.js';
import { ErrorBoundary } from '../common/ErrorBoundary/ErrorBoundary.js';
import { FullScreenMessage } from '../common/FullScreenMessage/FullScreenMessage.js';
import { ToastProvider } from '../common/Toast/ToastProvider.js';
import { AdminLayout } from './AdminLayout.js';
import { EventsPage } from './Events/EventsPage.js';
import { LoginPage } from './Login/LoginPage.js';
import { SettingsPage } from './Settings/SettingsPage.js';
import { TodosPage } from './Todos/TodosPage.js';

export function AdminApp() {
  // A dedicated boundary so an admin-side crash recovers locally instead of
  // bubbling to the root boundary and forcing a full reload.
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AdminRoutes />
      </ToastProvider>
    </ErrorBoundary>
  );
}

function AdminRoutes() {
  const session = useAdminSession();

  if (session.isLoading) {
    return <FullScreenMessage>{t('admin.loading')}</FullScreenMessage>;
  }
  if (session.error) {
    return <FullScreenMessage>{t('admin.unavailable')}</FullScreenMessage>;
  }
  if (!session.data?.authed) {
    return <LoginPage />;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route index element={<Navigate to="/admin/events" replace />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="todos" element={<TodosPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/admin/events" replace />} />
      </Routes>
    </AdminLayout>
  );
}
