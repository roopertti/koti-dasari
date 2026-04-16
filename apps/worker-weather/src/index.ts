import { createDatabaseWithRetry } from '@home-dashboard/db';
import { startScheduler } from './scheduler.js';

const databasePath = process.env.DATABASE_PATH || './dashboard.db';
const latitude = Number(process.env.HOME_LATITUDE) || 60.1699;
const longitude = Number(process.env.HOME_LONGITUDE) || 24.9384;
const intervalMs = Number(process.env.WEATHER_INTERVAL_MS) || 1_800_000;

console.log(`[weather] Connecting to database at ${databasePath}`);
const db = await createDatabaseWithRetry(databasePath);
console.log('[weather] Database connected');

const stop = startScheduler({ db, latitude, longitude, intervalMs });

console.log(
  `[weather] Worker started (lat=${latitude}, lon=${longitude}, interval=${intervalMs}ms)`,
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
