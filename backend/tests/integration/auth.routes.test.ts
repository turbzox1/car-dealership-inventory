import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/app';
import { createTestPrisma, resetDatabase, TEST_JWT_SECRET } from './helpers/testDb';

describe('Auth routes (Postgres)', () => {
  let prisma: PrismaClient;
  let app: Express;

  const asha = { name: 'Asha', email: 'asha@example.com', password: 'secret123' };

  beforeAll(() => {
    prisma = createTestPrisma();
    // Limits are tested in rateLimit.test.ts; keep them out of the way here
    app = createApp({ prisma, jwtSecret: TEST_JWT_SECRET, rateLimits: { login: 1000, register: 1000, windowMs: 60_000 } });
  });

  beforeEach(() => resetDatabase(prisma));

  afterAll(() => prisma.$disconnect());

  describe('POST /api/auth/register', () => {
    it('creates a user, returns 201 without the password and stores it in the database', async () => {
      const res = await request(app).post('/api/auth/register').send(asha);

      expect(res.status).toBe(201);
      expect(res.body.user).toMatchObject({ name: 'Asha', email: 'asha@example.com', role: 'USER' });
      expect(res.body.user).not.toHaveProperty('passwordHash');

      const stored = await prisma.user.findUnique({ where: { email: 'asha@example.com' } });
      expect(stored).not.toBeNull();
      expect(stored!.passwordHash).not.toBe('secret123');
    });

    it('returns 409 for an email that is already registered', async () => {
      await request(app).post('/api/auth/register').send(asha);

      const res = await request(app).post('/api/auth/register').send({ ...asha, name: 'Other' });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ error: expect.any(String) });
    });

    it('creates exactly one account when the same email registers concurrently', async () => {
      const results = await Promise.all(
        Array.from({ length: 5 }, () => request(app).post('/api/auth/register').send(asha)),
      );

      expect(results.filter((r) => r.status === 201)).toHaveLength(1);
      expect(results.filter((r) => r.status === 409)).toHaveLength(4);
      expect(await prisma.user.count({ where: { email: 'asha@example.com' } })).toBe(1);
    });

    it('treats emails case-insensitively', async () => {
      await request(app).post('/api/auth/register').send(asha);

      const res = await request(app).post('/api/auth/register').send({ ...asha, email: ' ASHA@Example.com ' });

      expect(res.status).toBe(409);
    });

    it.each([
      ['missing name', { email: 'a@example.com', password: 'secret123' }],
      ['invalid email', { name: 'A', email: 'not-an-email', password: 'secret123' }],
      ['short password', { name: 'A', email: 'a@example.com', password: 'short' }],
      ['empty body', {}],
    ])('returns 400 for %s', async (_case, body) => {
      const res = await request(app).post('/api/auth/register').send(body);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: expect.any(String) });
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(asha);
    });

    it('returns 200 with a valid JWT and the user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'asha@example.com', password: 'secret123' });

      expect(res.status).toBe(200);
      expect(res.body.user).toMatchObject({ email: 'asha@example.com', role: 'USER' });
      const payload = jwt.verify(res.body.token, TEST_JWT_SECRET) as jwt.JwtPayload;
      expect(payload.sub).toBe(res.body.user.id);
    });

    it('accepts the email in any letter case', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'Asha@Example.COM', password: 'secret123' });

      expect(res.status).toBe(200);
    });

    it('returns 401 for a wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'asha@example.com', password: 'wrong-pass' });

      expect(res.status).toBe(401);
    });

    it('returns 401 for an unknown email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@example.com', password: 'secret123' });

      expect(res.status).toBe(401);
    });

    it('returns 400 when fields are missing', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'asha@example.com' });

      expect(res.status).toBe(400);
    });
  });
});
