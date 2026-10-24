import { PrismaClient } from '@prisma/client';
import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';
import { createTestPrisma, createUserWithToken, resetDatabase, TEST_JWT_SECRET } from './helpers/testDb';

const civic = { make: 'Honda', model: 'Civic', category: 'SEDAN', price: 24000, quantity: 3 };
const crv = { make: 'Honda', model: 'CR-V', category: 'SUV', price: 32000, quantity: 0 };
const model3 = { make: 'Tesla', model: 'Model 3', category: 'EV', price: 41000.5, quantity: 2 };

describe('Vehicle routes (Postgres)', () => {
  let prisma: PrismaClient;
  let app: Express;
  // Real users: authenticate now checks the user still exists and reads the role from the database
  let ADMIN: string;
  let USER: string;

  /** Creates vehicles through the API as an admin and returns their bodies. */
  async function seed(...vehicles: object[]) {
    const created = [];
    for (const v of vehicles) {
      const res = await request(app).post('/api/vehicles').set('Authorization', ADMIN).send(v);
      created.push(res.body);
    }
    return created;
  }

  beforeAll(() => {
    prisma = createTestPrisma();
    app = createApp({ prisma, jwtSecret: TEST_JWT_SECRET });
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
    ADMIN = (await createUserWithToken(prisma, 'ADMIN')).auth;
    USER = (await createUserWithToken(prisma, 'USER')).auth;
  });

  afterAll(() => prisma.$disconnect());

  describe('authentication and roles', () => {
    it.each([
      ['GET', '/api/vehicles'],
      ['GET', '/api/vehicles/search'],
      ['POST', '/api/vehicles'],
      ['PUT', '/api/vehicles/some-id'],
      ['DELETE', '/api/vehicles/some-id'],
    ])('%s %s returns 401 without a token', async (method, url) => {
      const res = await request(app)[method.toLowerCase() as 'get'](url);
      expect(res.status).toBe(401);
    });

    it.each([
      ['POST', '/api/vehicles'],
      ['PUT', '/api/vehicles/some-id'],
      ['DELETE', '/api/vehicles/some-id'],
    ])('%s %s returns 403 for a regular user', async (method, url) => {
      const res = await request(app)[method.toLowerCase() as 'get'](url).set('Authorization', USER).send(civic);
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/vehicles', () => {
    it('creates a vehicle and returns 201 with numeric price', async () => {
      const res = await request(app).post('/api/vehicles').set('Authorization', ADMIN).send(model3);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ ...model3, id: expect.any(String) });
      expect(await prisma.vehicle.count()).toBe(1);
    });

    it('accepts a lower-case category', async () => {
      const res = await request(app).post('/api/vehicles').set('Authorization', ADMIN).send({ ...civic, category: 'sedan' });

      expect(res.status).toBe(201);
      expect(res.body.category).toBe('SEDAN');
    });

    it.each([
      ['missing make', { ...civic, make: undefined }],
      ['empty model', { ...civic, model: '  ' }],
      ['unknown category', { ...civic, category: 'SPACESHIP' }],
      ['negative price', { ...civic, price: -1 }],
      ['zero price', { ...civic, price: 0 }],
      ['fractional quantity', { ...civic, quantity: 1.5 }],
      ['negative quantity', { ...civic, quantity: -2 }],
    ])('returns 400 for %s', async (_case, body) => {
      const res = await request(app).post('/api/vehicles').set('Authorization', ADMIN).send(body);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/vehicles', () => {
    it('lets a regular user list all vehicles, including out-of-stock ones', async () => {
      await seed(civic, crv);

      const res = await request(app).get('/api/vehicles').set('Authorization', USER);

      expect(res.status).toBe(200);
      expect(res.body.map((v: { model: string }) => v.model).sort()).toEqual(['CR-V', 'Civic']);
    });
  });

  describe('GET /api/vehicles/search', () => {
    beforeEach(() => seed(civic, crv, model3));

    const models = (res: request.Response) => res.body.map((v: { model: string }) => v.model).sort();

    it('matches make partially and case-insensitively', async () => {
      const res = await request(app).get('/api/vehicles/search?make=hon').set('Authorization', USER);
      expect(res.status).toBe(200);
      expect(models(res)).toEqual(['CR-V', 'Civic']);
    });

    it('matches model partially and case-insensitively', async () => {
      const res = await request(app).get('/api/vehicles/search?model=MODEL').set('Authorization', USER);
      expect(models(res)).toEqual(['Model 3']);
    });

    it('filters by category (any case)', async () => {
      const res = await request(app).get('/api/vehicles/search?category=suv').set('Authorization', USER);
      expect(models(res)).toEqual(['CR-V']);
    });

    it('filters by an inclusive price range', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?minPrice=24000&maxPrice=32000')
        .set('Authorization', USER);
      expect(models(res)).toEqual(['CR-V', 'Civic']);
    });

    it('combines filters', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?make=honda&maxPrice=30000')
        .set('Authorization', USER);
      expect(models(res)).toEqual(['Civic']);
    });

    it('returns everything when no filters are given', async () => {
      const res = await request(app).get('/api/vehicles/search').set('Authorization', USER);
      expect(res.body).toHaveLength(3);
    });

    it.each([
      ['non-numeric price', '?minPrice=cheap'],
      ['unknown category', '?category=SPACESHIP'],
      ['min above max', '?minPrice=50000&maxPrice=1000'],
    ])('returns 400 for %s', async (_case, query) => {
      const res = await request(app).get(`/api/vehicles/search${query}`).set('Authorization', USER);
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/vehicles/:id', () => {
    it('updates details and returns the vehicle', async () => {
      const [created] = await seed(civic);

      const res = await request(app)
        .put(`/api/vehicles/${created.id}`)
        .set('Authorization', ADMIN)
        .send({ price: 22500, model: 'Civic Sport' });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: created.id, price: 22500, model: 'Civic Sport', quantity: 3 });
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .put('/api/vehicles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', ADMIN)
        .send({ price: 1000 });
      expect(res.status).toBe(404);
    });

    it.each([
      ['empty body', {}],
      ['quantity (use purchase/restock instead)', { quantity: 10 }],
      ['invalid price', { price: -5 }],
    ])('returns 400 for %s', async (_case, body) => {
      const [created] = await seed(civic);
      const res = await request(app).put(`/api/vehicles/${created.id}`).set('Authorization', ADMIN).send(body);
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/vehicles/:id', () => {
    it('archives the vehicle (soft delete) and returns 204', async () => {
      const [created] = await seed(civic);

      const res = await request(app).delete(`/api/vehicles/${created.id}`).set('Authorization', ADMIN);

      expect(res.status).toBe(204);
      const row = await prisma.vehicle.findUniqueOrThrow({ where: { id: created.id } });
      expect(row.isArchived).toBe(true);
    });

    it('returns 404 for an unknown id', async () => {
      const res = await request(app)
        .delete('/api/vehicles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', ADMIN);
      expect(res.status).toBe(404);
    });
  });
});
