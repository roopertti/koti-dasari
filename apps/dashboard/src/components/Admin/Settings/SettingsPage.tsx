import { t } from '@home-dashboard/i18n';
import { useQuery } from '@tanstack/react-query';
import { getAdminSettings } from '../../../api/admin.js';
import { Notice } from '../primitives/Notice/Notice.js';
import { Section } from '../primitives/Section/Section.js';
import { SETTINGS_KEY } from './queries.js';
import { SettingsForm } from './SettingsForm.js';

export function SettingsPage() {
  const settings = useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: ({ signal }) => getAdminSettings(signal),
  });

  if (settings.isLoading) {
    return (
      <Section title={t('admin.settings.title')}>
        <Notice tone="info">{t('admin.loading')}</Notice>
      </Section>
    );
  }

  if (!settings.data) {
    return (
      <Section title={t('admin.settings.title')}>
        <Notice tone="error">{t('admin.unavailable')}</Notice>
      </Section>
    );
  }

  return <SettingsForm initial={settings.data} />;
}
