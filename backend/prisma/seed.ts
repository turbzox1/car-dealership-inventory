import 'dotenv/config';
import { createPrismaClient } from '../src/db/prisma';
import { seedDatabase } from '../src/db/seed';

/** CLI entry for `npm run seed`; reads the admin credentials from the environment. */
async function main(): Promise<void> {
  const prisma = createPrismaClient(process.env.DATABASE_URL ?? '');
  try {
    await seedDatabase(prisma, {
      adminEmail: process.env.ADMIN_EMAIL ?? '',
      adminPassword: process.env.ADMIN_PASSWORD ?? '',
    });
    console.log(`Seed complete. Admin: ${process.env.ADMIN_EMAIL}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message ?? err);
  process.exit(1);
});
