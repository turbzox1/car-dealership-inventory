import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedDatabase } from '../../src/db/seed';
import { createTestPrisma, resetDatabase } from './helpers/testDb';

const options = { adminEmail: 'Admin@Dealership.com', adminPassword: 'super-secret-1' };

describe('seedDatabase', () => {
  let prisma: PrismaClient;

  beforeAll(() => {
    prisma = createTestPrisma();
  });

  beforeEach(() => resetDatabase(prisma));

  afterAll(() => prisma.$disconnect());

  it('creates an admin with a hashed password and a normalized email', async () => {
    await seedDatabase(prisma, options);

    const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@dealership.com' } });
    expect(admin.role).toBe('ADMIN');
    expect(admin.passwordHash).not.toBe('super-secret-1');
    expect(await bcrypt.compare('super-secret-1', admin.passwordHash)).toBe(true);
  });

  it('adds sample vehicles to an empty catalogue', async () => {
    await seedDatabase(prisma, options);

    expect(await prisma.vehicle.count()).toBeGreaterThan(0);
  });

  it('is safe to run twice: one admin, no duplicate vehicles', async () => {
    await seedDatabase(prisma, options);
    const vehiclesAfterFirstRun = await prisma.vehicle.count();

    await seedDatabase(prisma, options);

    expect(await prisma.user.count({ where: { role: 'ADMIN' } })).toBe(1);
    expect(await prisma.vehicle.count()).toBe(vehiclesAfterFirstRun);
  });

  it('does not add sample vehicles when the catalogue already has data', async () => {
    await prisma.vehicle.create({ data: { make: 'Ford', model: 'F-150', category: 'TRUCK', price: 45000, quantity: 1 } });

    await seedDatabase(prisma, options);

    expect(await prisma.vehicle.count()).toBe(1);
  });

  it('promotes an existing user with the admin email without changing their password', async () => {
    await prisma.user.create({
      data: { name: 'Existing', email: 'admin@dealership.com', passwordHash: 'existing-hash', role: 'USER' },
    });

    await seedDatabase(prisma, options);

    const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@dealership.com' } });
    expect(admin.role).toBe('ADMIN');
    expect(admin.passwordHash).toBe('existing-hash');
  });

  it.each([
    ['missing email', { adminEmail: '', adminPassword: 'super-secret-1' }],
    ['invalid email', { adminEmail: 'not-an-email', adminPassword: 'super-secret-1' }],
    ['short password', { adminEmail: 'admin@dealership.com', adminPassword: 'short' }],
  ])('refuses to run with %s', async (_case, badOptions) => {
    await expect(seedDatabase(prisma, badOptions)).rejects.toThrow();
    expect(await prisma.user.count()).toBe(0);
  });
});
