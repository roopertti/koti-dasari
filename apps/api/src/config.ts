export interface Config {
  port: number;
  host: string;
  databasePath: string;
}

export function loadConfig(): Config {
  return {
    port: Number(process.env.PORT) || 3001,
    host: process.env.HOST || '0.0.0.0',
    databasePath: process.env.DATABASE_PATH || './dashboard.db',
  };
}
