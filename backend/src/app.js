import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import pool from './db/pool.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.clientOrigin
}));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ok', db: 'up' });
  } catch (err) {
    console.error('Healthcheck DB failure:', err.message);
    res.status(503).json({ status: 'error', db: 'down' });
  }
});

export default app;
