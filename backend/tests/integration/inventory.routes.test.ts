import { PrismaClient } from '@prisma/client';
import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';
import { createTestPrisma, createUserWithToken, resetDatabase, TEST_JWT_SECRET } from './helpers/testDb';

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

describe('Inventory routes (Postgres)', () => {
  let prisma: PrismaClient;
  let app: Express;
  let admin: { id: string; auth: string };
  let alice: { id: string; auth: string };
  let bob: { id: string; auth: string };

  async function createVehicle(quantity: number, overrides: object = {}): Promise<string> {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', admin.auth)
      .send({ make: 'Honda', model: 'Civic', category: 'SEDAN', price: 24000, quantity, ...overrides });
    return res.body.id;
  }

  const stockOf = async (id: string) => (await prisma.vehicle.findUniqueOrThrow({ where: { id } })).quantity;

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

  describe('POST /api/vehicles/:id/purchase', () => {
    it('returns 401 without a token', async () => {
      const id = await createVehicle(1);
      expect((await request(app).post(`/api/vehicles/${id}/purchase`)).status).toBe(401);
    });

    it('buys one unit by default and returns the purchase and updated vehicle', async () => {
      const id = await createVehicle(3);

      const res = await request(app).post(`/api/vehicles/${id}/purchase`).set('Authorization', alice.auth);

      expect(res.status).toBe(201);
      expect(res.body.vehicle.quantity).toBe(2);
      expect(res.body.purchase).toMatchObject({
        userId: alice.id, vehicleId: id, make: 'Honda', model: 'Civic', quantity: 1, unitPrice: 24000, totalPrice: 24000,
      });
      expect(await stockOf(id)).toBe(2);
    });

    it('buys several units when a quantity is given', async () => {
      const id = await createVehicle(3);

      const res = await request(app)
        .post(`/api/vehicles/${id}/purchase`)
        .set('Authorization', alice.auth)
        .send({ quantity: 2 });

      expect(res.status).toBe(201);
      expect(res.body.purchase.totalPrice).toBe(48000);
      expect(await stockOf(id)).toBe(1);
    });

    it('returns 409 when stock is insufficient and changes nothing', async () => {
      const id = await createVehicle(1);

      const res = await request(app)
        .post(`/api/vehicles/${id}/purchase`)
        .set('Authorization', alice.auth)
        .send({ quantity: 2 });

      expect(res.status).toBe(409);
      expect(await stockOf(id)).toBe(1);
      expect(await prisma.purchase.count()).toBe(0);
    });

    it('returns 409 when out of stock', async () => {
      const id = await createVehicle(0);
      const res = await request(app).post(`/api/vehicles/${id}/purchase`).set('Authorization', alice.auth);
      expect(res.status).toBe(409);
    });

    it('returns 404 for an unknown vehicle', async () => {
      const res = await request(app).post(`/api/vehicles/${UNKNOWN_ID}/purchase`).set('Authorization', alice.auth);
      expect(res.status).toBe(404);
    });

    it.each([0, -1, 1.5, 'two'])('returns 400 for quantity %p', async (quantity) => {
      const id = await createVehicle(5);
      const res = await request(app)
        .post(`/api/vehicles/${id}/purchase`)
        .set('Authorization', alice.auth)
        .send({ quantity });
      expect(res.status).toBe(400);
    });
  });

  // End-to-end check that racing HTTP buyers get 201/409 and consistent stock.
  // supertest staggers requests, so this does NOT reliably detect a race on its
  // own; the overselling guarantee is proven in PrismaInventoryRepository.test.ts.
  describe('concurrent purchases over HTTP (end-to-end status codes)', () => {
    const buyConcurrently = (id: string, buyers: number) =>
      Promise.all(
        Array.from({ length: buyers }, (_, i) =>
          request(app)
            .post(`/api/vehicles/${id}/purchase`)
            .set('Authorization', i % 2 ? alice.auth : bob.auth),
        ),
      );

    it('sells the last unit exactly once when 5 buyers race for it', async () => {
      const id = await createVehicle(1);

      const results = await buyConcurrently(id, 5);

      expect(results.filter((r) => r.status === 201)).toHaveLength(1);
      expect(results.filter((r) => r.status === 409)).toHaveLength(4);
      expect(await stockOf(id)).toBe(0);
      expect(await prisma.purchase.count()).toBe(1);
    });

    it('sells exactly 3 units when 10 buyers race for 3 in stock', async () => {
      const id = await createVehicle(3);

      const results = await buyConcurrently(id, 10);

      expect(results.filter((r) => r.status === 201)).toHaveLength(3);
      expect(results.filter((r) => r.status === 409)).toHaveLength(7);
      expect(await stockOf(id)).toBe(0);
      expect(await prisma.purchase.count()).toBe(3);
    });
  });

  describe('POST /api/vehicles/:id/restock', () => {
    it('returns 401 without a token and 403 for a regular user', async () => {
      const id = await createVehicle(0);

      expect((await request(app).post(`/api/vehicles/${id}/restock`).send({ amount: 5 })).status).toBe(401);
      const asUser = await request(app).post(`/api/vehicles/${id}/restock`).set('Authorization', alice.auth).send({ amount: 5 });
      expect(asUser.status).toBe(403);
    });

    it('increases stock for an admin', async () => {
      const id = await createVehicle(1);

      const res = await request(app).post(`/api/vehicles/${id}/restock`).set('Authorization', admin.auth).send({ amount: 5 });

      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(6);
      expect(await stockOf(id)).toBe(6);
    });

    it('returns 404 for an unknown vehicle', async () => {
      const res = await request(app)
        .post(`/api/vehicles/${UNKNOWN_ID}/restock`)
        .set('Authorization', admin.auth)
        .send({ amount: 5 });
      expect(res.status).toBe(404);
    });

    it.each([[{}], [{ amount: 0 }], [{ amount: -2 }], [{ amount: 2.5 }]])('returns 400 for body %p', async (body) => {
      const id = await createVehicle(1);
      const res = await request(app).post(`/api/vehicles/${id}/restock`).set('Authorization', admin.auth).send(body);
      expect(res.status).toBe(400);
    });
  });

  describe('purchase history', () => {
    beforeEach(async () => {
      const id = await createVehicle(5);
      await request(app).post(`/api/vehicles/${id}/purchase`).set('Authorization', alice.auth);
      await request(app).post(`/api/vehicles/${id}/purchase`).set('Authorization', bob.auth).send({ quantity: 2 });
    });

    it("GET /api/purchases/me returns only the caller's purchases", async () => {
      const res = await request(app).get('/api/purchases/me').set('Authorization', alice.auth);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ userId: alice.id, make: 'Honda', model: 'Civic', quantity: 1 });
    });

    it('GET /api/purchases returns every purchase with the customer for an admin', async () => {
      const res = await request(app).get('/api/purchases').set('Authorization', admin.auth);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.map((p: { customer: { email: string } }) => p.customer.email).sort())
        .toEqual(['alice@example.com', 'bob@example.com']);
    });

    it('GET /api/purchases returns 403 for a regular user and 401 without a token', async () => {
      expect((await request(app).get('/api/purchases').set('Authorization', alice.auth)).status).toBe(403);
      expect((await request(app).get('/api/purchases')).status).toBe(401);
      expect((await request(app).get('/api/purchases/me')).status).toBe(401);
    });
  });

  describe('deleting (archiving) a vehicle', () => {
    let id: string;

    beforeEach(async () => {
      id = await createVehicle(3, { model: 'Accord' });
      await request(app).post(`/api/vehicles/${id}/purchase`).set('Authorization', alice.auth);
      const del = await request(app).delete(`/api/vehicles/${id}`).set('Authorization', admin.auth);
      expect(del.status).toBe(204);
    });

    it('keeps purchase history with the vehicle details', async () => {
      const res = await request(app).get('/api/purchases/me').set('Authorization', alice.auth);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({ vehicleId: id, make: 'Honda', model: 'Accord' });
    });

    it('hides the vehicle from listing and search', async () => {
      const list = await request(app).get('/api/vehicles').set('Authorization', alice.auth);
      const search = await request(app).get('/api/vehicles/search?model=accord').set('Authorization', alice.auth);

      expect(list.body).toHaveLength(0);
      expect(search.body).toHaveLength(0);
    });

    it('treats the archived vehicle as not found for every other operation', async () => {
      const purchase = await request(app).post(`/api/vehicles/${id}/purchase`).set('Authorization', alice.auth);
      const restock = await request(app).post(`/api/vehicles/${id}/restock`).set('Authorization', admin.auth).send({ amount: 1 });
      const update = await request(app).put(`/api/vehicles/${id}`).set('Authorization', admin.auth).send({ price: 1 });
      const deleteAgain = await request(app).delete(`/api/vehicles/${id}`).set('Authorization', admin.auth);

      expect([purchase.status, restock.status, update.status, deleteAgain.status]).toEqual([404, 404, 404, 404]);
    });
  });

  describe('tokens of changed accounts', () => {
    it('returns 401 (not 500) when a deleted user tries to purchase with an old token', async () => {
      const id = await createVehicle(1);
      const ghost = await createUserWithToken(prisma, 'USER', 'ghost@example.com');
      await prisma.user.delete({ where: { id: ghost.id } });

      const res = await request(app).post(`/api/vehicles/${id}/purchase`).set('Authorization', ghost.auth);

      expect(res.status).toBe(401);
      expect(await stockOf(id)).toBe(1);
    });

    it('returns 403 when an admin demoted after login tries to restock', async () => {
      const id = await createVehicle(1);
      await prisma.user.update({ where: { id: admin.id }, data: { role: 'USER' } });

      const res = await request(app).post(`/api/vehicles/${id}/restock`).set('Authorization', admin.auth).send({ amount: 5 });

      expect(res.status).toBe(403);
      expect(await stockOf(id)).toBe(1);
    });
  });

  describe('database constraints', () => {
    it('rejects negative stock even if application code tried to write it', async () => {
      const id = await createVehicle(1);

      await expect(prisma.vehicle.update({ where: { id }, data: { quantity: -1 } })).rejects.toThrow();
    });
  });
});
