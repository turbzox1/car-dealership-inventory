import { createApp } from './app';
import { loadServerConfig } from './config';
import { createPrismaClient } from './db/prisma';

/**
 * Entry point for Vercel's serverless runtime: the same Express app as
 * server.ts, but exported instead of listening. Built once per cold start;
 * the platform handles HTTPS, listening and shutdown.
 */
const config = loadServerConfig(process.env);

export default createApp({
  prisma: createPrismaClient(config.databaseUrl),
  jwtSecret: config.jwtSecret,
  corsOrigins: config.corsOrigins,
  trustProxy: config.trustProxy,
});
