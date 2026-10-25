import { PrismaClient } from '@prisma/client';
import { Express } from 'express';
import request from 'supertest';
import { createApp } from '../../src/app';
import { createTestPrisma, TEST_JWT_SECRET } from './helpers/testDb';

const FRONTEND = 'http://localhost:5173';

describe('App-wide behaviour', () => {
  let prisma: PrismaClient;
  let app: Express;

  beforeAll(() => {
    prisma = createTestPrisma();
    app = createApp({ prisma, jwtSecret: TEST_JWT_SECRET, corsOrigins: [FRONTEND] });
  });

  afterAll(() => prisma.$disconnect());

  it('GET /api/health returns 200 without authentication', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('returns 400 (not 500) for a malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "broken"');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('returns 413 (not 500) for a body over the size limit', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'a@b.co', password: 'x'.repeat(200_000) }));
    expect(res.status).toBe(413);
    expect(res.body).toEqual({ error: 'Request body is too large' });
  });

  it('sends security headers on API responses', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-security-policy']).toBe("default-src 'none';frame-ancestors 'none'");
    expect(res.headers['strict-transport-security']).toMatch(/max-age=\d+/);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
  });

  describe('CORS', () => {
    it('allows the configured frontend origin, including preflight for Authorization', async () => {
      const res = await request(app)
        .options('/api/vehicles')
        .set('Origin', FRONTEND)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Authorization, Content-Type');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(FRONTEND);
      expect(res.headers['access-control-allow-headers']).toMatch(/authorization/i);
    });

    it('does not allow other origins', async () => {
      const res = await request(app).get('/api/health').set('Origin', 'https://evil.example.com');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
