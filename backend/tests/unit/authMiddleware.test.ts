import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createAuthenticate } from '../../src/middleware/authenticate';
import { requireAdmin } from '../../src/middleware/requireAdmin';
import { errorHandler } from '../../src/middleware/errorHandler';

const SECRET = 'test-secret';

function tokenFor(role: 'USER' | 'ADMIN', options: jwt.SignOptions = {}): string {
  return jwt.sign({ role }, SECRET, { subject: 'user-1', expiresIn: '1h', ...options });
}

/** Minimal app wiring the middleware the same way real routes will. */
function buildApp(): Express {
  const app = express();
  const authenticate = createAuthenticate(SECRET);
  const ok = (req: express.Request, res: express.Response) => res.json({ user: req.user });

  app.get('/protected', authenticate, ok);
  app.get('/admin', authenticate, requireAdmin, ok);
  // requireAdmin used without authenticate must still fail safely
  app.get('/admin-unauthenticated', requireAdmin, ok);
  app.use(errorHandler);
  return app;
}

describe('authenticate middleware (401 on missing/invalid token)', () => {
  const app = buildApp();

  it('returns 401 when the Authorization header is missing', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('returns 401 when the scheme is not Bearer', async () => {
    const res = await request(app).get('/protected').set('Authorization', `Basic ${tokenFor('USER')}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for a malformed token', async () => {
    const res = await request(app).get('/protected').set('Authorization', 'Bearer not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a token signed with a different secret', async () => {
    const forged = jwt.sign({ role: 'ADMIN' }, 'other-secret', { subject: 'user-1' });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired token', async () => {
    const expired = tokenFor('USER', { expiresIn: -10 });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  it('attaches the user id and role for a valid token', async () => {
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${tokenFor('USER')}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 'user-1', role: 'USER' });
  });
});

describe('requireAdmin middleware (403 for logged-in non-admins)', () => {
  const app = buildApp();

  it('returns 401 (not 403) when no token is sent to an admin route', async () => {
    const res = await request(app).get('/admin');
    expect(res.status).toBe(401);
  });

  it('returns 403 when a logged-in regular user calls an admin route', async () => {
    const res = await request(app).get('/admin').set('Authorization', `Bearer ${tokenFor('USER')}`);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: expect.any(String) });
  });

  it('lets an admin through', async () => {
    const res = await request(app).get('/admin').set('Authorization', `Bearer ${tokenFor('ADMIN')}`);
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('ADMIN');
  });

  it('returns 401 if used without authenticate in front of it', async () => {
    const res = await request(app).get('/admin-unauthenticated');
    expect(res.status).toBe(401);
  });
});
