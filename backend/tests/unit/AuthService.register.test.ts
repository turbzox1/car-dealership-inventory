import bcrypt from 'bcryptjs';
import { AuthService } from '../../src/services/AuthService';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { ConflictError } from '../../src/domain/errors';

describe('AuthService.register', () => {
  let users: InMemoryUserRepository;
  let auth: AuthService;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    auth = new AuthService(users, 'test-secret');
  });

  it('creates a regular user and never returns the password', async () => {
    const user = await auth.register({ name: 'Asha', email: 'asha@example.com', password: 'secret123' });

    expect(user).toMatchObject({ name: 'Asha', email: 'asha@example.com', role: 'USER' });
    expect(user).not.toHaveProperty('password');
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('stores a hashed password, not the plain text', async () => {
    await auth.register({ name: 'Asha', email: 'asha@example.com', password: 'secret123' });

    const stored = await users.findByEmail('asha@example.com');
    expect(stored?.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    expect(await bcrypt.compare('secret123', stored!.passwordHash)).toBe(true);
  });

  it('rejects a duplicate email', async () => {
    await auth.register({ name: 'Asha', email: 'asha@example.com', password: 'secret123' });

    await expect(
      auth.register({ name: 'Other', email: 'asha@example.com', password: 'another1' }),
    ).rejects.toThrow(ConflictError);
  });
});
