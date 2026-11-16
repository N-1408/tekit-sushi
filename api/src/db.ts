import pg from 'pg';
import { env } from './env.js';

// One shared pool for the whole api process (the Vercel functions each made
// their own; the VPS app does not need to).
export const pool = new pg.Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl.includes('localhost') ? undefined : { rejectUnauthorized: false },
  max: 10,
});
