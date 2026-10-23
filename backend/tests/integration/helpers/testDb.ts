import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { createPrismaClient } from '../../../src/db/prisma';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://dealership:dealership@localhost:5433/dealership_test';

export const TEST_JWT_SECRET = 'integration-test-secret';

/** Bearer header for a caller with the given role (no DB user needed for token checks). */
export function bearer(role: 'USER' | 'ADMIN'): string {
  const token = jwt.sign({ role }, TEST_JWT_SECRET, { subject: `${role.toLowerCase()}-1`, expiresIn: '1h' });
  return `Bearer ${token}`;
}

export function createTestPrisma(): PrismaClient {
  return createPrismaClient(TEST_DATABASE_URL);
}

/** Empties all tables so every test starts from a clean database. */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Purchase", "Vehicle", "User" CASCADE');
}
