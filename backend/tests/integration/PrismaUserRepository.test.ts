import { PrismaClient } from '@prisma/client';
import { ConflictError } from '../../src/domain/errors';
import { PrismaUserRepository } from '../../src/repositories/PrismaUserRepository';
import { createTestPrisma, resetDatabase } from './helpers/testDb';

describe('PrismaUserRepository', () => {
  let prisma: PrismaClient;
  let repo: PrismaUserRepository;

  beforeAll(() => {
    prisma = createTestPrisma();
    repo = new PrismaUserRepository(prisma);
  });

  beforeEach(() => resetDatabase(prisma));

  afterAll(() => prisma.$disconnect());

  // Deterministic version of the registration race: the service's pre-check
  // passed for both callers, so the database unique constraint must decide.
  it('maps a unique-email violation to ConflictError', async () => {
    const user = { name: 'Asha', email: 'asha@example.com', passwordHash: 'hash' };
    await repo.create(user);

    await expect(repo.create(user)).rejects.toThrow(ConflictError);
  });

  it('rethrows other database errors unchanged', async () => {
    const invalidRole = { name: 'A', email: 'b@example.com', passwordHash: 'h', role: 'NOT_A_ROLE' as never };

    await expect(repo.create(invalidRole)).rejects.not.toThrow(ConflictError);
  });
});
