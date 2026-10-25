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

  it('offers a full showroom: at least 30 vehicles covering every category', async () => {
    await seedDatabase(prisma, options);

    expect(await prisma.vehicle.count()).toBeGreaterThanOrEqual(30);
    const categories = await prisma.vehicle.groupBy({ by: ['category'] });
    expect(categories).toHaveLength(8);
  });

  it('adds only the missing sample vehicles and leaves existing ones untouched', async () => {
    await seedDatabase(prisma, options);
    const fullCount = await prisma.vehicle.count();
    const f150 = await prisma.vehicle.findFirstOrThrow({ where: { make: 'Ford', model: 'F-150' } });
    await prisma.vehicle.update({ where: { id: f150.id }, data: { price: 39999, quantity: 0 } });
    await prisma.vehicle.delete({ where: { id: (await prisma.vehicle.findFirstOrThrow({ where: { make: 'Toyota', model: 'Camry' } })).id } });

    await seedDatabase(prisma, options);

    expect(await prisma.vehicle.count()).toBe(fullCount);
    const after = await prisma.vehicle.findUniqueOrThrow({ where: { id: f150.id } });
    expect(after).toMatchObject({ quantity: 0 });
    expect(after.price.toNumber()).toBe(39999);
  });

  it('gives every sample vehicle basic details, a description and credited photos', async () => {
    await seedDatabase(prisma, options);

    const vehicles = await prisma.vehicle.findMany();
    for (const v of vehicles) {
      expect(v).toMatchObject({
        year: expect.any(Number),
        fuelType: expect.stringMatching(/^(Petrol|Diesel|Hybrid|Electric)$/),
        transmission: expect.stringMatching(/^(Automatic|Manual)$/),
        seats: expect.any(Number),
        description: expect.any(String),
      });
      const images = v.images as { url: string; author: string; license: string; sourceUrl: string }[];
      expect(images.length).toBeGreaterThan(0);
      for (const image of images) {
        expect(image).toMatchObject({
          url: expect.stringMatching(/^https:\/\/(upload|thumb)\.wikimedia\.org\/[^?]+$/),
          author: expect.any(String),
          license: expect.any(String),
          sourceUrl: expect.stringMatching(/^https:\/\/commons\.wikimedia\.org\//),
        });
      }
    }
  });

  it('fills in details and photos for existing sample vehicles that have none, without overwriting edits', async () => {
    await prisma.vehicle.create({ data: { make: 'Toyota', model: 'Camry', category: 'SEDAN', price: 28400, quantity: 5 } });
    await prisma.vehicle.create({
      data: { make: 'Honda', model: 'Civic', category: 'SEDAN', price: 24650, quantity: 3, description: 'Edited by an admin' },
    });

    await seedDatabase(prisma, options);

    const camry = await prisma.vehicle.findFirstOrThrow({ where: { make: 'Toyota', model: 'Camry' } });
    const civic = await prisma.vehicle.findFirstOrThrow({ where: { make: 'Honda', model: 'Civic' } });
    expect(camry.description).toEqual(expect.any(String));
    expect((camry.images as unknown[]).length).toBeGreaterThan(0);
    expect(civic.description).toBe('Edited by an admin');
  });

  it('does not bring back a sample vehicle an admin archived', async () => {
    await seedDatabase(prisma, options);
    const camry = await prisma.vehicle.findFirstOrThrow({ where: { make: 'Toyota', model: 'Camry' } });
    await prisma.vehicle.update({ where: { id: camry.id }, data: { isArchived: true } });

    await seedDatabase(prisma, options);

    expect(await prisma.vehicle.count({ where: { make: 'Toyota', model: 'Camry' } })).toBe(1);
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
    // Seeding is called directly in some setups, so it must not rely on the CLI's env checks
    ['placeholder password', { adminEmail: 'admin@dealership.com', adminPassword: 'change-me-too' }],
    ['password under 12 characters', { adminEmail: 'admin@dealership.com', adminPassword: 'Abcdef-123' }],
  ])('refuses to run with %s', async (_case, badOptions) => {
    await expect(seedDatabase(prisma, badOptions)).rejects.toThrow();
    expect(await prisma.user.count()).toBe(0);
  });
});
