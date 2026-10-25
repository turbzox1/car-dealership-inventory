import { PrismaClient } from '@prisma/client';
import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';
import { createTestPrisma, createUserWithToken, resetDatabase, TEST_JWT_SECRET } from './helpers/testDb';

const UNKNOWN_ID = '00000000-0000-0000-0000-000000000000';

const photo = {
  url: 'https://upload.wikimedia.org/a/1280px-car.jpg',
  thumbUrl: 'https://upload.wikimedia.org/a/480px-car.jpg',
  title: '2024 Example Car',
  author: 'Jane Photographer',
  license: 'CC BY-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Car.jpg',
};

const details = {
  year: 2025,
  fuelType: 'Hybrid',
  transmission: 'Automatic',
  seats: 5,
  description: 'A comfortable family SUV with a frugal hybrid drivetrain.',
};

describe('Vehicle details (Postgres)', () => {
  let prisma: PrismaClient;
  let app: Express;
  let ADMIN: string;
  let USER: string;

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

  describe('GET /api/vehicles/:id', () => {
    it('returns the vehicle with its details and photos', async () => {
      const { id } = await prisma.vehicle.create({
        data: { make: 'Toyota', model: 'RAV4', category: 'SUV', price: 31275, quantity: 6, ...details, images: [photo] },
      });

      const res = await request(app).get(`/api/vehicles/${id}`).set('Authorization', USER);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id, make: 'Toyota', model: 'RAV4', price: 31275, ...details, images: [photo] });
    });

    it('returns empty details for a vehicle created without them', async () => {
      const { id } = await prisma.vehicle.create({ data: { make: 'Plain', model: 'Car', category: 'SEDAN', price: 1000, quantity: 1 } });

      const res = await request(app).get(`/api/vehicles/${id}`).set('Authorization', USER);

      expect(res.body).toMatchObject({ year: null, fuelType: null, transmission: null, seats: null, description: null, images: [] });
    });

    it('returns 404 for an unknown or archived vehicle, 401 without a token', async () => {
      const { id } = await prisma.vehicle.create({
        data: { make: 'Old', model: 'Car', category: 'SEDAN', price: 1000, quantity: 1, isArchived: true },
      });

      expect((await request(app).get(`/api/vehicles/${UNKNOWN_ID}`).set('Authorization', USER)).status).toBe(404);
      expect((await request(app).get(`/api/vehicles/${id}`).set('Authorization', USER)).status).toBe(404);
      expect((await request(app).get(`/api/vehicles/${id}`)).status).toBe(401);
    });

    it('includes photos in the list too, so cards can show them', async () => {
      await prisma.vehicle.create({
        data: { make: 'Toyota', model: 'RAV4', category: 'SUV', price: 31275, quantity: 6, images: [photo] },
      });

      const res = await request(app).get('/api/vehicles').set('Authorization', USER);

      expect(res.body[0].images).toEqual([photo]);
    });
  });

  describe('admins can set the basic details', () => {
    const base = { make: 'Kia', model: 'EV9', category: 'EV', price: 54900, quantity: 2 };

    it('on create', async () => {
      const res = await request(app).post('/api/vehicles').set('Authorization', ADMIN).send({ ...base, ...details, fuelType: 'Electric' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ ...details, fuelType: 'Electric' });
    });

    it('on update, leaving other fields untouched', async () => {
      const created = await request(app).post('/api/vehicles').set('Authorization', ADMIN).send({ ...base, ...details });

      const res = await request(app)
        .put(`/api/vehicles/${created.body.id}`)
        .set('Authorization', ADMIN)
        .send({ description: 'Updated copy.', seats: 7 });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ ...details, description: 'Updated copy.', seats: 7, price: 54900 });
    });

    it.each([
      ['an unknown fuel type', { fuelType: 'Steam' }],
      ['an unknown transmission', { transmission: 'Telepathic' }],
      ['a year far in the future', { year: 2099 }],
      ['zero seats', { seats: 0 }],
      ['a very long description', { description: 'x'.repeat(1001) }],
    ])('rejects %s with 400', async (_case, bad) => {
      const res = await request(app).post('/api/vehicles').set('Authorization', ADMIN).send({ ...base, ...bad });
      expect(res.status).toBe(400);
    });

    it('does not let the API set photos (they come from the curated seed)', async () => {
      const res = await request(app).post('/api/vehicles').set('Authorization', ADMIN).send({ ...base, images: [photo] });
      expect(res.status).toBe(201);
      expect(res.body.images).toEqual([]);
    });
  });
});
