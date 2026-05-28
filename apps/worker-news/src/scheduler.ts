import type { Database } from '@home-dashboard/db';
import type { Kysely } from 'kysely';
import { fetchYleNews, type NewsItemEntry } from './yle-rss.js';

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60_000;
const NEWS_SOURCE = 'yle';

export interface NewsSchedulerConfig {
  db: Kysely<Database>;
  feedUrl: string;
  intervalMs: number;
}

export function startScheduler(config: NewsSchedulerConfig): () => void {
  const { db, feedUrl, intervalMs } = config;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let stopped = false;

  async function tick() {
    if (running) {
      return;
    }
    running = true;

    try {
      console.log(`[news] Fetching headlines from ${feedUrl}...`);
      const entries = await fetchYleNews(feedUrl);
      await upsertItems(db, entries);
      await cleanupStale(db);
      console.log(`[news] Cycle complete (${entries.length} items)`);
    } catch (err) {
      console.error('[news] Fetch cycle failed:', err);
    } finally {
      running = false;
      if (!stopped) {
        timer = setTimeout(tick, intervalMs);
      }
    }
  }

  tick();

  return () => {
    stopped = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
}

async function upsertItems(db: Kysely<Database>, entries: NewsItemEntry[]) {
  if (entries.length === 0) {
    return;
  }
  const now = new Date().toISOString();
  await db.transaction().execute(async (trx) => {
    for (const entry of entries) {
      await trx
        .insertInto('news_items')
        .values({
          guid: entry.guid,
          title: entry.title,
          link: entry.link,
          summary: entry.summary,
          published_at: entry.publishedAt,
          source: NEWS_SOURCE,
          fetched_at: now,
        })
        .onConflict((oc) =>
          oc.column('guid').doUpdateSet({
            title: entry.title,
            link: entry.link,
            summary: entry.summary,
            published_at: entry.publishedAt,
            source: NEWS_SOURCE,
            fetched_at: now,
          }),
        )
        .execute();
    }
  });
}

async function cleanupStale(db: Kysely<Database>) {
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
  await db.deleteFrom('news_items').where('published_at', '<', cutoff).execute();
}
