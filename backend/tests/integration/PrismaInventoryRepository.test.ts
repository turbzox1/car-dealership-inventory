import { PrismaClient } from '@prisma/client';
import { PurchaseOutcome } from '../../src/domain/Purchase';
import { PrismaInventoryRepository } from '../../src/repositories/PrismaInventoryRepository';
import { createTestPrisma, resetDatabase } from './helpers/testDb';

/**
 * Concurrency guarantees, tested against Postgres without the HTTP layer.
 *
 * Calls are fired with Promise.all straight at the repository so they truly
 * overlap at the database. (Over supertest, requests arrive too staggered to
 * hit the race window: a deliberately broken read-then-write purchase passed
 * the HTTP tests but fails these.)
 */
describe('PrismaInventoryRepository concurrency (Postgres)', () => {
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

  async function vehicleWithStock(quantity: number): Promise<string> {
    const vehicle = await prisma.vehicle.create({
      data: { make: 'Honda', model: 'Civic', category: 'SEDAN', price: 24000, quantity },
    });
    return vehicle.id;
  }

  const stockOf = async (id: string) => (await prisma.vehicle.findUniqueOrThrow({ where: { id } })).quantity;

  function tally(outcomes: PromiseSettledResult<PurchaseOutcome>[]) {
    const counts = { ok: 0, out_of_stock: 0, not_found: 0, errors: 0 };
    for (const o of outcomes) {
      if (o.status === 'rejected') counts.errors++;
      else counts[o.value.status]++;
    }
    return counts;
  }

  it.each([
    [1, 5],
    [3, 10],
    // More buyers than the connection pool (10), so some wait for a connection too
    [5, 30],
  ])('with %i in stock and %i simultaneous single-unit buyers, sells exactly the stock', async (stock, buyers) => {
    const id = await vehicleWithStock(stock);

    const outcomes = await Promise.allSettled(
      Array.from({ length: buyers }, () => repo.purchase(userId, id, 1)),
    );

    expect(tally(outcomes)).toEqual({ ok: stock, out_of_stock: buyers - stock, not_found: 0, errors: 0 });
    expect(await stockOf(id)).toBe(0);
    expect(await prisma.purchase.count()).toBe(stock);
  });

  it('never sells more units than exist when buyers request different quantities at once', async () => {
    const id = await vehicleWithStock(5);
    const requested = [3, 2, 2, 1, 4, 1, 3];

    const outcomes = await Promise.allSettled(requested.map((q) => repo.purchase(userId, id, q)));

    const sold = (await prisma.purchase.findMany({ where: { vehicleId: id } })).reduce((sum, p) => sum + p.quantity, 0);
    expect(tally(outcomes).errors).toBe(0);
    expect(sold).toBeLessThanOrEqual(5);
    // Stock and purchase records must agree exactly: no lost or phantom updates
    expect(await stockOf(id)).toBe(5 - sold);
  });

  it('loses no updates when restocks and purchases run at the same time', async () => {
    const id = await vehicleWithStock(10);

    const outcomes = await Promise.allSettled([
      ...Array.from({ length: 10 }, () => repo.purchase(userId, id, 1)),
      ...Array.from({ length: 5 }, () => repo.restock(id, 2)),
    ]);

    expect(outcomes.filter((o) => o.status === 'rejected')).toHaveLength(0);
    // 10 - 10 sold + 5 × 2 restocked; every purchase succeeds because stock never runs short
    expect(await prisma.purchase.count()).toBe(10);
    expect(await stockOf(id)).toBe(10);
  });
});
