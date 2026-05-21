import type { DashboardSettings } from '@home-dashboard/db';

export interface AuthConfig {
  apiKeys: string[];
  adminPin: string | null;
  adminSessionKey: Buffer | null;
}

export interface Config {
  port: number;
  host: string;
  databasePath: string;
  auth: AuthConfig;
  // Env-derived defaults for the runtime settings table. Used to seed any keys
  // missing on startup; admin-edited values in the table take precedence.
  settingDefaults: Partial<DashboardSettings>;
}

function parseApiKeys(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseSessionKey(raw: string | undefined): Buffer | null {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  if (!/^[0-9a-f]{64}$/i.test(trimmed)) {
    throw new Error(
      "ADMIN_SESSION_KEY must be a 64-character hex string (32 random bytes). Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return Buffer.from(trimmed, 'hex');
}

function parseNumber(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === '') {
    return undefined;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function loadConfig(): Config {
  const apiKeys = parseApiKeys(process.env.API_KEYS);
  const apiAuthDisabled = process.env.API_AUTH?.trim().toLowerCase() === 'disabled';
  if (apiKeys.length === 0 && !apiAuthDisabled) {
    throw new Error(
      'API_KEYS is empty. Set API_KEYS=<comma-separated client keys> to enable per-client auth, ' +
        'or explicitly opt out with API_AUTH=disabled (only safe on a fully trusted network).',
    );
  }
  return {
    port: Number(process.env.PORT) || 3001,
    host: process.env.HOST || '0.0.0.0',
    databasePath: process.env.DATABASE_PATH || './dashboard.db',
    auth: {
      apiKeys,
      adminPin: process.env.ADMIN_PIN?.trim() || null,
      adminSessionKey: parseSessionKey(process.env.ADMIN_SESSION_KEY),
    },
    settingDefaults: {
      homeLatitude: parseNumber(process.env.HOME_LATITUDE),
      homeLongitude: parseNumber(process.env.HOME_LONGITUDE),
      transportRadius: parseNumber(process.env.TRANSPORT_RADIUS),
      transportIntervalMs: parseNumber(process.env.TRANSPORT_INTERVAL_MS),
      weatherIntervalMs: parseNumber(process.env.WEATHER_INTERVAL_MS),
    },
  };
}
