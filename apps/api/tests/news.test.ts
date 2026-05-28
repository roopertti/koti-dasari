import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp } from './helpers.js';

describe('News API', () => {
  let app: Awaited<ReturnType<typeof createTestApp>>['app'];
  let db: Awaited<ReturnType<typeof createTestApp>>['db'];

  beforeEach(async () => {
    ({ app, db } = await createTestApp());
  });

  afterEach(async () => {
    await app.close();
    await db.destroy();
  });

  describe('GET /api/news', () => {
    it('returns empty list when no items exist', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/news' });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toEqual([]);
    });

    it('returns items in descending publishedAt order with camelCase fields', async () => {
      await db
        .insertInto('news_items')
        .values([
          {
            guid: 'a',
            title: 'Older',
            link: 'https://yle.fi/a',
            summary: null,
            published_at: '2026-05-20T10:00:00.000Z',
            source: 'yle',
          },
          {
            guid: 'b',
            title: 'Newer',
            link: 'https://yle.fi/b',
            summary: 'A short summary',
            published_at: '2026-05-20T12:00:00.000Z',
            source: 'yle',
          },
          {
            guid: 'c',
            title: 'Middle',
            link: 'https://yle.fi/c',
            summary: null,
            published_at: '2026-05-20T11:00:00.000Z',
            source: 'yle',
          },
        ])
        .execute();

      const res = await app.inject({ method: 'GET', url: '/api/news' });
      expect(res.statusCode).toBe(200);
      const { data } = res.json();
      expect(data).toHaveLength(3);
      expect(data[0]).toMatchObject({
        guid: 'b',
        title: 'Newer',
        link: 'https://yle.fi/b',
        summary: 'A short summary',
        publishedAt: '2026-05-20T12:00:00.000Z',
        source: 'yle',
      });
      expect(data[0].fetchedAt).toBeDefined();
      expect(data[1].guid).toBe('c');
      expect(data[2].guid).toBe('a');
    });

    it('respects limit query param', async () => {
      await db
        .insertInto('news_items')
        .values(
          Array.from({ length: 15 }, (_, i) => ({
            guid: `item-${i}`,
            title: `Title ${i}`,
            link: `https://yle.fi/${i}`,
            summary: null,
            published_at: `2026-05-${String(20 - i).padStart(2, '0')}T12:00:00.000Z`,
            source: 'yle',
          })),
        )
        .execute();

      const res = await app.inject({ method: 'GET', url: '/api/news?limit=3' });
      expect(res.statusCode).toBe(200);
      const { data } = res.json();
      expect(data).toHaveLength(3);
      expect(data[0].guid).toBe('item-0');
      expect(data[1].guid).toBe('item-1');
      expect(data[2].guid).toBe('item-2');
    });

    it('defaults to limit=10 when no param given', async () => {
      await db
        .insertInto('news_items')
        .values(
          Array.from({ length: 15 }, (_, i) => ({
            guid: `item-${i}`,
            title: `Title ${i}`,
            link: `https://yle.fi/${i}`,
            summary: null,
            published_at: `2026-05-${String(20 - i).padStart(2, '0')}T12:00:00.000Z`,
            source: 'yle',
          })),
        )
        .execute();

      const res = await app.inject({ method: 'GET', url: '/api/news' });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(10);
    });

    it('rejects out-of-range limit', async () => {
      const tooBig = await app.inject({ method: 'GET', url: '/api/news?limit=999' });
      expect(tooBig.statusCode).toBe(400);

      const zero = await app.inject({ method: 'GET', url: '/api/news?limit=0' });
      expect(zero.statusCode).toBe(400);
    });
  });
});
