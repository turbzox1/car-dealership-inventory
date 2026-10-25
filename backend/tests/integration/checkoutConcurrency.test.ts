import { PrismaClient } from '@prisma/client';
import { CheckoutOutcome } from '../../src/domain/Order';
import { PrismaInventoryRepository } from '../../src/repositories/PrismaInventoryRepository';
import { createTestPrisma, resetDatabase } from './helpers/testDb';

/**
 * Checkout concurrency against Postgres, fired straight at the repository so
 * the calls truly overlap (see PrismaInventoryRepository.test.ts for why not HTTP).
 */
describe('Checkout concurrency (Postgres)', () => {
  let prisma: PrismaClient;
  let repo: PrismaInventoryRepository;
  let userId: string;

  beforeAll(() => {
    prisma = createTestPrisma();
    repo = new PrismaInventoryRepository(prisma);
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    userId = (await prisma.user.create({ data: { name: 'Buyer', email: 'buyer@example.com', passwordHash: 'x' } })).id;
  });

  afterAll(() => prisma.$disconnect());

  const make = async (model: string, quantity: number) =>
    (await prisma.vehicle.create({ data: { make: 'Make', model, category: 'SEDAN', price: 1000, quantity } })).id;
  const stockOf = async (id: string) => (await prisma.vehicle.findUniqueOrThrow({ where: { id } })).quantity;

  it('sells the last unit to exactly one of several carts that contain it', async () => {
    const last = await make('Last', 1);
    const plenty = await make('Plenty', 50);

    const outcomes = await Promise.all(
      Array.from({ length: 6 }, () =>
        repo.checkout(userId, [
          { vehicleId: plenty, quantity: 1 },
          { vehicleId: last, quantity: 1 },
        ]),
      ),
    );

    const ok = outcomes.filter((o: CheckoutOutcome) => o.status === 'ok');
    expect(ok).toHaveLength(1);
    expect(outcomes.filter((o) => o.status === 'out_of_stock')).toHaveLength(5);
    // Failed carts must not have taken the other line either (all or nothing)
    expect(await stockOf(last)).toBe(0);
    expect(await stockOf(plenty)).toBe(49);
    expect(await prisma.order.count()).toBe(1);
  });

  it('does not deadlock when carts lock the same vehicles in opposite orders', async () => {
    const a = await make('A', 20);
    const b = await make('B', 20);

    const outcomes = await Promise.allSettled(
      Array.from({ length: 10 }, (_, i) =>
        repo.checkout(
          userId,
          i % 2
            ? [{ vehicleId: a, quantity: 1 }, { vehicleId: b, quantity: 1 }]
            : [{ vehicleId: b, quantity: 1 }, { vehicleId: a, quantity: 1 }],
        ),
      ),
    );

    expect(outcomes.filter((o) => o.status === 'rejected')).toHaveLength(0);
    expect([await stockOf(a), await stockOf(b)]).toEqual([10, 10]);
    expect(await prisma.order.count()).toBe(10);
  });
});
