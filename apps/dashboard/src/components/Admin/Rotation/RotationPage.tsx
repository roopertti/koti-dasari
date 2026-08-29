import { t } from '@home-dashboard/i18n';
import { useQuery } from '@tanstack/react-query';
import { getDisplaySettings } from '../../../api/settings.js';
import { DISPLAY_SETTINGS_KEY } from '../../../hooks/useDisplaySettings.js';
import { Notice } from '../primitives/Notice/Notice.js';
import { Section } from '../primitives/Section/Section.js';
import { RotationForm } from './RotationForm.js';

export function RotationPage() {
  const display = useQuery({
    queryKey: DISPLAY_SETTINGS_KEY,
    queryFn: ({ signal }) => getDisplaySettings(signal),
  });

  if (display.isLoading) {
    return (
      <Section title={t('admin.rotation.title')}>
        <Notice tone="info">{t('admin.loading')}</Notice>
      </Section>
    );
  }

  if (!display.data) {
    return (
      <Section title={t('admin.rotation.title')}>
        <Notice tone="error">{t('admin.unavailable')}</Notice>
      </Section>
    );
  }

  return <RotationForm initial={display.data.rotation} />;
}
