import 'dotenv/config';
import { createApp } from './app';
import { createPrismaClient } from './db/prisma';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

const prisma = createPrismaClient(requireEnv('DATABASE_URL'));
const app = createApp({ prisma, jwtSecret: requireEnv('JWT_SECRET') });
const port = Number(process.env.PORT ?? 4000);

app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
