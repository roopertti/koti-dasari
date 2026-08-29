import { t } from '@home-dashboard/i18n';
import { ROTATION_LIMITS, type RotationSettings } from '@home-dashboard/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { updateRotationSettings } from '../../../api/admin.js';
import { errorToMessage } from '../../../api/client.js';
import type { DisplaySettings } from '../../../api/settings.js';
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

// The API stores both timings in milliseconds; the form talks seconds, which is
// the unit an operator actually thinks in for "advance every N".
const MS_PER_S = 1000;

const SECONDS = {
  interval: {
    min: ROTATION_LIMITS.intervalMs.min / MS_PER_S,
    max: ROTATION_LIMITS.intervalMs.max / MS_PER_S,
  },
  idle: {
    min: ROTATION_LIMITS.idleMs.min / MS_PER_S,
    max: ROTATION_LIMITS.idleMs.max / MS_PER_S,
  },
} as const;

interface FormState {
  enabled: boolean;
  intervalSeconds: string;
  idleSeconds: string;
}

function fromSettings(rotation: RotationSettings): FormState {
  return {
    enabled: rotation.enabled,
    intervalSeconds: String(Math.round(rotation.intervalMs / MS_PER_S)),
    idleSeconds: String(Math.round(rotation.idleMs / MS_PER_S)),
  };
}

interface RotationFormProps {
  initial: RotationSettings;
}

export function RotationForm({ initial }: RotationFormProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => fromSettings(initial));

  const save = useMutation({
    mutationFn: () =>
      updateRotationSettings({
        enabled: form.enabled,
        // Rounded: the API takes integer milliseconds, and a fractional entry
        // would otherwise come back as a validation error.
        intervalMs: Math.round(Number(form.intervalSeconds) * MS_PER_S),
        idleMs: Math.round(Number(form.idleSeconds) * MS_PER_S),
      }),
    onSuccess: (rotation) => {
      // The display query holds sleep + rotation together; patch rotation in
      // place so the sleep half of the cache entry survives.
      qc.setQueryData<DisplaySettings>(DISPLAY_SETTINGS_KEY, (previous) =>
        previous ? { ...previous, rotation } : previous,
      );
      setForm(fromSettings(rotation));
      toast.success(t('admin.rotation.saved'));
    },
    onError: (err) => toast.error(errorToMessage(err)),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    save.mutate();
  }

  return (
    <Section title={t('admin.rotation.title')}>
      <Notice tone="info">{t('admin.rotation.hint')}</Notice>
      <Form onSubmit={onSubmit}>
        <Field id="rotation-enabled" label={t('admin.rotation.enabled')}>
          <Checkbox
            id="rotation-enabled"
            checked={form.enabled}
            onChange={(enabled) => setForm({ ...form, enabled })}
            hint={t('admin.rotation.enabledHint')}
          />
        </Field>
        <Field id="rotation-interval" label={t('admin.rotation.interval')}>
          <Input
            id="rotation-interval"
            type="number"
            min={SECONDS.interval.min}
            max={SECONDS.interval.max}
            step={5}
            value={form.intervalSeconds}
            onChange={(e) => setForm({ ...form, intervalSeconds: e.target.value })}
            required
          />
        </Field>
        <Field id="rotation-idle" label={t('admin.rotation.idle')}>
          <Input
            id="rotation-idle"
            type="number"
            min={SECONDS.idle.min}
            max={SECONDS.idle.max}
            step={30}
            value={form.idleSeconds}
            onChange={(e) => setForm({ ...form, idleSeconds: e.target.value })}
            required
          />
        </Field>
        <FormActions>
          <Button type="submit" variant="primary" disabled={save.isPending}>
            {save.isPending ? t('admin.form.saving') : t('admin.rotation.save')}
          </Button>
        </FormActions>
      </Form>
    </Section>
  );
}
