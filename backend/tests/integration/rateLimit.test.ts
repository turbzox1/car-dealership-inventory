import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { AppDependencies, createApp } from '../../src/app';
import { createTestPrisma, resetDatabase, TEST_JWT_SECRET } from './helpers/testDb';

const LIMITS = { login: 3, register: 2, windowMs: 60_000 };
const credentials = { email: 'asha@example.com', password: 'secret123' };

describe('Auth rate limiting (Postgres)', () => {
  let prisma: PrismaClient;

  /** A fresh app per test gives each test its own limiter counters. */
  const build = (overrides: Partial<AppDependencies> = {}) =>
    createApp({ prisma, jwtSecret: TEST_JWT_SECRET, rateLimits: LIMITS, ...overrides });

  const wrongLogin = (app: ReturnType<typeof build>) =>
    request(app).post('/api/auth/login').send({ ...credentials, password: 'wrong-pass' });

  beforeAll(() => {
    prisma = createTestPrisma();
  });

  beforeEach(async () => {
    await resetDatabase(prisma);
  });

  afterAll(() => prisma.$disconnect());

  it('blocks login with a JSON 429 after too many failed attempts', async () => {
    const app = build();
    await request(app).post('/api/auth/register').send({ name: 'Asha', ...credentials });

    const statuses = [];
    for (let i = 0; i < LIMITS.login + 1; i++) statuses.push((await wrongLogin(app)).status);

    expect(statuses).toEqual([401, 401, 401, 429]);
    const blocked = await wrongLogin(app);
    expect(blocked.body).toEqual({ error: expect.stringMatching(/too many/i) });
    expect(blocked.headers['retry-after']).toBeDefined();
  });

  it('also blocks the correct password once the limit is reached', async () => {
    const app = build();
    await request(app).post('/api/auth/register').send({ name: 'Asha', ...credentials });
    for (let i = 0; i < LIMITS.login; i++) await wrongLogin(app);

    const res = await request(app).post('/api/auth/login').send(credentials);

    expect(res.status).toBe(429);
  });

  it('does not count successful logins towards the limit', async () => {
    const app = build();
    await request(app).post('/api/auth/register').send({ name: 'Asha', ...credentials });

    const statuses = [];
    for (let i = 0; i < LIMITS.login + 3; i++) {
      statuses.push((await request(app).post('/api/auth/login').send(credentials)).status);
    }

    expect(statuses.every((s) => s === 200)).toBe(true);
  });

  it('limits registrations per client', async () => {
    const app = build();

    const statuses = [];
    for (let i = 0; i < LIMITS.register + 1; i++) {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'User', email: `user${i}@example.com`, password: 'secret123' });
      statuses.push(res.status);
    }

    expect(statuses).toEqual([201, 201, 429]);
  });

  it('does not rate-limit other routes', async () => {
    const app = build();
    for (let i = 0; i < LIMITS.login + 2; i++) await wrongLogin(app);

    expect((await request(app).get('/api/health')).status).toBe(200);
  });

  describe('client IP behind a proxy', () => {
    it('with trustProxy, counts each X-Forwarded-For client separately', async () => {
      const app = build({ trustProxy: 1 });

      for (let i = 0; i < LIMITS.login; i++) await wrongLogin(app).set('X-Forwarded-For', '203.0.113.1');
      const otherClient = await wrongLogin(app).set('X-Forwarded-For', '203.0.113.2');

      expect(otherClient.status).toBe(401);
    });

    it('without trustProxy, ignores X-Forwarded-For so the limit cannot be dodged by spoofing it', async () => {
      const app = build();

      for (let i = 0; i < LIMITS.login; i++) await wrongLogin(app).set('X-Forwarded-For', `198.51.100.${i}`);
      const res = await wrongLogin(app).set('X-Forwarded-For', '198.51.100.99');

      expect(res.status).toBe(429);
    });
  });
});
