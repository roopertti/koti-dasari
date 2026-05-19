import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { type AdminSettings, updateAdminSettings } from '../../../api/admin.js';
import { t } from '../../../i18n/t.js';
import { Button } from '../primitives/Button/Button.js';
import { Field } from '../primitives/Field/Field.js';
import { Form } from '../primitives/Form/Form.js';
import { FormActions } from '../primitives/FormActions/FormActions.js';
import { Notice } from '../primitives/Notice/Notice.js';
import { Input } from '../primitives/Input/Input.js';
import { Section } from '../primitives/Section/Section.js';
import { SETTINGS_KEY } from './queries.js';

interface FormState {
  homeLatitude: string;
  homeLongitude: string;
  transportRadius: string;
  transportIntervalMs: string;
  weatherIntervalMs: string;
}

const PLACEHOLDERS: FormState = {
  homeLatitude: '60.1699',
  homeLongitude: '24.9384',
  transportRadius: '500',
  transportIntervalMs: '300000',
  weatherIntervalMs: '1800000',
};

function fromSettings(s: AdminSettings): FormState {
  return {
    homeLatitude: s.homeLatitude !== undefined ? String(s.homeLatitude) : '',
    homeLongitude: s.homeLongitude !== undefined ? String(s.homeLongitude) : '',
    transportRadius: s.transportRadius !== undefined ? String(s.transportRadius) : '',
    transportIntervalMs: s.transportIntervalMs !== undefined ? String(s.transportIntervalMs) : '',
    weatherIntervalMs: s.weatherIntervalMs !== undefined ? String(s.weatherIntervalMs) : '',
  };
}

function toPatch(form: FormState): AdminSettings {
  const patch: AdminSettings = {};
  if (form.homeLatitude.trim()) {
    patch.homeLatitude = Number(form.homeLatitude);
  }
  if (form.homeLongitude.trim()) {
    patch.homeLongitude = Number(form.homeLongitude);
  }
  if (form.transportRadius.trim()) {
    patch.transportRadius = Number(form.transportRadius);
  }
  if (form.transportIntervalMs.trim()) {
    patch.transportIntervalMs = Number(form.transportIntervalMs);
  }
  if (form.weatherIntervalMs.trim()) {
    patch.weatherIntervalMs = Number(form.weatherIntervalMs);
  }
  return patch;
}

interface SettingsFormProps {
  initial: AdminSettings;
}

export function SettingsForm({ initial }: SettingsFormProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(() => fromSettings(initial));
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (patch: AdminSettings) => updateAdminSettings(patch),
    onSuccess: (data) => {
      qc.setQueryData(SETTINGS_KEY, data);
      setForm(fromSettings(data));
      setStatusMsg(t('admin.settings.saved'));
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
      setStatusMsg(null);
    },
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatusMsg(null);
    save.mutate(toPatch(form));
  }

  return (
    <Section title={t('admin.settings.title')}>
      <Notice tone="info">{t('admin.settings.hint')}</Notice>
      <Form onSubmit={onSubmit}>
        <Field id="set-lat" label={t('admin.settings.homeLatitude')}>
          <Input
            id="set-lat"
            type="number"
            step="any"
            placeholder={PLACEHOLDERS.homeLatitude}
            value={form.homeLatitude}
            onChange={(e) => setForm({ ...form, homeLatitude: e.target.value })}
          />
        </Field>
        <Field id="set-lon" label={t('admin.settings.homeLongitude')}>
          <Input
            id="set-lon"
            type="number"
            step="any"
            placeholder={PLACEHOLDERS.homeLongitude}
            value={form.homeLongitude}
            onChange={(e) => setForm({ ...form, homeLongitude: e.target.value })}
          />
        </Field>
        <Field id="set-radius" label={t('admin.settings.transportRadius')}>
          <Input
            id="set-radius"
            type="number"
            min={50}
            max={10000}
            step={50}
            placeholder={PLACEHOLDERS.transportRadius}
            value={form.transportRadius}
            onChange={(e) => setForm({ ...form, transportRadius: e.target.value })}
          />
        </Field>
        <Field id="set-transport-interval" label={t('admin.settings.transportIntervalMs')}>
          <Input
            id="set-transport-interval"
            type="number"
            min={30000}
            max={3600000}
            step={30000}
            placeholder={PLACEHOLDERS.transportIntervalMs}
            value={form.transportIntervalMs}
            onChange={(e) => setForm({ ...form, transportIntervalMs: e.target.value })}
          />
        </Field>
        <Field id="set-weather-interval" label={t('admin.settings.weatherIntervalMs')}>
          <Input
            id="set-weather-interval"
            type="number"
            min={60000}
            max={21600000}
            step={60000}
            placeholder={PLACEHOLDERS.weatherIntervalMs}
            value={form.weatherIntervalMs}
            onChange={(e) => setForm({ ...form, weatherIntervalMs: e.target.value })}
          />
        </Field>
        {statusMsg ? (
          <Notice tone="info" fullWidth>
            {statusMsg}
          </Notice>
        ) : null}
        {error ? (
          <Notice tone="error" fullWidth>
            {error}
          </Notice>
        ) : null}
        <FormActions>
          <Button type="submit" variant="primary" disabled={save.isPending}>
            {save.isPending ? t('admin.form.saving') : t('admin.settings.save')}
          </Button>
        </FormActions>
      </Form>
    </Section>
  );
}
