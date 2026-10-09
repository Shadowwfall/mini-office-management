import pg from 'pg';
import { config } from '../config/env.js';

const { Pool, types } = pg;

// Parse DATE (OID 1082) as raw 'YYYY-MM-DD' string to avoid timezone shifting
types.setTypeParser(1082, (val) => val);

export const pool = new Pool({
  connectionString: config.databaseUrl
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client:', err.message);
});

export default pool;
