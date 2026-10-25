import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createAuthenticate, UserLookup } from '../../src/middleware/authenticate';
import { requireAdmin } from '../../src/middleware/requireAdmin';
import { errorHandler } from '../../src/middleware/errorHandler';
import { Role } from '../../src/domain/User';

const SECRET = 'test-secret';

/** Current state of the user table, as authenticate sees it. Tests mutate this. */
let usersInDb: Map<string, Role>;

const lookup: UserLookup = {
  findAuthUserById: async (id) => {
    const role = usersInDb.get(id);
    return role ? { id, role } : null;
  },
};

/** Token as issued at login: subject is the user id, role claim is what the role was then. */
function tokenFor(role: Role, options: jwt.SignOptions = {}, subject = role === 'ADMIN' ? 'admin-1' : 'user-1'): string {
  return jwt.sign({ role }, SECRET, { subject, expiresIn: '1h', ...options });
}

/** Minimal app wiring the middleware the same way real routes will. */
function buildApp(): Express {
  const app = express();
  const authenticate = createAuthenticate(SECRET, lookup);
  const ok = (req: express.Request, res: express.Response) => res.json({ user: req.user });

  app.get('/protected', authenticate, ok);
  app.get('/admin', authenticate, requireAdmin, ok);
  // requireAdmin used without authenticate must still fail safely
  app.get('/admin-unauthenticated', requireAdmin, ok);
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  usersInDb = new Map<string, Role>([['user-1', 'USER'], ['admin-1', 'ADMIN']]);
});

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
    const forged = jwt.sign({ role: 'ADMIN' }, 'other-secret', { subject: 'admin-1' });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 for a correctly signed token that uses an algorithm other than HS256', async () => {
    const hs512 = tokenFor('USER', { algorithm: 'HS512' });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${hs512}`);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid or expired token' });
  });

  it('returns 401 for an unsigned (alg: none) token', async () => {
    const unsigned = jwt.sign({ role: 'ADMIN' }, '', { algorithm: 'none', subject: 'admin-1' });
    const res = await request(app).get('/protected').set('Authorization', `Bearer ${unsigned}`);
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

describe('authenticate uses the current database state, not the token claims', () => {
  const app = buildApp();

  it('returns 401 when the user behind a valid token has been deleted', async () => {
    usersInDb.delete('user-1');

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${tokenFor('USER')}`);

    expect(res.status).toBe(401);
  });

  it('returns 403 on admin routes for an admin demoted after login', async () => {
    const tokenIssuedWhileAdmin = tokenFor('ADMIN');
    usersInDb.set('admin-1', 'USER');

    const res = await request(app).get('/admin').set('Authorization', `Bearer ${tokenIssuedWhileAdmin}`);

    expect(res.status).toBe(403);
  });

  it('ignores a role claim that does not match the database', async () => {
    // Token says ADMIN for a user who is only a USER (e.g. issued before a demotion)
    const token = tokenFor('ADMIN', {}, 'user-1');

    const res = await request(app).get('/protected').set('Authorization', `Bearer ${token}`);

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
