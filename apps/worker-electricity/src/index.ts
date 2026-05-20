import { createDatabaseWithRetry } from '@home-dashboard/db';
import { startScheduler } from './scheduler.js';

const databasePath = process.env.DATABASE_PATH || './dashboard.db';

console.log(`[electricity] Connecting to database at ${databasePath}`);
const db = await createDatabaseWithRetry(databasePath);
console.log('[electricity] Database connected');

const stop = startScheduler({ db });

console.log('[electricity] Worker started');

function shutdown() {
  console.log('[electricity] Shutting down...');
  stop();
  db.destroy().then(() => {
    console.log('[electricity] Database closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
