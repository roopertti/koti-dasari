import type { Database } from '@home-dashboard/db';
import type { Kysely } from 'kysely';
import { type ElectricityPriceEntry, fetchElectricityPrices } from './porssisahko.js';

const HELSINKI = 'Europe/Helsinki';
const PUBLISH_WINDOW_INTERVAL_MS = 30 * 60_000;
const DEFAULT_INTERVAL_MS = 60 * 60_000;
const STALE_THRESHOLD_MS = 48 * 60 * 60_000;

export interface ElectricitySchedulerConfig {
  db: Kysely<Database>;
}

export function startScheduler(config: ElectricitySchedulerConfig): () => void {
  const { db } = config;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running = false;
  let stopped = false;

  async function tick() {
    if (running) {
      return;
    }
    running = true;

    try {
      console.log('[electricity] Fetching prices...');
      const entries = await fetchElectricityPrices();

      await replacePrices(db, entries);
      await cleanupStale(db);

      console.log(`[electricity] Cycle complete (${entries.length} price entries)`);
    } catch (err) {
      console.error('[electricity] Fetch cycle failed:', err);
    } finally {
      running = false;
      if (!stopped) {
        const delay = nextDelayMs(new Date());
        timer = setTimeout(tick, delay);
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

/**
 * Tomorrow's prices publish around 14:00 EET. Tighten cadence to 30 min between
 * 13:00 and 16:00 local Helsinki time so the next-day chart updates promptly.
 */
export function nextDelayMs(now: Date): number {
  const hourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: HELSINKI,
    hour: 'numeric',
    hour12: false,
  }).format(now);
  const hour = Number.parseInt(hourStr, 10);
  const inPublishWindow = hour >= 13 && hour < 16;
  return inPublishWindow ? PUBLISH_WINDOW_INTERVAL_MS : DEFAULT_INTERVAL_MS;
}

async function replacePrices(db: Kysely<Database>, entries: ElectricityPriceEntry[]) {
  if (entries.length === 0) {
    return;
  }
  const now = new Date().toISOString();
  await db.transaction().execute(async (trx) => {
    for (const entry of entries) {
      await trx
        .insertInto('electricity_prices')
        .values({
          hour_start: entry.hourStart,
          price_cents_per_kwh: entry.priceCentsPerKwh,
          fetched_at: now,
        })
        .onConflict((oc) =>
          oc.column('hour_start').doUpdateSet({
            price_cents_per_kwh: entry.priceCentsPerKwh,
            fetched_at: now,
          }),
        )
        .execute();
    }
  });
}

async function cleanupStale(db: Kysely<Database>) {
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
  await db.deleteFrom('electricity_prices').where('hour_start', '<', cutoff).execute();
}
