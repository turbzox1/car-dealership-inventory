import { AuthService } from '../../src/services/AuthService';
import { InMemoryUserRepository } from '../fakes/InMemoryUserRepository';
import { NotFoundError } from '../../src/domain/errors';

describe('AuthService.getProfile', () => {
  let auth: AuthService;

  beforeEach(() => {
    auth = new AuthService(new InMemoryUserRepository(), 'test-secret');
  });

  it('returns the current account without credentials', async () => {
    const { id } = await auth.register({ name: 'Asha', email: 'asha@example.com', password: 'secret123' });

    const profile = await auth.getProfile(id);

    expect(profile).toMatchObject({ id, name: 'Asha', email: 'asha@example.com', role: 'USER' });
    expect(profile).not.toHaveProperty('passwordHash');
  });

  it('throws NotFoundError for an unknown id', async () => {
    await expect(auth.getProfile('missing-id')).rejects.toThrow(NotFoundError);
  });
});
