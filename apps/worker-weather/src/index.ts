import { createDatabaseWithRetry, DEFAULT_SETTINGS } from '@home-dashboard/db';
import { startScheduler } from './scheduler.js';

const databasePath = process.env.DATABASE_PATH || './dashboard.db';
const defaults = {
  ...DEFAULT_SETTINGS,
  homeLatitude: Number(process.env.HOME_LATITUDE) || DEFAULT_SETTINGS.homeLatitude,
  homeLongitude: Number(process.env.HOME_LONGITUDE) || DEFAULT_SETTINGS.homeLongitude,
  transportRadius: Number(process.env.TRANSPORT_RADIUS) || DEFAULT_SETTINGS.transportRadius,
  transportIntervalMs:
    Number(process.env.TRANSPORT_INTERVAL_MS) || DEFAULT_SETTINGS.transportIntervalMs,
  weatherIntervalMs: Number(process.env.WEATHER_INTERVAL_MS) || DEFAULT_SETTINGS.weatherIntervalMs,
};

console.log(`[weather] Connecting to database at ${databasePath}`);
const db = await createDatabaseWithRetry(databasePath);
console.log('[weather] Database connected');

const stop = startScheduler({ db, defaults });

console.log(
  `[weather] Worker started (default lat=${defaults.homeLatitude}, lon=${defaults.homeLongitude}, interval=${defaults.weatherIntervalMs}ms)`,
);

function shutdown() {
  console.log('[weather] Shutting down...');
  stop();
  db.destroy().then(() => {
    console.log('[weather] Database closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
