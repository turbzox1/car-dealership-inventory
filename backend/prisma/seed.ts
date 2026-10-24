import 'dotenv/config';
import { loadSeedConfig } from '../src/config';
import { createPrismaClient } from '../src/db/prisma';
import { seedDatabase } from '../src/db/seed';

/** CLI entry for `npm run seed`; reads and validates the admin credentials from the environment. */
async function main(): Promise<void> {
  const config = loadSeedConfig(process.env);
  const prisma = createPrismaClient(config.databaseUrl);
  try {
    await seedDatabase(prisma, config);
    console.log(`Seed complete. Admin: ${config.adminEmail}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message ?? err);
  process.exit(1);
});
