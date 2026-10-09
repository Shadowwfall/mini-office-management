import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env.js';
import pool from './db/pool.js';
import employeeRoutes from './routes/employeeRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

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

// Module routes
app.use('/api/employees', employeeRoutes);
app.use('/api/leave-requests', leaveRoutes);

// 404 & Central Error Handler
app.use(notFound);
app.use(errorHandler);

export default app;
