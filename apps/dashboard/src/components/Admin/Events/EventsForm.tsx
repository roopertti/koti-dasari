import { t } from '@home-dashboard/i18n';
import type { CalendarEvent, CreateCalendarEventInput } from '@home-dashboard/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { createCalendarEvent, updateCalendarEvent } from '../../../api/calendar.js';
import { Button } from '../../common/Button/Button.js';
import { Checkbox } from '../primitives/Checkbox/Checkbox.js';
import { Field } from '../primitives/Field/Field.js';
import { Form } from '../primitives/Form/Form.js';
import { FormActions } from '../primitives/FormActions/FormActions.js';
import { Input } from '../primitives/Input/Input.js';
import { Notice } from '../primitives/Notice/Notice.js';
import { Section } from '../primitives/Section/Section.js';
import { Textarea } from '../primitives/Textarea/Textarea.js';
import { invalidateEverywhere } from './queries.js';

interface FormState {
  id: string | null;
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
}

function emptyForm(): FormState {
  return {
    id: null,
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    allDay: false,
  };
}

function toLocalInput(iso: string): string {
  // datetime-local wants "YYYY-MM-DDTHH:MM" in local time.
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(local: string): string {
  // Treat datetime-local as the user's local clock; convert to ISO (UTC).
  return new Date(local).toISOString();
}

function eventToForm(e: CalendarEvent): FormState {
  return {
    id: e.id,
    title: e.title,
    description: e.description ?? '',
    location: e.location ?? '',
    startTime: toLocalInput(e.startTime),
    endTime: toLocalInput(e.endTime),
    allDay: e.allDay,
  };
}

interface EventsFormProps {
  initial: CalendarEvent | null;
  onDone: () => void;
}

export function EventsForm({ initial, onDone }: EventsFormProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(() => (initial ? eventToForm(initial) : emptyForm()));
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (payload: FormState) => {
      const body: CreateCalendarEventInput = {
        title: payload.title.trim(),
        description: payload.description.trim() || null,
        location: payload.location.trim() || null,
        startTime: fromLocalInput(payload.startTime),
        endTime: fromLocalInput(payload.endTime),
        allDay: payload.allDay,
      };
      if (payload.id) {
        await updateCalendarEvent(payload.id, body);
      } else {
        await createCalendarEvent(body);
      }
    },
    onSuccess: () => {
      invalidateEverywhere(qc);
      onDone();
    },
    onError: (err: Error) => setError(err.message),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim() || !form.startTime || !form.endTime) {
      setError(t('admin.events.form.required'));
      return;
    }
    if (new Date(form.endTime) <= new Date(form.startTime)) {
      setError(t('admin.events.form.endAfterStart'));
      return;
    }
    save.mutate(form);
  }

  return (
    <Section title={initial ? t('admin.events.form.editTitle') : t('admin.events.form.newTitle')}>
      <Form onSubmit={onSubmit}>
        <Field id="event-title" label={t('admin.events.form.title')} fullWidth>
          <Input
            id="event-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </Field>
        <Field id="event-start" label={t('admin.events.form.start')}>
          <Input
            id="event-start"
            type="datetime-local"
            value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            required
          />
        </Field>
        <Field id="event-end" label={t('admin.events.form.end')}>
          <Input
            id="event-end"
            type="datetime-local"
            value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })}
            required
          />
        </Field>
        <Field id="event-location" label={t('admin.events.form.location')}>
          <Input
            id="event-location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </Field>
        <Field id="event-allday" label={t('admin.events.form.allDay')}>
          <Checkbox
            id="event-allday"
            checked={form.allDay}
            onChange={(allDay) => setForm({ ...form, allDay })}
            hint={t('admin.events.form.allDayHint')}
          />
        </Field>
        <Field id="event-description" label={t('admin.events.form.description')} fullWidth>
          <Textarea
            id="event-description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        {error ? (
          <Notice tone="error" fullWidth>
            {error}
          </Notice>
        ) : null}
        <FormActions>
          {initial ? (
            <Button variant="subtle" onClick={onDone}>
              {t('admin.form.cancel')}
            </Button>
          ) : null}
          <Button type="submit" variant="primary" disabled={save.isPending}>
            {save.isPending
              ? t('admin.form.saving')
              : initial
                ? t('admin.form.update')
                : t('admin.form.create')}
          </Button>
        </FormActions>
      </Form>
    </Section>
  );
}
