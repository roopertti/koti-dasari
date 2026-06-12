import { t } from '@home-dashboard/i18n';
import type { CreateTodoInput, Todo, TodoPriority } from '@home-dashboard/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type FormEvent, useState } from 'react';
import { errorToMessage } from '../../../api/client.js';
import { createTodo, updateTodo } from '../../../api/todos.js';
import { Button } from '../../common/Button/Button.js';
import { useToast } from '../../common/Toast/useToast.js';
import { Field } from '../primitives/Field/Field.js';
import { Form } from '../primitives/Form/Form.js';
import { FormActions } from '../primitives/FormActions/FormActions.js';
import { Input } from '../primitives/Input/Input.js';
import { Notice } from '../primitives/Notice/Notice.js';
import { Section } from '../primitives/Section/Section.js';
import { Select } from '../primitives/Select/Select.js';
import { Textarea } from '../primitives/Textarea/Textarea.js';
import { invalidateEverywhere } from './queries.js';

interface FormState {
  id: string | null;
  title: string;
  description: string;
  priority: TodoPriority;
  dueDate: string;
}

function emptyForm(): FormState {
  return { id: null, title: '', description: '', priority: 'medium', dueDate: '' };
}

function todoToForm(todo: Todo): FormState {
  return {
    id: todo.id,
    title: todo.title,
    description: todo.description ?? '',
    priority: todo.priority,
    dueDate: todo.dueDate ?? '',
  };
}

interface TodosFormProps {
  initial: Todo | null;
  onDone: () => void;
}

export function TodosForm({ initial, onDone }: TodosFormProps) {
  const qc = useQueryClient();
  const toast = useToast();
  const [form, setForm] = useState<FormState>(() => (initial ? todoToForm(initial) : emptyForm()));
  const [error, setError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (payload: FormState) => {
      const body: CreateTodoInput = {
        title: payload.title.trim(),
        description: payload.description.trim() || null,
        priority: payload.priority,
        dueDate: payload.dueDate || null,
      };
      if (payload.id) {
        await updateTodo(payload.id, body);
      } else {
        await createTodo(body);
      }
    },
    onSuccess: () => {
      invalidateEverywhere(qc);
      toast.success(t('admin.todos.saved'));
      onDone();
    },
    onError: (err) => toast.error(errorToMessage(err)),
  });

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError(t('admin.todos.form.required'));
      return;
    }
    save.mutate(form);
  }

  return (
    <Section title={initial ? t('admin.todos.form.editTitle') : t('admin.todos.form.newTitle')}>
      <Form onSubmit={onSubmit}>
        <Field id="todo-title" label={t('admin.todos.form.title')} fullWidth>
          <Input
            id="todo-title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </Field>
        <Field id="todo-priority" label={t('admin.todos.form.priority')}>
          <Select
            id="todo-priority"
            value={form.priority}
            onChange={(priority) => setForm({ ...form, priority })}
            options={[
              { value: 'low', label: t('admin.todos.priority.low') },
              { value: 'medium', label: t('admin.todos.priority.medium') },
              { value: 'high', label: t('admin.todos.priority.high') },
            ]}
          />
        </Field>
        <Field id="todo-due" label={t('admin.todos.form.due')}>
          <Input
            id="todo-due"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </Field>
        <Field id="todo-description" label={t('admin.todos.form.description')} fullWidth>
          <Textarea
            id="todo-description"
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
