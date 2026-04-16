import { createDatabaseWithRetry } from '@home-dashboard/db';
import { startScheduler } from './scheduler.js';

const databasePath = process.env.DATABASE_PATH || './dashboard.db';
const apiKey = process.env.DIGITRANSIT_API_KEY;
const latitude = Number(process.env.HOME_LATITUDE) || 60.1699;
const longitude = Number(process.env.HOME_LONGITUDE) || 24.9384;
const radius = Number(process.env.TRANSPORT_RADIUS) || 500;
const intervalMs = Number(process.env.TRANSPORT_INTERVAL_MS) || 300_000;

if (!apiKey) {
  console.error('[transport] DIGITRANSIT_API_KEY is required');
  process.exit(1);
}

console.log(`[transport] Connecting to database at ${databasePath}`);
const db = await createDatabaseWithRetry(databasePath);
console.log('[transport] Database connected');

const stop = startScheduler({ db, apiKey, latitude, longitude, radius, intervalMs });

console.log(
  `[transport] Worker started (lat=${latitude}, lon=${longitude}, radius=${radius}m, interval=${intervalMs}ms)`,
);

function shutdown() {
  console.log('[transport] Shutting down...');
  stop();
  db.destroy().then(() => {
    console.log('[transport] Database closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
