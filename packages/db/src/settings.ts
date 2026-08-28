import { helsinkiMinutesOfDay } from '@home-dashboard/i18n';
import { isAsleep, type SleepSettings } from '@home-dashboard/shared';
import type { Kysely } from 'kysely';
import type { Database } from './types.js';

export type SleepOverrideMode = 'auto' | 'wake' | 'sleep';

export interface DashboardSettings {
  homeLatitude: number;
  homeLongitude: number;
  transportRadius: number;
  transportIntervalMs: number;
  weatherIntervalMs: number;
  // Night sleep mode (Phase 15). Times are local "HH:MM" in Europe/Helsinki.
  sleepEnabled: boolean;
  sleepStart: string;
  sleepEnd: string;
  sleepOverride: SleepOverrideMode;
  // ISO 8601 UTC instant the manual override expires at; null when none.
  sleepOverrideUntil: string | null;
}

type SettingType = 'number' | 'boolean' | 'string' | 'stringOrNull';

interface SettingSpec {
  col: string;
  type: SettingType;
}

const SPECS: Record<keyof DashboardSettings, SettingSpec> = {
  homeLatitude: { col: 'home_latitude', type: 'number' },
  homeLongitude: { col: 'home_longitude', type: 'number' },
  transportRadius: { col: 'transport_radius', type: 'number' },
  transportIntervalMs: { col: 'transport_interval_ms', type: 'number' },
  weatherIntervalMs: { col: 'weather_interval_ms', type: 'number' },
  sleepEnabled: { col: 'sleep_enabled', type: 'boolean' },
  sleepStart: { col: 'sleep_start', type: 'string' },
  sleepEnd: { col: 'sleep_end', type: 'string' },
  sleepOverride: { col: 'sleep_override', type: 'string' },
  sleepOverrideUntil: { col: 'sleep_override_until', type: 'stringOrNull' },
};

/** Fallback values used to seed missing keys and to resolve a full settings object. */
export const DEFAULT_SETTINGS: DashboardSettings = {
  homeLatitude: 60.1699,
  homeLongitude: 24.9384,
  transportRadius: 500,
  transportIntervalMs: 300_000,
  weatherIntervalMs: 1_800_000,
  sleepEnabled: false,
  sleepStart: '23:00',
  sleepEnd: '06:30',
  sleepOverride: 'auto',
  sleepOverrideUntil: null,
};

/** Project resolved settings down to the sleep subset (camel field rename). */
export function sleepFromSettings(s: DashboardSettings): SleepSettings {
  return {
    enabled: s.sleepEnabled,
    start: s.sleepStart,
    end: s.sleepEnd,
    override: s.sleepOverride,
    overrideUntil: s.sleepOverrideUntil,
  };
}

/**
 * Whether the display should be asleep right now, given resolved settings.
 * Wraps the pure `isAsleep` predicate with the Helsinki minute-of-day lookup so
 * workers (and the API) get a single server-side entry point.
 */
export function isAsleepNow(s: DashboardSettings, now: Date = new Date()): boolean {
  return isAsleep(now, helsinkiMinutesOfDay(now), sleepFromSettings(s));
}

/** Decode a stored string into the typed value, or undefined if unparseable. */
function decode(spec: SettingSpec, raw: string): unknown {
  switch (spec.type) {
    case 'number': {
      const num = Number(raw);
      return Number.isFinite(num) ? num : undefined;
    }
    case 'boolean':
      return raw === 'true';
    case 'stringOrNull':
      return raw === '' ? null : raw;
    default:
      return raw;
  }
}

function encode(spec: SettingSpec, value: unknown): string {
  if (spec.type === 'stringOrNull') {
    return value === null || value === undefined ? '' : String(value);
  }
  return String(value);
}

export async function readSettings(db: Kysely<Database>): Promise<Partial<DashboardSettings>> {
  const rows = await db.selectFrom('settings').select(['key', 'value']).execute();

  const byKey = new Map(rows.map((r) => [r.key, r.value]));

  const out: Record<string, unknown> = {};

  for (const [camel, spec] of Object.entries(SPECS) as Array<
    [keyof DashboardSettings, SettingSpec]
  >) {
    const raw = byKey.get(spec.col);

    if (raw === undefined) {
      continue;
    }

    const value = decode(spec, raw);

    if (value !== undefined) {
      out[camel] = value;
    }
  }

  return out as Partial<DashboardSettings>;
}

export async function resolveSettings(
  db: Kysely<Database>,
  defaults: DashboardSettings = DEFAULT_SETTINGS,
): Promise<DashboardSettings> {
  const stored = await readSettings(db);
  return { ...defaults, ...stored };
}

export async function writeSettings(
  db: Kysely<Database>,
  patch: Partial<DashboardSettings>,
): Promise<void> {
  const entries = Object.entries(patch) as Array<[keyof DashboardSettings, unknown]>;

  if (entries.length === 0) {
    return;
  }
  const now = new Date().toISOString();
  await db.transaction().execute(async (trx) => {
    for (const [camel, value] of entries) {
      const spec = SPECS[camel];
      const stored = encode(spec, value);
      await trx
        .insertInto('settings')
        .values({ key: spec.col, value: stored, updated_at: now })
        .onConflict((oc) => oc.column('key').doUpdateSet({ value: stored, updated_at: now }))
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
    [keyof DashboardSettings, unknown]
  >) {
    if (value === undefined) {
      continue;
    }
    if (stored[camel] !== undefined) {
      continue;
    }
    (patch as Record<string, unknown>)[camel] = value;
  }

  const seeded = Object.keys(patch) as Array<keyof DashboardSettings>;

  if (seeded.length > 0) {
    await writeSettings(db, patch);
  }
  return seeded;
}
