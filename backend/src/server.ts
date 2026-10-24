import 'dotenv/config';
import { createApp } from './app';
import { loadServerConfig } from './config';
import { createPrismaClient } from './db/prisma';
import { createGracefulShutdown } from './lifecycle';

// Throws (and the process exits) on missing, short or placeholder secrets
const config = loadServerConfig(process.env);

const prisma = createPrismaClient(config.databaseUrl);
const app = createApp({ prisma, jwtSecret: config.jwtSecret, corsOrigins: config.corsOrigins });

const server = app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`));

const shutdown = createGracefulShutdown({ server, disconnect: () => prisma.$disconnect(), timeoutMs: 10_000 });
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    shutdown(signal).then(
      () => process.exit(0),
      (err) => {
        console.error('Shutdown failed:', err);
        process.exit(1);
      },
    );
  });
}
