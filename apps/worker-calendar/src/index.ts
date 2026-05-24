import { createDatabaseWithRetry } from '@home-dashboard/db';
import { startScheduler } from './scheduler.js';

const databasePath = process.env.DATABASE_PATH || './dashboard.db';

console.log(`[calendar] Connecting to database at ${databasePath}`);
const db = await createDatabaseWithRetry(databasePath);
console.log('[calendar] Database connected');

const stop = startScheduler({ db });

console.log('[calendar] Worker started');

function shutdown() {
  console.log('[calendar] Shutting down...');
  stop();
  db.destroy().then(() => {
    console.log('[calendar] Database closed');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
