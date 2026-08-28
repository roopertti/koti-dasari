import { t, timeHm } from '@home-dashboard/i18n';
import {
  isOverrideActive,
  type SleepOverrideMode,
  type SleepSettings,
} from '@home-dashboard/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { setSleepOverride, updateSleepSettings } from '../../../api/admin.js';
import { errorToMessage } from '../../../api/client.js';
import { DISPLAY_SETTINGS_KEY } from '../../../hooks/useDisplaySettings.js';
import { Button } from '../../common/Button/Button.js';
import { useToast } from '../../common/Toast/useToast.js';
import { Checkbox } from '../primitives/Checkbox/Checkbox.js';
import { Field } from '../primitives/Field/Field.js';
import { Form } from '../primitives/Form/Form.js';
import { FormActions } from '../primitives/FormActions/FormActions.js';
import { Input } from '../primitives/Input/Input.js';
import { Notice } from '../primitives/Notice/Notice.js';
import { Section } from '../primitives/Section/Section.js';

interface FormState {
  enabled: boolean;
  start: string;
  end: string;
}

function overrideStatus(sleep: SleepSettings): string {
  // An expired override reads as `auto` — the schedule has already resumed
  // server-side even though the stored mode/until still linger.
  if (!sleep.overrideUntil || !isOverrideActive(sleep, new Date())) {
    return t('admin.sleep.status.auto');
  }
  const time = timeHm.format(new Date(sleep.overrideUntil));
  return sleep.override === 'wake'
    ? t('admin.sleep.status.wake', { time })
    : t('admin.sleep.status.sleep', { time });
}

interface SleepFormProps {
  initial: SleepSettings;
}

export function SleepForm({ initial }: SleepFormProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => ({
    enabled: initial.enabled,
    start: initial.start,
    end: initial.end,
  }));

  function applyResult(sleep: SleepSettings) {
    qc.setQueryData(DISPLAY_SETTINGS_KEY, { sleep });
  }

  const save = useMutation({
    mutationFn: () => updateSleepSettings(form),
    onSuccess: (sleep) => {
      applyResult(sleep);
      toast.success(t('admin.sleep.saved'));
    },
    onError: (err) => toast.error(errorToMessage(err)),
  });

  const override = useMutation({
    mutationFn: (mode: SleepOverrideMode) => setSleepOverride(mode),
    onSuccess: (sleep) => {
      applyResult(sleep);
      toast.success(t('admin.sleep.overrideUpdated'));
    },
    onError: (err) => toast.error(errorToMessage(err)),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    save.mutate();
  }

  const busy = save.isPending || override.isPending;

  return (
    <>
      <Section title={t('admin.sleep.title')}>
        <Notice tone="info">{t('admin.sleep.hint')}</Notice>
        <Form onSubmit={onSubmit}>
          <Field id="sleep-enabled" label={t('admin.sleep.enabled')}>
            <Checkbox
              id="sleep-enabled"
              checked={form.enabled}
              onChange={(enabled) => setForm({ ...form, enabled })}
              hint={t('admin.sleep.enabledHint')}
            />
          </Field>
          <Field id="sleep-start" label={t('admin.sleep.start')}>
            <Input
              id="sleep-start"
              type="time"
              value={form.start}
              onChange={(e) => setForm({ ...form, start: e.target.value })}
              required
            />
          </Field>
          <Field id="sleep-end" label={t('admin.sleep.end')}>
            <Input
              id="sleep-end"
              type="time"
              value={form.end}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
              required
            />
          </Field>
          <FormActions>
            <Button type="submit" variant="primary" disabled={busy}>
              {save.isPending ? t('admin.form.saving') : t('admin.sleep.save')}
            </Button>
          </FormActions>
        </Form>
      </Section>

      <Section title={t('admin.sleep.override.title')}>
        <Notice tone="info">{overrideStatus(initial)}</Notice>
        <FormActions>
          <Button variant="subtle" onClick={() => override.mutate('wake')} disabled={busy}>
            {t('admin.sleep.forceWake')}
          </Button>
          <Button variant="subtle" onClick={() => override.mutate('sleep')} disabled={busy}>
            {t('admin.sleep.forceSleep')}
          </Button>
          <Button
            variant="subtle"
            onClick={() => override.mutate('auto')}
            disabled={busy || !isOverrideActive(initial, new Date())}
          >
            {t('admin.sleep.resume')}
          </Button>
        </FormActions>
      </Section>
    </>
  );
}
