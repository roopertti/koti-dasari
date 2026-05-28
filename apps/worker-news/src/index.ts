import { createDatabaseWithRetry } from '@home-dashboard/db';
import { startScheduler } from './scheduler.js';
import { DEFAULT_YLE_FEED_URL } from './yle-rss.js';

const databasePath = process.env.DATABASE_PATH || './dashboard.db';
const feedUrl = process.env.NEWS_FEED_URL || DEFAULT_YLE_FEED_URL;
const intervalMs = Number(process.env.NEWS_INTERVAL_MS) || 15 * 60_000;

console.log(`[news] Connecting to database at ${databasePath}`);
const db = await createDatabaseWithRetry(databasePath);
console.log('[news] Database connected');

const stop = startScheduler({ db, feedUrl, intervalMs });

console.log(`[news] Worker started (feed=${feedUrl}, interval=${intervalMs}ms)`);

function shutdown() {
  console.log('[news] Shutting down...');
  stop();
  db.destroy().then(() => {
    console.log('[news] Database closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
