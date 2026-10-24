import 'dotenv/config';
import { createApp } from './app';
import { createPrismaClient } from './db/prisma';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

const prisma = createPrismaClient(requireEnv('DATABASE_URL'));
// Comma-separated list, e.g. "http://localhost:5173,https://my-app.vercel.app"
const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',').map((o) => o.trim());
const app = createApp({ prisma, jwtSecret: requireEnv('JWT_SECRET'), corsOrigins });
const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
