import 'dotenv/config';
import { createApp } from './app';
import { loadServerConfig } from './config';
import { createPrismaClient } from './db/prisma';

// Throws (and the process exits) on missing, short or placeholder secrets
const config = loadServerConfig(process.env);

const prisma = createPrismaClient(config.databaseUrl);
const app = createApp({ prisma, jwtSecret: config.jwtSecret, corsOrigins: config.corsOrigins });

app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`));
