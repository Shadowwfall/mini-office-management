import 'dotenv/config';

const requiredEnvVars = ['DATABASE_URL'];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL,
  databaseUrlDirect: process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-prod',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin12345'
};
