import { PrismaClient } from '@prisma/client';
import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';
import { createTestPrisma, createUserWithToken, resetDatabase, TEST_JWT_SECRET } from './helpers/testDb';

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

describe('Orders (cart checkout) routes (Postgres)', () => {
  let prisma: PrismaClient;
  let app: Express;
  let admin: { id: string; auth: string };
  let alice: { id: string; auth: string };
  let bob: { id: string; auth: string };

  async function vehicle(make: string, model: string, price: number, quantity: number): Promise<string> {
    const row = await prisma.vehicle.create({ data: { make, model, category: 'SEDAN', price, quantity } });
    return row.id;
  }
  const stockOf = async (id: string) => (await prisma.vehicle.findUniqueOrThrow({ where: { id } })).quantity;
  const checkout = (auth: string, items: unknown) => request(app).post('/api/orders').set('Authorization', auth).send({ items });

  beforeAll(() => {
    prisma = createTestPrisma();
    app = createApp({ prisma, jwtSecret: TEST_JWT_SECRET });
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    admin = await createUserWithToken(prisma, 'ADMIN', 'admin@example.com');
    alice = await createUserWithToken(prisma, 'USER', 'alice@example.com');
    bob = await createUserWithToken(prisma, 'USER', 'bob@example.com');
  });

  afterAll(() => prisma.$disconnect());

  describe('POST /api/orders', () => {
    it('buys every line as one order and decreases each stock', async () => {
      const civic = await vehicle('Honda', 'Civic', 24000, 3);
      const crv = await vehicle('Honda', 'CR-V', 32000.5, 2);

      const res = await checkout(alice.auth, [
        { vehicleId: civic, quantity: 2 },
        { vehicleId: crv, quantity: 1 },
      ]);

      expect(res.status).toBe(201);
      expect(res.body.order).toMatchObject({ id: expect.any(String), total: 80000.5 });
      expect(res.body.order.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ vehicleId: civic, make: 'Honda', model: 'Civic', quantity: 2, unitPrice: 24000, totalPrice: 48000 }),
          expect.objectContaining({ vehicleId: crv, quantity: 1, unitPrice: 32000.5, totalPrice: 32000.5 }),
        ]),
      );
      expect(res.body.vehicles).toHaveLength(2);
      expect([await stockOf(civic), await stockOf(crv)]).toEqual([1, 1]);
      expect(await prisma.order.count()).toBe(1);
      expect(await prisma.purchase.count()).toBe(2);
    });

    it('is all or nothing: one short line means nothing is bought (409 naming the vehicle)', async () => {
      const civic = await vehicle('Honda', 'Civic', 24000, 3);
      const golf = await vehicle('Volkswagen', 'Golf', 23900, 1);

      const res = await checkout(alice.auth, [
        { vehicleId: civic, quantity: 1 },
        { vehicleId: golf, quantity: 2 },
      ]);

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Not enough stock for Volkswagen Golf (1 left)');
      expect([await stockOf(civic), await stockOf(golf)]).toEqual([3, 1]);
      expect(await prisma.order.count()).toBe(0);
      expect(await prisma.purchase.count()).toBe(0);
    });

    it('returns 404 and buys nothing if any vehicle is unknown or archived', async () => {
      const civic = await vehicle('Honda', 'Civic', 24000, 3);
      const archived = await vehicle('Old', 'Model', 1000, 5);
      await prisma.vehicle.update({ where: { id: archived }, data: { isArchived: true } });

      for (const missing of [UNKNOWN_ID, archived]) {
        const res = await checkout(alice.auth, [{ vehicleId: civic, quantity: 1 }, { vehicleId: missing, quantity: 1 }]);
        expect(res.status).toBe(404);
      }
      expect(await stockOf(civic)).toBe(3);
    });

    it('merges repeated lines for the same vehicle', async () => {
      const civic = await vehicle('Honda', 'Civic', 24000, 3);

      const res = await checkout(alice.auth, [{ vehicleId: civic, quantity: 1 }, { vehicleId: civic, quantity: 2 }]);

      expect(res.status).toBe(201);
      expect(res.body.order.items).toHaveLength(1);
      expect(await stockOf(civic)).toBe(0);
    });

    it.each([
      ['no items field', undefined],
      ['an empty cart', []],
      ['a missing vehicle id', [{ quantity: 1 }]],
      ['a zero quantity', [{ vehicleId: 'v', quantity: 0 }]],
      ['a fractional quantity', [{ vehicleId: 'v', quantity: 1.5 }]],
    ])('returns 400 for %s', async (_case, items) => {
      const res = await checkout(alice.auth, items);
      expect(res.status).toBe(400);
    });

    it('returns 401 without a token', async () => {
      const res = await request(app).post('/api/orders').send({ items: [] });
      expect(res.status).toBe(401);
    });
  });

  describe('order history', () => {
    it('GET /api/orders/me lists the caller\'s orders, newest first, including single Purchase clicks', async () => {
      const civic = await vehicle('Honda', 'Civic', 24000, 5);
      const crv = await vehicle('Honda', 'CR-V', 32000, 5);
      await checkout(alice.auth, [{ vehicleId: civic, quantity: 1 }, { vehicleId: crv, quantity: 1 }]);
      await request(app).post(`/api/vehicles/${crv}/purchase`).set('Authorization', alice.auth);
      await checkout(bob.auth, [{ vehicleId: civic, quantity: 1 }]);

      const res = await request(app).get('/api/orders/me').set('Authorization', alice.auth);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].items).toHaveLength(1); // the later single purchase
      expect(res.body[1]).toMatchObject({ total: 56000 });
      expect(res.body[1].items).toHaveLength(2);
      expect(res.body[0]).not.toHaveProperty('customer');
    });

    it('GET /api/orders lists every order with the customer for admins only', async () => {
      const civic = await vehicle('Honda', 'Civic', 24000, 5);
      await checkout(alice.auth, [{ vehicleId: civic, quantity: 1 }]);
      await checkout(bob.auth, [{ vehicleId: civic, quantity: 2 }]);

      const res = await request(app).get('/api/orders').set('Authorization', admin.auth);
      const forbidden = await request(app).get('/api/orders').set('Authorization', alice.auth);

      expect(res.status).toBe(200);
      expect(res.body.map((o: { customer: { email: string } }) => o.customer.email).sort()).toEqual([
        'alice@example.com',
        'bob@example.com',
      ]);
      expect(forbidden.status).toBe(403);
    });
  });
});
