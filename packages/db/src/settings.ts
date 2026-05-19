import type { Kysely } from 'kysely';
import type { Database } from './types.js';

export interface DashboardSettings {
  homeLatitude: number;
  homeLongitude: number;
  transportRadius: number;
  transportIntervalMs: number;
  weatherIntervalMs: number;
}

const KEYS: Record<keyof DashboardSettings, string> = {
  homeLatitude: 'home_latitude',
  homeLongitude: 'home_longitude',
  transportRadius: 'transport_radius',
  transportIntervalMs: 'transport_interval_ms',
  weatherIntervalMs: 'weather_interval_ms',
};

export async function readSettings(db: Kysely<Database>): Promise<Partial<DashboardSettings>> {
  const rows = await db.selectFrom('settings').select(['key', 'value']).execute();
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const out: Partial<DashboardSettings> = {};
  for (const [camel, snake] of Object.entries(KEYS) as Array<[keyof DashboardSettings, string]>) {
    const raw = byKey.get(snake);
    if (raw === undefined) {
      continue;
    }
    const num = Number(raw);
    if (Number.isFinite(num)) {
      out[camel] = num;
    }
  }
  return out;
}

export async function resolveSettings(
  db: Kysely<Database>,
  defaults: DashboardSettings,
): Promise<DashboardSettings> {
  const stored = await readSettings(db);
  return { ...defaults, ...stored };
}

export async function writeSettings(
  db: Kysely<Database>,
  patch: Partial<DashboardSettings>,
): Promise<void> {
  const entries = Object.entries(patch) as Array<[keyof DashboardSettings, number]>;
  if (entries.length === 0) {
    return;
  }
  const now = new Date().toISOString();
  await db.transaction().execute(async (trx) => {
    for (const [camel, value] of entries) {
      const key = KEYS[camel];
      await trx
        .insertInto('settings')
        .values({ key, value: String(value), updated_at: now })
        .onConflict((oc) => oc.column('key').doUpdateSet({ value: String(value), updated_at: now }))
        .execute();
    }
  });
}

/**
 * Insert env-derived defaults for any settings key not already in the table.
 * Existing rows are left alone so admin-edited values are never clobbered on
 * restart. Returns the keys that were actually written.
 */
export async function seedSettingsFromEnv(
  db: Kysely<Database>,
  envDefaults: Partial<DashboardSettings>,
): Promise<Array<keyof DashboardSettings>> {
  const stored = await readSettings(db);
  const patch: Partial<DashboardSettings> = {};
  for (const [camel, value] of Object.entries(envDefaults) as Array<
    [keyof DashboardSettings, number | undefined]
  >) {
    if (value === undefined) {
      continue;
    }
    if (stored[camel] !== undefined) {
      continue;
    }
    patch[camel] = value;
  }
  const seeded = Object.keys(patch) as Array<keyof DashboardSettings>;
  if (seeded.length > 0) {
    await writeSettings(db, patch);
  }
  return seeded;
}
