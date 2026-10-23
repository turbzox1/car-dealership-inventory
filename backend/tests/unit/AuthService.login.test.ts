import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/services/AuthService';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { UnauthorizedError } from '../../src/domain/errors';

const SECRET = 'test-secret';

describe('AuthService.login', () => {
  let auth: AuthService;

  beforeEach(async () => {
    auth = new AuthService(new InMemoryUserRepository(), SECRET);
    await auth.register({ name: 'Asha', email: 'asha@example.com', password: 'secret123' });
  });

  it('returns a signed JWT carrying the user id and role', async () => {
    const { token, user } = await auth.login({ email: 'asha@example.com', password: 'secret123' });

    const payload = jwt.verify(token, SECRET) as jwt.JwtPayload;
    expect(payload.sub).toBe(user.id);
    expect(payload.role).toBe('USER');
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('rejects an unknown email', async () => {
    await expect(auth.login({ email: 'nobody@example.com', password: 'secret123' }))
      .rejects.toThrow(UnauthorizedError);
  });

  it('rejects a wrong password', async () => {
    await expect(auth.login({ email: 'asha@example.com', password: 'wrong-pass' }))
      .rejects.toThrow(UnauthorizedError);
  });
});
