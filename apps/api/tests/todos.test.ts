import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers.js';

describe('Todos API', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let db: Awaited<ReturnType<typeof createTestApp>>['db'];

  beforeEach(async () => {
    ({ app, db } = await createTestApp());
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  const validTodo = {
    title: 'Buy groceries',
    description: 'Milk and eggs',
    priority: 'high' as const,
    dueDate: '2026-04-20',
  };

  describe('POST /api/todos', () => {
    it('creates a todo and returns 201', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/todos', payload: validTodo });

      expect(res.statusCode).toBe(201);
      const { data } = res.json();
      expect(data.id).toBeDefined();
      expect(data.title).toBe('Buy groceries');
      expect(data.completed).toBe(false);
      expect(data.priority).toBe('high');
    });

    it('defaults priority to medium', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { title: 'Simple task' },
      });

      expect(res.statusCode).toBe(201);
      expect(res.json().data.priority).toBe('medium');
    });

    it('returns 400 when title is empty', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { title: '' },
      });

      expect(res.statusCode).toBe(400);
      expect(res.json().error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/todos', () => {
    it('returns empty list initially', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/todos' });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });

    it('filters by completed status', async () => {
      await app.inject({ method: 'POST', url: '/api/todos', payload: validTodo });
      const created = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { title: 'Done task' },
      });
      const { id } = created.json().data;
      await app.inject({ method: 'PATCH', url: `/api/todos/${id}/toggle` });

      const incomplete = await app.inject({ method: 'GET', url: '/api/todos?completed=false' });
      expect(incomplete.json().data).toHaveLength(1);

      const complete = await app.inject({ method: 'GET', url: '/api/todos?completed=true' });
      expect(complete.json().data).toHaveLength(1);
    });

    it('filters by priority', async () => {
      await app.inject({ method: 'POST', url: '/api/todos', payload: validTodo });
      await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { title: 'Low task', priority: 'low' },
      });

      const res = await app.inject({ method: 'GET', url: '/api/todos?priority=high' });
      expect(res.json().data).toHaveLength(1);
      expect(res.json().data[0].title).toBe('Buy groceries');
    });
  });

  describe('PATCH /api/todos/:id/toggle', () => {
    it('toggles completion status', async () => {
      const created = await app.inject({ method: 'POST', url: '/api/todos', payload: validTodo });
      const { id } = created.json().data;

      const toggled = await app.inject({ method: 'PATCH', url: `/api/todos/${id}/toggle` });
      expect(toggled.json().data.completed).toBe(true);

      const toggledBack = await app.inject({ method: 'PATCH', url: `/api/todos/${id}/toggle` });
      expect(toggledBack.json().data.completed).toBe(false);
    });

    it('returns 404 for nonexistent id', async () => {
      const res = await app.inject({ method: 'PATCH', url: '/api/todos/nonexistent/toggle' });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('updates a todo and returns the new fields', async () => {
      const created = await app.inject({ method: 'POST', url: '/api/todos', payload: validTodo });
      const { id } = created.json().data;

      const res = await app.inject({
        method: 'PUT',
        url: `/api/todos/${id}`,
        payload: { title: 'Updated', priority: 'low', dueDate: null },
      });

      expect(res.statusCode).toBe(200);
      const { data } = res.json();
      expect(data.title).toBe('Updated');
      expect(data.priority).toBe('low');
      expect(data.dueDate).toBeNull();
    });

    it('returns 404 for nonexistent id', async () => {
      const res = await app.inject({
        method: 'PUT',
        url: '/api/todos/nonexistent',
        payload: { title: 'Updated' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/todos/reorder', () => {
    it('updates sort order for multiple todos', async () => {
      const first = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { title: 'First' },
      });
      const second = await app.inject({
        method: 'POST',
        url: '/api/todos',
        payload: { title: 'Second' },
      });

      const res = await app.inject({
        method: 'PUT',
        url: '/api/todos/reorder',
        payload: {
          items: [
            { id: first.json().data.id, sortOrder: 1 },
            { id: second.json().data.id, sortOrder: 0 },
          ],
        },
      });

      expect(res.statusCode).toBe(200);

      const list = await app.inject({ method: 'GET', url: '/api/todos' });
      expect(list.json().data[0].title).toBe('Second');
      expect(list.json().data[1].title).toBe('First');
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('deletes a todo and returns 204', async () => {
      const created = await app.inject({ method: 'POST', url: '/api/todos', payload: validTodo });
      const { id } = created.json().data;

      const res = await app.inject({ method: 'DELETE', url: `/api/todos/${id}` });
      expect(res.statusCode).toBe(204);
    });

    it('returns 404 for nonexistent id', async () => {
      const res = await app.inject({ method: 'DELETE', url: '/api/todos/nonexistent' });
      expect(res.statusCode).toBe(404);
    });
  });
});
