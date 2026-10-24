import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { createPrismaClient } from '../../../src/db/prisma';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://dealership:dealership@localhost:5433/dealership_test';

export const TEST_JWT_SECRET = 'integration-test-secret';

/**
 * Inserts a real user and returns its id and Bearer header. Tokens must belong
 * to existing users: authenticate looks each caller up in the database.
 */
export async function createUserWithToken(
  prisma: PrismaClient,
  role: 'USER' | 'ADMIN',
  email = `${role.toLowerCase()}-${Date.now()}-${Math.random()}@example.com`,
): Promise<{ id: string; auth: string }> {
  const user = await prisma.user.create({ data: { name: email.split('@')[0], email, passwordHash: 'x', role } });
  const token = jwt.sign({ role }, TEST_JWT_SECRET, { subject: user.id, expiresIn: '1h' });
  return { id: user.id, auth: `Bearer ${token}` };
}

export function createTestPrisma(): PrismaClient {
  return createPrismaClient(TEST_DATABASE_URL);
}

/** Empties all tables so every test starts from a clean database. */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Purchase", "Vehicle", "User" CASCADE');
}
