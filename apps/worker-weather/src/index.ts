import { createDatabaseWithRetry } from '@home-dashboard/db';
import { startScheduler } from './scheduler.js';

const databasePath = process.env.DATABASE_PATH || './dashboard.db';
const defaults = {
  homeLatitude: Number(process.env.HOME_LATITUDE) || 60.1699,
  homeLongitude: Number(process.env.HOME_LONGITUDE) || 24.9384,
  transportRadius: Number(process.env.TRANSPORT_RADIUS) || 500,
  transportIntervalMs: Number(process.env.TRANSPORT_INTERVAL_MS) || 300_000,
  weatherIntervalMs: Number(process.env.WEATHER_INTERVAL_MS) || 1_800_000,
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
